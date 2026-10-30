import { useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { cleanupReceivedFiles, prepareReceiveTarget, rememberReceivedFile } from './receiveStorage'
import './App.css'

type Room = { code: string; token: string; role: 'host' | 'guest'; expiresAt: number }
type Transfer = { name: string; size: number; mime: string; progress: number; status: string; url?: string }
type Cloud = { id: string; name: string; mime: string; size: number; status: string; ownerToken: string; downloadToken: string; progress: number; url?: string }
type Signal = { id: number; type: 'offer' | 'answer' | 'candidate'; payload: RTCSessionDescriptionInit | RTCIceCandidateInit }
type Alert = { id: number; title: string; detail: string; kind: 'connection' | 'message' | 'file' | 'error'; url?: string; name?: string }
const MB = 1024 * 1024, P2P_MAX = 1024 * MB, CLOUD_MAX = 250_000_000, PART = 8 * MB
const formatSize = (bytes: number) => bytes >= MB ? `${(bytes / MB).toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`
async function api<T>(path: string, method = 'GET', body?: unknown, token?: string): Promise<T> {
  const res = await fetch(path, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '連線失敗')
  return data as T
}
const joinUrl = (code: string) => `${location.origin}/?room=${code}`
const downloadUrl = (id: string, token: string) => `${location.origin}/api/files/${id}/download?token=${token}`
const shareUrl = (id: string, token: string) => `${location.origin}/?file=${id}&token=${token}`

function App() {
  const [room, setRoom] = useState<Room | null>(null)
  const [codeInput, setCodeInput] = useState(new URLSearchParams(location.search).get('room') || '')
  const [connection, setConnection] = useState('尚未連線')
  const [textInput, setTextInput] = useState('')
  const [messages, setMessages] = useState<{ text: string; own: boolean }[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [cloud, setCloud] = useState<Cloud | null>(null)
  const [hours, setHours] = useState(1)
  const [deleteAfter, setDeleteAfter] = useState(false)
  const [notice, setNotice] = useState('')
  const [mode, setMode] = useState<'home' | 'join' | 'room' | 'cloud' | 'download'>(() => {
    const params = new URLSearchParams(location.search)
    return params.has('file') && params.has('token') ? 'download' : params.has('room') ? 'join' : 'home'
  })
  const [alert, setAlert] = useState<Alert | null>(null)
  const alertSequenceRef = useRef(0)
  const dcRef = useRef<RTCDataChannel | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const cursorRef = useRef(0)
  const offerStarted = useRef(false)
  const readyRef = useRef<((ok: boolean) => void) | null>(null)
  const sendingRef = useRef(false)
  const sentNameRef = useRef('')
  const incomingRef = useRef<{ name: string; size: number; mime: string; received: number; writer?: FileSystemWritableFileStream; handle?: FileSystemFileHandle; key?: string; chunks?: BlobPart[]; chain: Promise<void> } | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const cloudInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => { void cleanupReceivedFiles(navigator.storage).catch(() => {}) }, [])

  useEffect(() => {
    if (!alert) return
    const duration = alert.kind === 'message' ? 5000 : alert.kind === 'file' ? 8000 : alert.kind === 'error' ? 5500 : 3000
    const timer = window.setTimeout(() => setAlert(current => current?.id === alert.id ? null : current), duration)
    return () => window.clearTimeout(timer)
  }, [alert])

  function updateConnection(next: string) {
    setConnection(next)
    const details: Record<string, { title: string; detail: string; kind: Alert['kind'] }> = {
      '等待另一裝置加入': { title: '房間已建立', detail: '把配對碼或 QR Code 分享給另一台裝置。', kind: 'connection' },
      '正在建立點對點連線': { title: '正在連線', detail: '正在和另一台裝置建立安全連線，請稍候。', kind: 'connection' },
      '已建立點對點連線': { title: '兩端已連線', detail: '現在可以直接傳送文字和檔案了。', kind: 'connection' },
      '點對點連線失敗，請使用暫存分享': { title: '連線失敗', detail: '目前無法直接連線，可改用限時暫存分享。', kind: 'error' },
      '裝置暫時斷線': { title: '裝置暫時斷線', detail: '正在等待連線恢復。', kind: 'error' },
      '連線已中斷': { title: '連線已中斷', detail: '請重新建立房間，或改用限時暫存。', kind: 'error' },
      '連線發生錯誤': { title: '連線發生錯誤', detail: '請重新建立房間，或改用限時暫存。', kind: 'error' },
      '房間已過期': { title: '房間已過期', detail: '請重新建立房間。', kind: 'error' },
    }
    if (details[next]) setAlert({ ...details[next], id: ++alertSequenceRef.current })
  }

  function reportError(error: unknown) { setNotice(error instanceof Error ? error.message : '發生錯誤，請重試') }
  function updateTransfer(name: string, patch: Partial<Transfer>) {
    setTransfers(old => {
      const index = old.findIndex(t => t.name === name)
      if (index < 0) return [{ name, size: 0, mime: '', progress: 0, status: '準備中', ...patch }, ...old]
      return old.map((t, i) => i === index ? { ...t, ...patch } : t)
    })
  }
  function attachChannel(channel: RTCDataChannel) {
    dcRef.current = channel
    channel.binaryType = 'arraybuffer'
    channel.bufferedAmountLowThreshold = 256 * 1024
    channel.onopen = () => updateConnection('已建立點對點連線')
    channel.onclose = () => updateConnection('連線已中斷')
    channel.onerror = () => updateConnection('連線發生錯誤')
    channel.onmessage = async event => {
      try {
        if (typeof event.data !== 'string') {
          const incoming = incomingRef.current
          if (!incoming) return
          const chunk = event.data as ArrayBuffer
          incoming.received += chunk.byteLength
          incoming.chain = incoming.chain.then(async () => {
            if (incoming.writer) await incoming.writer.write(chunk)
            else incoming.chunks!.push(chunk)
          })
          updateTransfer(incoming.name, { progress: Math.min(100, Math.round(incoming.received / incoming.size * 100)) })
          return
        }
        const msg = JSON.parse(event.data) as { type: string; text?: string; name?: string; size?: number; mime?: string; reason?: string }
        if (msg.type === 'text' && typeof msg.text === 'string') {
          setMessages(m => [...m, { text: msg.text!, own: false }])
          setAlert({ id: ++alertSequenceRef.current, title: '收到新訊息', detail: msg.text, kind: 'message' })
        }
        if (msg.type === 'ready') { readyRef.current?.(true); readyRef.current = null }
        if (msg.type === 'reject') { readyRef.current?.(false); readyRef.current = null; setNotice(msg.reason || '對方無法接收檔案') }
        if (msg.type === 'file' && msg.name && msg.size && msg.size <= P2P_MAX) {
          const incoming: NonNullable<typeof incomingRef.current> = { name: msg.name, size: msg.size, mime: msg.mime || 'application/octet-stream', received: 0, chain: Promise.resolve() }
          try {
            Object.assign(incoming, await prepareReceiveTarget(msg.size, navigator.storage))
            incomingRef.current = incoming
            updateTransfer(incoming.name, { size: incoming.size, mime: incoming.mime, status: '接收中', progress: 0 })
            channel.send(JSON.stringify({ type: 'ready' }))
          } catch (e) { channel.send(JSON.stringify({ type: 'reject', reason: e instanceof Error ? e.message : '儲存空間不足' })) }
        }
        if (msg.type === 'end') {
          const incoming = incomingRef.current
          if (!incoming) return
          await incoming.chain
          if (incoming.received !== incoming.size) throw new Error('接收大小不符')
          if (incoming.writer) await incoming.writer.close()
          const blob = incoming.handle ? await incoming.handle.getFile() : new Blob(incoming.chunks, { type: incoming.mime })
          const url = URL.createObjectURL(blob)
          updateTransfer(incoming.name, { progress: 100, status: '接收完成', url })
          setAlert({ id: ++alertSequenceRef.current, title: '收到新檔案', detail: `${incoming.name} · ${formatSize(incoming.size)}`, kind: 'file', url, name: incoming.name })
          // Keep the OPFS file while its object URL is available for the user to save.
          if (incoming.key) rememberReceivedFile(incoming.key)
          incomingRef.current = null
          channel.send(JSON.stringify({ type: 'done' }))
        }
        if (msg.type === 'done') { sendingRef.current = false; updateTransfer(sentNameRef.current, { status: '傳送成功' }); updateConnection('檔案已送達') }
      } catch (e) { reportError(e) }
    }
  }
  useEffect(() => {
    if (!room) return
    const active = room
    let stopped = false
    let polling = false
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
    pcRef.current = pc
    cursorRef.current = 0
    offerStarted.current = false
    const pendingCandidates: RTCIceCandidateInit[] = []
    pc.onicecandidate = e => { if (e.candidate) api(`/api/rooms/${active.code}/signals`, 'POST', { type: 'candidate', payload: e.candidate.toJSON() }, active.token).catch(reportError) }
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') updateConnection('點對點連線失敗，請使用暫存分享')
      if (pc.connectionState === 'disconnected') updateConnection('裝置暫時斷線')
    }
    pc.ondatachannel = e => attachChannel(e.channel)
    if (active.role === 'host') attachChannel(pc.createDataChannel('fastdrop', { ordered: true }))
    async function tick() {
      if (stopped || polling) return
      if (Date.now() >= active.expiresAt) { stopped = true; pc.close(); updateConnection('房間已過期'); return }
      if (pc.connectionState === 'connected') return
      polling = true
      try {
        if (active.role === 'host' && !offerStarted.current) {
          const status = await api<{ peerJoined: boolean }>(`/api/rooms/${active.code}/status`, 'GET', undefined, active.token)
          if (!status.peerJoined) return
          offerStarted.current = true
          updateConnection('正在建立點對點連線')
          const offer = await pc.createOffer()
          await pc.setLocalDescription(offer)
          await api(`/api/rooms/${active.code}/signals`, 'POST', { type: 'offer', payload: pc.localDescription }, active.token)
        }
        const result = await api<{ signals: Signal[] }>(`/api/rooms/${active.code}/signals?after=${cursorRef.current}`, 'GET', undefined, active.token)
        for (const signal of result.signals) {
          cursorRef.current = signal.id
          if (signal.type === 'offer' && active.role === 'guest' && !pc.remoteDescription) {
            await pc.setRemoteDescription(signal.payload as RTCSessionDescriptionInit)
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            await api(`/api/rooms/${active.code}/signals`, 'POST', { type: 'answer', payload: pc.localDescription }, active.token)
          }
          if (signal.type === 'answer' && active.role === 'host' && !pc.remoteDescription) await pc.setRemoteDescription(signal.payload as RTCSessionDescriptionInit)
          if (signal.type === 'candidate') {
            if (pc.remoteDescription) await pc.addIceCandidate(signal.payload as RTCIceCandidateInit)
            else pendingCandidates.push(signal.payload as RTCIceCandidateInit)
          }
          if (pc.remoteDescription && pendingCandidates.length) for (const candidate of pendingCandidates.splice(0)) await pc.addIceCandidate(candidate)
        }
      } catch (e) { if (!stopped) reportError(e) }
      finally { polling = false }
    }
    void tick()
    const timer = setInterval(() => void tick(), 2500)
    return () => { stopped = true; clearInterval(timer); pc.close(); dcRef.current = null }
  // The peer connection belongs to a room; UI callback changes must not reconnect it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room])
  async function createRoom() {
    try {
      const result = await api<Room>('/api/rooms', 'POST')
      setRoom(result); setMode('room'); updateConnection('等待另一裝置加入'); setNotice('')
    } catch (e) { reportError(e) }
  }
  async function joinRoom() {
    const code = codeInput.trim().toUpperCase()
    if (!/^[A-HJ-NP-Z2-9]{10}$/.test(code)) { setNotice('請輸入 10 位配對碼'); return }
    try {
      const result = await api<Room>(`/api/rooms/${code}/join`, 'POST')
      setRoom(result); setMode('room'); updateConnection('正在建立點對點連線'); setNotice('')
      history.replaceState({}, '', '/')
    } catch (e) { reportError(e) }
  }
  function sendText() {
    const text = textInput.trim()
    if (!text || !dcRef.current || dcRef.current.readyState !== 'open') return
    if (text.length > 5000) { setNotice('文字最多 5,000 字'); return }
    dcRef.current.send(JSON.stringify({ type: 'text', text }))
    setMessages(m => [...m, { text, own: true }])
    setTextInput('')
  }
  async function sendP2P(file: File) {
    const channel = dcRef.current
    if (!channel || channel.readyState !== 'open') { setNotice('請先等待兩裝置連線'); return }
    if (!file.size || file.size > P2P_MAX) { setNotice('點對點檔案上限 1 GB'); return }
    if (sendingRef.current) { setNotice('請等待目前檔案傳送完成'); return }
    sendingRef.current = true
    sentNameRef.current = file.name
    updateTransfer(file.name, { name: file.name, size: file.size, mime: file.type, status: '等待對方接收', progress: 0 })
    channel.send(JSON.stringify({ type: 'file', name: file.name, size: file.size, mime: file.type }))
    const accepted = await new Promise<boolean>(resolve => { readyRef.current = resolve; setTimeout(() => { if (readyRef.current === resolve) { readyRef.current = null; resolve(false) } }, 45000) })
    if (!accepted) { updateTransfer(file.name, { status: '對方拒絕或逾時' }); sendingRef.current = false; return }
    try {
      for (let offset = 0; offset < file.size; offset += 16 * 1024) {
        if (channel.readyState !== 'open') throw new Error('連線中斷')
        if (channel.bufferedAmount > 512 * 1024) await new Promise<void>(resolve => { channel.addEventListener('bufferedamountlow', () => resolve(), { once: true }) })
        channel.send(await file.slice(offset, Math.min(offset + 16 * 1024, file.size)).arrayBuffer())
        updateTransfer(file.name, { status: '傳送中', progress: Math.round(Math.min(offset + 16 * 1024, file.size) / file.size * 100) })
      }
      channel.send(JSON.stringify({ type: 'end' }))
      updateTransfer(file.name, { status: '等待對方確認', progress: 100 })
      setTimeout(() => { if (sendingRef.current && sentNameRef.current === file.name) { sendingRef.current = false; updateTransfer(file.name, { status: '對方未確認完成' }) } }, 30000)
    } catch (e) { sendingRef.current = false; updateTransfer(file.name, { status: '傳送失敗' }); reportError(e) }
  }
  async function uploadCloud(file: File) {
    if (!file.size || file.size > CLOUD_MAX) { setNotice('暫存分享單檔上限 250 MB'); return }
    let result: Cloud | null = null
    try {
      result = await api<Cloud>('/api/files', 'POST', { name: file.name, mime: file.type || 'application/octet-stream', size: file.size, hours, deleteAfterDownload: deleteAfter })
      setCloud({ ...result, progress: 0 })
      let status = result.status
      while (status === 'waiting') {
        await new Promise(resolve => setTimeout(resolve, 2500))
        const next = await api<{ status: string }>(`/api/files/${result.id}`, 'GET', undefined, result.ownerToken)
        status = next.status; setCloud(c => c ? { ...c, status } : c)
        if (status === 'expired' || status === 'deleted') throw new Error('暫存已失效')
      }
      for (let n = 1; n <= Math.ceil(file.size / PART); n++) {
        const chunk = file.slice((n - 1) * PART, Math.min(n * PART, file.size))
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const res = await fetch(`/api/files/${result.id}/part?number=${n}`, { method: 'PUT', headers: { Authorization: `Bearer ${result.ownerToken}` }, body: chunk })
            if (!res.ok) {
              const detail = await res.json() as { error?: string }
              throw new Error(detail.error || `第 ${n} 段上傳失敗（${res.status}）`)
            }
            break
          } catch (error) {
            if (attempt === 2) throw error
            await new Promise(resolve => setTimeout(resolve, 800 * (attempt + 1)))
          }
        }
        setCloud(c => c ? { ...c, status: 'uploading', progress: Math.round(Math.min(n * PART, file.size) / file.size * 100) } : c)
      }
      await api(`/api/files/${result.id}/complete`, 'POST', undefined, result.ownerToken)
      const link = shareUrl(result.id, result.downloadToken)
      setCloud(c => c ? { ...c, status: 'ready', progress: 100, url: link } : c)
    } catch (e) {
      if (result) {
        try {
          const current = await api<{ status: string }>(`/api/files/${result.id}`, 'GET', undefined, result.ownerToken)
          if (current.status === 'ready') {
            const link = shareUrl(result.id, result.downloadToken)
            setCloud(c => c ? { ...c, status: 'ready', progress: 100, url: link } : c)
            return
          }
          await api(`/api/files/${result.id}/cancel`, 'POST', undefined, result.ownerToken)
        } catch { /* The expiry cleanup will release any remaining reservation. */ }
      }
      reportError(e); setCloud(c => c ? { ...c, status: 'failed' } : c)
    }
  }
  async function copy(value: string) {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value)
      else {
        const input = document.createElement('textarea')
        input.value = value; input.style.position = 'fixed'; input.style.opacity = '0'
        document.body.append(input); input.select()
        const ok = document.execCommand('copy'); input.remove()
        if (!ok) throw new Error('無法複製，請手動選取文字')
      }
      setNotice('已複製到剪貼簿')
    } catch (e) { reportError(e) }
  }
  const incomingLink = new URLSearchParams(location.search)
  const incomingFile = incomingLink.get('file'), incomingToken = incomingLink.get('token')
  function closePanel() {
    setMode('home')
    setNotice('')
    if (location.search) history.replaceState({}, '', '/')
  }
  return <main>
    <header className="topbar"><button className="brand" onClick={closePanel}>↗ FastDrop</button><span>跨裝置快傳，打開瀏覽器就能用</span></header>
    <section className="hero"><div className="heroCopy"><span className="eyebrow">簡單 • 即時 • 無需安裝</span><h1>檔案和文字，<br /><em>輕鬆傳到另一台裝置。</em></h1><p>兩台裝置配對後直接傳送；對方不在線時，也能使用限時暫存分享。</p><div className="heroPills"><span>⚡ 即時點對點</span><span>☁ 限時分享</span><span>✧ 跨裝置</span></div></div><div className="heroArt" aria-hidden="true"><div className="orbit orbitOne"/><div className="orbit orbitTwo"/><div className="artCenter">↗<span>FastDrop</span></div><div className="artNode nodeOne">檔案 <span>↗</span></div><div className="artNode nodeTwo">文字 <span>✓</span></div><div className="artNode nodeThree">安全傳送 <span>✦</span></div><div className="artSpark sparkOne">✦</div><div className="artSpark sparkTwo">✦</div></div></section>
    {mode === 'home' && notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice('')}>×</button></div>}
    <div className="cards">
      <button className="choice" onClick={() => room ? setMode('room') : void createRoom()}><span className="icon">↗</span><strong>{room ? '返回傳送房間' : '建立傳送'}</strong><span>產生配對碼與 QR Code，讓另一裝置加入</span><b>{room ? '打開房間 →' : '建立房間 →'}</b></button>
      <button className="choice" onClick={() => setMode('join')}><span className="icon">⌁</span><strong>加入裝置</strong><span>輸入對方顯示的配對碼</span><b>輸入配對碼 →</b></button>
      <button className="choice" onClick={() => setMode('cloud')}><span className="icon">☁</span><strong>暫存分享</strong><span>對方不在線？上傳後傳送限時下載連結</span><b>選擇檔案 →</b></button>
    </div>
    {mode !== 'home' && <div className="modalBackdrop" onMouseDown={e => { if (e.target === e.currentTarget) closePanel() }}><div className="modalWindow" role="dialog" aria-modal="true" aria-label={mode === 'room' ? '即時傳送' : mode === 'join' ? '加入裝置' : mode === 'cloud' ? '暫存分享' : '下載檔案'}><div className="modalTop"><button className="backButton" onClick={closePanel}>← 返回主畫面</button><span>FASTDROP / {mode === 'room' ? '即時傳送' : mode === 'join' ? '加入裝置' : mode === 'cloud' ? '暫存分享' : '下載檔案'}</span><button className="closeButton" onClick={closePanel} aria-label="關閉視窗">×</button></div><div className="modalBody">{notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice('')}>×</button></div>}
    {mode === 'join' && <section className="panel joinPanel"><span className="eyebrow">CONNECT YOUR DEVICES</span><h2>加入另一台裝置</h2><p>輸入對方畫面上的 10 位配對碼，即可開始直接傳送。</p><div className="join"><input aria-label="配對碼" autoFocus value={codeInput} onChange={e => setCodeInput(e.target.value.toUpperCase())} onKeyDown={e => { if (e.key === 'Enter') void joinRoom() }} placeholder="10 位配對碼" maxLength={10} /><button onClick={joinRoom}>加入房間 →</button></div></section>}
    {mode === 'download' && incomingFile && incomingToken && <section className="panel downloadPanel"><span className="eyebrow">YOUR FILE IS READY</span><h2>收到暫存分享</h2><p>此連結有時效，請在到期前下載。下載會在按下按鈕後開始。</p><a className="button primary" href={downloadUrl(incomingFile, incomingToken)}>下載檔案 ↓</a></section>}
    {mode === 'room' && room && ['localhost', '127.0.0.1'].includes(location.hostname) && <div className="localHint">目前連結只適合同一台電腦；手機測試請使用可連線的 HTTPS 網址。</div>}
    {mode === 'room' && room && <section className="panel"><div className="sectionHead"><div><span className="eyebrow">即時傳送</span><h2>房間 {room.code}</h2></div><span className="status">{connection}</span></div><div className="roomInfo"><div><p>讓另一裝置掃描 QR Code 或輸入配對碼</p><div className="code">{room.code}<button onClick={() => copy(room.code)}>複製代碼</button></div><button className="textButton" onClick={() => copy(joinUrl(room.code))}>複製加入連結 ↗</button></div><div className="qr"><QRCodeSVG value={joinUrl(room.code)} size={128} level="M" /><small>掃描後開啟加入頁面</small></div></div><div className="divider" /><h3>傳送文字</h3><div className="compose"><textarea value={textInput} onChange={e => setTextInput(e.target.value)} placeholder="貼上文字或連結…" maxLength={5000} /><button onClick={sendText} disabled={connection !== '已建立點對點連線' && connection !== '檔案已送達'}>傳送</button></div>{messages.map((m, i) => <div className="message" key={i}><span>{m.own ? '我' : '對方'}：{m.text}</span><button onClick={() => copy(m.text)}>複製</button></div>)}<div className="divider" /><h3>傳送檔案</h3><div className="drop" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) void sendP2P(file) }}><p>拖放檔案到這裡，或選擇檔案</p><button onClick={() => fileInputRef.current?.click()}>選擇檔案</button><input ref={fileInputRef} type="file" hidden onChange={e => { const file = e.target.files?.[0]; if (file) void sendP2P(file); e.target.value = '' }} /><small>點對點上限 1 GB，使用分段傳送</small></div>{transfers.map((t, i) => <div className="fileRow" key={i}><div><strong>{t.name}</strong><small>{formatSize(t.size)} · {t.mime || '未知類型'} · {t.status}</small></div><div className="progress"><span style={{ width: `${t.progress}%` }} /></div>{t.url && <a href={t.url} download={t.name}>儲存檔案</a>}</div>)}</section>}
    {mode === 'cloud' && <section className="panel"><span className="eyebrow">離線也能分享</span><h2>限時暫存</h2><p>每個檔案最多 250 MB；暫存池總容量 0.5 GB。容量不足時會顯示排隊等待。</p><div className="settings"><label>保留時間 <select value={hours} onChange={e => setHours(Number(e.target.value))}>{[1,2,3,4,5,6].map(h => <option key={h} value={h}>{h} 小時</option>)}</select></label><label><input type="checkbox" checked={deleteAfter} onChange={e => setDeleteAfter(e.target.checked)} /> 成功下載後刪除</label></div><div className="drop" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) void uploadCloud(file) }}><p>拖放檔案到這裡，或選擇檔案</p><button onClick={() => cloudInputRef.current?.click()}>選擇檔案</button><input ref={cloudInputRef} type="file" hidden onChange={e => { const file = e.target.files?.[0]; if (file) void uploadCloud(file); e.target.value = '' }} /></div>{cloud && <div className="fileRow"><div><strong>{cloud.name}</strong><small>{formatSize(cloud.size)} · {cloud.mime} · {cloud.status === 'waiting' ? '容量不足，排隊等待中' : cloud.status === 'ready' ? '可分享' : cloud.status === 'failed' ? '上傳失敗' : '上傳中'}</small></div><div className="progress"><span style={{ width: `${cloud.progress}%` }} /></div>{cloud.url && <div className="share"><input readOnly value={cloud.url} aria-label="下載連結" /><button onClick={() => copy(cloud.url!)}>複製連結</button></div>}</div>}</section>}
    </div></div></div>}
    {alert && <div key={alert.id} className={`eventAlert ${alert.kind}`} role="alert"><div className="eventIcon">{alert.kind === 'file' ? '↓' : alert.kind === 'message' ? '✉' : alert.kind === 'error' ? '!' : '↗'}</div><div className="eventContent"><strong>{alert.title}</strong><p>{alert.detail}</p><div className="eventActions">{alert.kind === 'file' && alert.url && <a href={alert.url} download={alert.name}>儲存檔案 ↓</a>}{alert.kind === 'message' && <button onClick={() => { setMode('room'); setAlert(null) }}>檢視訊息 →</button>}{alert.kind === 'error' && <button onClick={() => { setMode('cloud'); setAlert(null) }}>改用暫存分享 →</button>}</div></div>{alert.kind === 'message' && <span className="eventCountdown" aria-hidden="true" />}</div>}
    <footer>© 2026 FastDrop. Crafted with ☕ by 胡鈞揚 (National Quemoy University). All rights reserved.</footer>
  </main>
}
export default App
