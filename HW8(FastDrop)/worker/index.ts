import { PART_SIZE, POOL_MAX, ROOM_RE, TOKEN_RE, expectedPartSize, expectedParts, missingMultipartUpload, randomCode, randomToken, validFile } from './logic.js'

interface Bindings { fastdrop_db: D1Database; y: R2Bucket }
type FileRow = { id: string; owner_token: string; download_token: string; name: string; mime: string; size: number; expires_at: number; delete_after_download: number; status: string; r2_key: string; upload_id: string | null; created_at: number; uploaded_at: number | null; uploader_os: string }
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
const fail = (message: string, status = 400) => json({ error: message }, status)
const now = () => Date.now()
const bearer = (req: Request) => req.headers.get('authorization')?.replace(/^Bearer /, '') ?? ''
async function safeJson(req: Request, max = 2048): Promise<unknown> {
  if (Number(req.headers.get('content-length') || 0) > max) throw new Error('請求內容過大')
  if (!req.body) throw new SyntaxError('Missing JSON')
  const reader = req.body.getReader(), chunks: Uint8Array[] = []
  let size = 0
  while (true) {
    const part = await reader.read()
    if (part.done) break
    size += part.value.byteLength
    if (size > max) { await reader.cancel(); throw new Error('請求內容過大') }
    chunks.push(part.value)
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
  return JSON.parse(new TextDecoder().decode(bytes)) as unknown
}
const filePublic = (f: FileRow) => ({ id: f.id, name: f.name, mime: f.mime, size: f.size, expiresAt: f.expires_at, status: f.status, deleteAfterDownload: !!f.delete_after_download })
async function fileByOwner(db: D1Database, id: string, token: string) {
  if (!TOKEN_RE.test(token) || !TOKEN_RE.test(id)) return null
  return db.prepare('SELECT * FROM files WHERE id=? AND owner_token=?').bind(id, token).first<FileRow>()
}
async function promote(db: D1Database) {
  const time = now()
  await db.prepare("UPDATE files SET status='reserved' WHERE id=(SELECT id FROM files WHERE status='waiting' AND expires_at>? ORDER BY created_at,id LIMIT 1) AND size<=(SELECT ?-used_bytes FROM pool WHERE id=1)")
    .bind(time, POOL_MAX).run()
}
async function removeStorage(env: Bindings, f: FileRow) {
  if (f.upload_id && ['uploading', 'finalizing', 'failed'].includes(f.status)) {
    const completed = await env.y.head(f.r2_key)
    if (!completed) {
      try { await env.y.resumeMultipartUpload(f.r2_key, f.upload_id).abort() }
      catch (error) { if (!missingMultipartUpload(error)) throw error }
    }
  }
  await env.y.delete(f.r2_key)
}
export async function cleanup(env: Bindings) {
  const db = env.fastdrop_db
  // Waiting rows have no R2 object or reservation. Remove them in bulk so a
  // large expired queue cannot consume the per-run object cleanup allowance.
  await db.prepare("DELETE FROM files WHERE status='waiting' AND expires_at<=?").bind(now()).run()
  // A final multipart completion may be in flight at expiry. Give it time to settle,
  // while the download API still rejects the expired file immediately.
  const time = now()
  const rows = await db.prepare("SELECT * FROM files WHERE (expires_at<=? AND (status!='finalizing' OR expires_at<=?)) OR status IN ('failed','deleted') LIMIT 50")
    .bind(time, time - 2 * 60_000).all<FileRow>()
  for (const f of rows.results) {
    try {
      await removeStorage(env, f)
      await db.prepare("UPDATE files SET status=? WHERE id=? AND status NOT IN ('expired','deleted')").bind(f.status === 'failed' ? 'deleted' : 'expired', f.id).run()
      await db.prepare('DELETE FROM upload_parts WHERE file_id=?').bind(f.id).run()
      await db.prepare("DELETE FROM files WHERE id=? AND status IN ('expired','deleted')").bind(f.id).run()
    } catch (error) { console.error('cleanup failed', f.id, error) }
  }
  await db.prepare('DELETE FROM signals WHERE created_at<?').bind(now() - 6 * 3600_000).run()
  await db.prepare('DELETE FROM rooms WHERE expires_at<?').bind(now()).run()
  await promote(db)
}
async function handle(req: Request, env: Bindings): Promise<Response> {
  const url = new URL(req.url), path = url.pathname, db = env.fastdrop_db
  const method = req.method
  if (path === '/api/health') return json({ ok: true })
  if (path === '/api/rooms' && method === 'POST') {
    const token = randomToken(), code = randomCode(), time = now()
    await db.prepare('INSERT INTO rooms(code,host_token,created_at,expires_at) VALUES(?,?,?,?)').bind(code, token, time, time + 6 * 3600_000).run()
    return json({ code, token, role: 'host', expiresAt: time + 6 * 3600_000 }, 201)
  }
  const roomJoin = path.match(/^\/api\/rooms\/([^/]+)\/join$/)
  if (roomJoin && method === 'POST') {
    const code = roomJoin[1].toUpperCase()
    if (!ROOM_RE.test(code)) return fail('配對碼格式錯誤')
    const token = randomToken()
    const result = await db.prepare('UPDATE rooms SET guest_token=? WHERE code=? AND guest_token IS NULL AND expires_at>?').bind(token, code, now()).run()
    if (result.meta.changes) {
      const room = await db.prepare('SELECT expires_at FROM rooms WHERE code=?').bind(code).first<{expires_at:number}>()
      return json({ code, token, role: 'guest', expiresAt: room!.expires_at })
    }
    const previousToken = bearer(req)
    const room = await db.prepare('SELECT guest_token,expires_at FROM rooms WHERE code=?').bind(code).first<{guest_token:string|null;expires_at:number}>()
    if (!room || room.expires_at <= now()) return fail('房間不存在或已過期', 410)
    if (!TOKEN_RE.test(previousToken) || previousToken !== room.guest_token) return fail('此房間已有另一裝置；請在原裝置使用相同瀏覽器重試，或建立新房間', 409)
    const latest = await db.prepare('SELECT COALESCE(MAX(id),0) AS id FROM signals WHERE room_code=?').bind(code).first<{id:number}>()
    return json({ code, token: previousToken, role: 'guest', expiresAt: room.expires_at, resumed: true, signalCursor: latest?.id ?? 0 })
  }
  const roomPath = path.match(/^\/api\/rooms\/([^/]+)\/(signals|status)$/)
  if (roomPath) {
    const code = roomPath[1].toUpperCase(), token = bearer(req)
    if (!ROOM_RE.test(code) || !TOKEN_RE.test(token)) return fail('無效的房間憑證', 401)
    const room = await db.prepare('SELECT host_token,guest_token,expires_at FROM rooms WHERE code=?').bind(code).first<{host_token:string;guest_token:string|null;expires_at:number}>()
    if (!room || room.expires_at <= now()) return fail('房間已過期', 410)
    const role = token === room.host_token ? 'host' : token === room.guest_token ? 'guest' : null
    if (!role) return fail('無權使用此房間', 403)
    if (roomPath[2] === 'status' && method === 'GET') return json({ peerJoined: !!room.guest_token, expiresAt: room.expires_at })
    if (roomPath[2] === 'signals' && method === 'POST') {
      const data = await safeJson(req, 18000) as Record<string, unknown>
      if (!data || !['offer','answer','candidate','restart'].includes(String(data.type)) || typeof data.payload !== 'object' || !data.payload) return fail('訊號格式錯誤')
      const payload = JSON.stringify(data)
      if (payload.length > 16000) return fail('訊號過大')
      const inserted = await db.prepare('INSERT INTO signals(room_code,sender,payload,created_at) SELECT ?,?,?,? WHERE (SELECT COUNT(*) FROM signals WHERE room_code=?)<500').bind(code, role, payload, now(), code).run()
      if (!inserted.meta.changes) return fail('此房間訊號數量已達上限', 429)
      return json({ ok: true })
    }
    if (roomPath[2] === 'signals' && method === 'GET') {
      const after = Number(url.searchParams.get('after') || 0)
      if (!Number.isSafeInteger(after) || after < 0) return fail('游標格式錯誤')
      const rows = await db.prepare('SELECT id,payload FROM signals WHERE room_code=? AND sender!=? AND id>? ORDER BY id LIMIT 50').bind(code, role, after).all<{id:number;payload:string}>()
      return json({ signals: rows.results.map(x => ({ id: x.id, ...JSON.parse(x.payload) })) })
    }
  }
  if (path === '/api/files' && method === 'POST') {
    const data = await safeJson(req)
    if (!validFile(data)) return fail('檔案資訊無效；雲端單檔上限 250 MB')
    const id = randomToken(), owner = randomToken(), download = randomToken(), time = now(), key = `temp/${id}`
    await db.prepare('INSERT INTO files(id,owner_token,download_token,name,mime,size,expires_at,delete_after_download,status,r2_key,created_at,uploader_os) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)')
      .bind(id, owner, download, data.name, data.mime, data.size, time + data.hours * 3600_000, data.deleteAfterDownload ? 1 : 0, 'waiting', key, time, data.uploaderOs ?? 'Other').run()
    await promote(db)
    const row = await fileByOwner(db, id, owner)
    return json({ ...filePublic(row!), ownerToken: owner, downloadToken: download }, 201)
  }
  const filePath = path.match(/^\/api\/files\/([a-f0-9]{48})(?:\/(part|complete|download|cancel|share))?$/)
  if (filePath) {
    const id = filePath[1], action = filePath[2] ?? '', token = action === 'download' || action === 'share' ? (url.searchParams.get('token') ?? bearer(req)) : bearer(req)
    if (!TOKEN_RE.test(token)) return fail('缺少檔案憑證', 401)
    if (action === 'share' && method === 'GET') {
      const f = await db.prepare('SELECT * FROM files WHERE id=? AND download_token=?').bind(id, token).first<FileRow>()
      if (!f) return fail('分享連結無效', 403)
      if (f.expires_at <= now() || f.status !== 'ready') return fail('分享已到期、已下載或尚未就緒', 410)
      return json({ name: f.name, mime: f.mime, size: f.size, uploadedAt: f.uploaded_at ?? f.created_at, expiresAt: f.expires_at, deleteAfterDownload: !!f.delete_after_download, uploaderOs: f.uploader_os })
    }
    if (action === 'download' && method === 'GET') {
      const f = await db.prepare('SELECT * FROM files WHERE id=? AND download_token=?').bind(id, token).first<FileRow>()
      if (!f) return fail('無權下載', 403)
      if (f.expires_at <= now() || f.status !== 'ready') return fail('檔案尚未就緒或已過期', 410)
      const object = await env.y.get(f.r2_key)
      if (!object) return fail('檔案不存在', 404)
      if (f.delete_after_download) {
        const result = await db.prepare("UPDATE files SET status='downloading' WHERE id=? AND status='ready' AND expires_at>?").bind(id, now()).run()
        if (!result.meta.changes) return fail('下載連結已使用', 410)
      }
      const headers = new Headers({ 'Content-Type': f.mime || 'application/octet-stream', 'Content-Length': String(f.size), 'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(f.name)}`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' })
      if (f.delete_after_download) {
        const reader = object.body.getReader()
        const stream = new ReadableStream({
          async pull(controller) {
            try {
              const chunk = await reader.read()
              if (chunk.done) {
                await env.y.delete(f.r2_key)
                await db.prepare("UPDATE files SET status='deleted' WHERE id=? AND status='downloading'").bind(id).run()
                controller.close()
              } else controller.enqueue(chunk.value)
            } catch (e) {
              await db.prepare("UPDATE files SET status='ready' WHERE id=? AND status='downloading' AND expires_at>?").bind(id, now()).run()
              controller.error(e)
            }
          },
          async cancel() {
            await reader.cancel()
            await db.prepare("UPDATE files SET status='ready' WHERE id=? AND status='downloading' AND expires_at>?").bind(id, now()).run()
          }
        })
        return new Response(stream, { headers })
      }
      return new Response(object.body, { headers })
    }
    const f = await fileByOwner(db, id, token)
    if (!f) return fail('無權管理檔案', 403)
    if (action === '' && method === 'GET') {
      if (f.status === 'waiting') await promote(db)
      const current = await fileByOwner(db, id, token)
      return json(filePublic(current!))
    }
    if (action === 'cancel' && method === 'POST') {
      await removeStorage(env, f)
      await db.prepare("UPDATE files SET status='deleted' WHERE id=? AND status IN ('waiting','reserved','uploading','finalizing','ready')").bind(id).run()
      await promote(db)
      return json({ ok: true })
    }
    if (f.expires_at <= now()) return fail('檔案已過期', 410)
    if (action === 'part' && method === 'PUT') {
      if (!['reserved','uploading'].includes(f.status)) return fail('檔案仍在排隊或不可上傳', 409)
      const n = Number(url.searchParams.get('number')), expected = expectedPartSize(f.size, n)
      if (!expected || Number(req.headers.get('content-length')) !== expected || !req.body) return fail(`分段大小錯誤；每段上限 ${PART_SIZE / 1024 / 1024} MB`)
      let uploadId = f.upload_id
      if (!uploadId) {
        const upload = await env.y.createMultipartUpload(f.r2_key)
        const update = await db.prepare("UPDATE files SET upload_id=?, status='uploading' WHERE id=? AND status='reserved' AND upload_id IS NULL").bind(upload.uploadId, id).run()
        if (!update.meta.changes) { await upload.abort(); return fail('請重試上傳', 409) }
        uploadId = upload.uploadId
      }
      const part = await env.y.resumeMultipartUpload(f.r2_key, uploadId).uploadPart(n, req.body)
      await db.prepare('INSERT INTO upload_parts(file_id,part_number,etag,size) VALUES(?,?,?,?) ON CONFLICT(file_id,part_number) DO UPDATE SET etag=excluded.etag,size=excluded.size').bind(id, n, part.etag, expected).run()
      return json({ number: n, etag: part.etag })
    }
    if (action === 'complete' && method === 'POST') {
      if (f.status !== 'uploading' || !f.upload_id) return fail('尚未上傳所有分段', 409)
      const parts = await db.prepare('SELECT part_number,etag,size FROM upload_parts WHERE file_id=? ORDER BY part_number').bind(id).all<{part_number:number;etag:string;size:number}>()
      if (parts.results.length !== expectedParts(f.size) || parts.results.some((p, i) => p.part_number !== i + 1 || p.size !== expectedPartSize(f.size, i + 1))) return fail('分段不完整', 409)
      const claimed = await db.prepare("UPDATE files SET status='finalizing' WHERE id=? AND status='uploading' AND expires_at>?").bind(id, now()).run()
      if (!claimed.meta.changes) return fail('檔案已過期或正在完成', 409)
      // On failure, retain the reservation until cleanup removes any partial upload or completed object.
      await env.y.resumeMultipartUpload(f.r2_key, f.upload_id).complete(parts.results.map(p => ({ partNumber: p.part_number, etag: p.etag })))
      await db.prepare("UPDATE files SET status='ready', uploaded_at=? WHERE id=? AND status='finalizing'").bind(now(), id).run()
      return json({ status: 'ready' })
    }
  }
  return fail('找不到此 API', 404)
}

export default {
  async fetch(request: Request, env: Bindings) {
    if (!new URL(request.url).pathname.startsWith('/api/')) return new Response(null, { status: 404 })
    try { return await handle(request, env) }
    catch (e) { console.error(e); return fail(e instanceof SyntaxError ? 'JSON 格式錯誤' : e instanceof Error && e.message === '請求內容過大' ? e.message : '伺服器處理失敗', e instanceof SyntaxError ? 400 : 500) }
  },
  async scheduled(_event: ScheduledController, env: Bindings) { await cleanup(env) }
} satisfies ExportedHandler<Bindings>
