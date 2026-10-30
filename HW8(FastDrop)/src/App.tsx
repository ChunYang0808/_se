import { useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { cleanupReceivedFiles, prepareReceiveTarget, rememberReceivedFile } from './receiveStorage'
import { detectDevice, readConnectionStats, validDeviceInfo, type DeviceInfo } from './connectionInfo'
import './App.css'

type Room = { code: string; token: string; role: 'host' | 'guest'; expiresAt: number; resumed?: boolean; signalCursor?: number }
type Transfer = { name: string; size: number; mime: string; progress: number; status: string; url?: string }
type Cloud = { id: string; name: string; mime: string; size: number; status: string; ownerToken: string; downloadToken: string; progress: number; url?: string }
type ShareInfo = { name: string; mime: string; size: number; uploadedAt: number; expiresAt: number; deleteAfterDownload: boolean; uploaderOs: string }
type Signal = { id: number; type: 'offer' | 'answer' | 'candidate' | 'restart'; payload: RTCSessionDescriptionInit | RTCIceCandidateInit | Record<string, never> }
type Alert = { id: number; title: string; detail: string; kind: 'connection' | 'message' | 'file'; url?: string; name?: string }
type SpeedInfo = { direction: '↑' | '↓'; mbPerSecond: number; finished: boolean }
const MB = 1024 * 1024, P2P_MAX = 1024 * MB, CLOUD_MAX = 250_000_000, PART = 8 * MB
const formatSize = (bytes: number) => bytes >= MB ? `${(bytes / MB).toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`
const formatSpeed = (mbPerSecond: number) => mbPerSecond < 0.1 ? `${(mbPerSecond * 1024).toFixed(1)} KB/s` : `${mbPerSecond.toFixed(1)} MB/s`
const formatDate = (timestamp: number) => Number.isFinite(timestamp) ? new Intl.DateTimeFormat('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(timestamp)) : '無法取得'
async function api<T>(path: string, method = 'GET', body?: unknown, token?: string): Promise<T> {
  const res = await fetch(path, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '連線失敗')
  return data as T
}
const joinUrl = (code: string) => `${location.origin}/?room=${code}`
const downloadUrl = (id: string, token: string) => `${location.origin}/api/files/${id}/download?token=${token}`
const shareUrl = (id: string, token: string) => `${location.origin}/?file=${id}&token=${token}`
const guestSessionKey = (code: string) => `fastdrop-guest-${code}`
function pruneGuestSessions() {
  try {
    for (let index = localStorage.length - 1; index >= 0; index--) {
      const key = localStorage.key(index)
      if (!key?.startsWith('fastdrop-guest-')) continue
      const saved = JSON.parse(localStorage.getItem(key) || 'null') as { expiresAt?: unknown } | null
      if (typeof saved?.expiresAt === 'number' && saved.expiresAt > Date.now()) continue
      localStorage.removeItem(key)
      localStorage.removeItem(key.replace('fastdrop-guest-', 'fastdrop-active-'))
    }
  } catch { /* Storage may be unavailable or contain invalid data. */ }
}
function rememberedGuestToken(code: string) {
  try {
    pruneGuestSessions()
    const saved = JSON.parse(localStorage.getItem(guestSessionKey(code)) || 'null') as { token?: unknown; expiresAt?: unknown } | null
    if (saved && typeof saved.token === 'string' && /^[a-f0-9]{48}$/.test(saved.token) && typeof saved.expiresAt === 'number' && saved.expiresAt > Date.now()) return saved.token
    localStorage.removeItem(guestSessionKey(code))
  } catch { /* Storage may be unavailable or contain stale data. */ }
  return undefined
}

function App() {
  const [room, setRoom] = useState<Room | null>(null)
  const [codeInput, setCodeInput] = useState(new URLSearchParams(location.search).get('room') || '')
  const [connection, setConnection] = useState('尚未連線')
  const [textInput, setTextInput] = useState('')
  const [messages, setMessages] = useState<{ text: string; own: boolean }[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [cloud, setCloud] = useState<Cloud | null>(null)
  const [hours, setHours] = useState(1)
  const [deleteAfter, setDeleteAfter] = useState(true)
  const [shareState, setShareState] = useState<{ loading: boolean; info: ShareInfo | null; error: string }>({ loading: new URLSearchParams(location.search).has('file'), info: null, error: '' })
  const [notice, setNotice] = useState('')
  const [mode, setMode] = useState<'home' | 'join' | 'room' | 'cloud' | 'download'>(() => {
    const params = new URLSearchParams(location.search)
    return params.has('file') && params.has('token') ? 'download' : params.has('room') ? 'join' : 'home'
  })
  const [alert, setAlert] = useState<Alert | null>(null)
  const [failureOpen, setFailureOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')
  const [peerDevice, setPeerDevice] = useState<DeviceInfo | null>(null)
  const [detailPanel, setDetailPanel] = useState<'connection' | 'privacy' | 'cloud-delete' | null>(null)
  const [networkStats, setNetworkStats] = useState<{ latencyMs?: number; transport?: 'UDP' | 'TCP' }>({})
  const [speed, setSpeed] = useState<SpeedInfo | null>(null)
  const myDevice = detectDevice(navigator.userAgent, navigator.maxTouchPoints)
  const alertSequenceRef = useRef(0)
  const speedSampleRef = useRef<{ direction: SpeedInfo['direction']; start: number; last: number; bytes: number } | null>(null)
  const dcRef = useRef<RTCDataChannel | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const reconnectRef = useRef<(() => Promise<void>) | null>(null)
  const reconnectingRef = useRef(false)
  const restartCursorRef = useRef(0)
  const instanceIdRef = useRef(crypto.randomUUID())
  const [reconnectEpoch, setReconnectEpoch] = useState(0)
  const cursorRef = useRef(0)
  const offerStarted = useRef(false)
  const readyRef = useRef<((ok: boolean) => void) | null>(null)
  const sendingRef = useRef(false)
  const sentNameRef = useRef('')
  const incomingRef = useRef<{ name: string; size: number; mime: string; received: number; writer?: FileSystemWritableFileStream; handle?: FileSystemFileHandle; key?: string; chunks?: BlobPart[]; chain: Promise<void> } | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const cloudInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => { void cleanupReceivedFiles(navigator.storage).catch(() => {}) }, [])
  useEffect(() => { pruneGuestSessions() }, [])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('fastdrop-theme-v2', theme) } catch { /* Private browsing may disable storage. */ }
  }, [theme])

  useEffect(() => {
    if (room?.role !== 'guest') return
    const onTakeover = (event: StorageEvent) => {
      if (event.key !== `fastdrop-active-${room.code}` || !event.newValue || event.newValue === instanceIdRef.current) return
      setRoom(null); setMode('home'); setConnection('尚未連線'); setFailureOpen(false); setNotice('此房間已在另一個分頁重新加入')
    }
    window.addEventListener('storage', onTakeover)
    return () => window.removeEventListener('storage', onTakeover)
  }, [room])

  useEffect(() => {
    if (mode !== 'download') return
    const params = new URLSearchParams(location.search)
    const file = params.get('file'), token = params.get('token')
    if (!file || !token) return
    let active = true
    api<ShareInfo>(`/api/files/${encodeURIComponent(file)}/share?token=${encodeURIComponent(token)}`)
      .then(info => { if (active) setShareState({ loading: false, info, error: '' }) })
      .catch(error => { if (active) setShareState({ loading: false, info: null, error: error instanceof Error ? error.message : '無法取得分享資訊' }) })
    return () => { active = false }
  }, [mode])

  useEffect(() => {
    if (!alert) return
    const duration = alert.kind === 'message' ? 5000 : alert.kind === 'file' ? 8000 : 3000
    const timer = window.setTimeout(() => setAlert(current => current?.id === alert.id ? null : current), duration)
    return () => window.clearTimeout(timer)
  }, [alert])

  useEffect(() => {
    if (connection !== '正在建立點對點連線' || !room) return
    const timer = window.setTimeout(() => updateConnection('點對點連線失敗，請使用暫存分享'), 30000)
    return () => window.clearTimeout(timer)
  }, [connection, room])

  useEffect(() => {
    if (connection !== '正在建立點對點連線' && !failureOpen) return
    const y = window.scrollY, body = document.body
    const previous = { position: body.style.position, top: body.style.top, left: body.style.left, right: body.style.right, width: body.style.width, overflow: body.style.overflow }
    body.style.position = 'fixed'; body.style.top = `-${y}px`; body.style.left = '0'; body.style.right = '0'; body.style.width = '100%'; body.style.overflow = 'hidden'
    return () => { Object.assign(body.style, previous); window.scrollTo(0, y) }
  }, [connection, failureOpen])

  useEffect(() => {
    if (detailPanel !== 'connection' || !pcRef.current) return
    let active = true
    const refresh = async () => {
      try {
        const report = await pcRef.current?.getStats()
        if (active && report) setNetworkStats(readConnectionStats(report))
      } catch { if (active) setNetworkStats({}) }
    }
    void refresh()
    const timer = window.setInterval(() => void refresh(), 2500)
    return () => { active = false; window.clearInterval(timer) }
  }, [detailPanel, room])

  useEffect(() => {
    if (!detailPanel) return
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setDetailPanel(null) }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [detailPanel])

  function beginSpeed(direction: SpeedInfo['direction']) {
    const time = performance.now()
    speedSampleRef.current = { direction, start: time, last: time, bytes: 0 }
    setSpeed(null)
  }
  function recordSpeed(bytes: number, finished = false) {
    const sample = speedSampleRef.current
    if (!sample) return
    const time = performance.now()
    const elapsed = time - sample.last
    if (elapsed < 250 && !finished) return
    const totalElapsed = Math.max(time - sample.start, 1)
    const rate = finished ? bytes / totalElapsed * 1000 : (bytes - sample.bytes) / Math.max(elapsed, 1) * 1000
    if (Number.isFinite(rate) && rate >= 0) setSpeed({ direction: sample.direction, mbPerSecond: rate / MB, finished })
    sample.last = time
    sample.bytes = bytes
  }

  function updateConnection(next: string) {
    setConnection(next)
    if (next === '正在建立點對點連線') { setAlert(null); setFailureOpen(false); return }
    if (next === '點對點連線失敗，請使用暫存分享' || next === '連線發生錯誤') { setAlert(null); setFailureOpen(true); return }
    if (next === '已建立點對點連線') setFailureOpen(false)
    const details: Record<string, { title: string; detail: string; kind: Alert['kind'] }> = {
      '等待另一裝置加入': { title: '房間已建立', detail: '把配對碼或 QR Code 分享給另一台裝置。', kind: 'connection' },
      '已建立點對點連線': { title: '兩端已連線', detail: '現在可以直接傳送文字和檔案了。', kind: 'connection' },
      '裝置暫時斷線': { title: '裝置暫時斷線', detail: '正在等待連線恢復。', kind: 'connection' },
      '連線已中斷': { title: '連線已中斷', detail: '請重新建立房間，或改用限時暫存。', kind: 'connection' },
      '房間已過期': { title: '房間已過期', detail: '請重新建立房間。', kind: 'connection' },
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
    channel.onopen = () => {
      reconnectingRef.current = false
      updateConnection('已建立點對點連線')
      channel.send(JSON.stringify({ type: 'device-info', payload: myDevice }))
    }
    channel.onclose = () => { if (dcRef.current === channel) { dcRef.current = null; setPeerDevice(null); if (!reconnectingRef.current) updateConnection('連線已中斷') } }
    channel.onerror = () => { if (!reconnectingRef.current) updateConnection('連線發生錯誤') }
    channel.onmessage = async event => {
      try {
        if (typeof event.data !== 'string') {
          const incoming = incomingRef.current
          if (!incoming) return
          const chunk = event.data as ArrayBuffer
          incoming.received += chunk.byteLength
          recordSpeed(incoming.received)
          incoming.chain = incoming.chain.then(async () => {
            if (incoming.writer) await incoming.writer.write(chunk)
            else incoming.chunks!.push(chunk)
          })
          updateTransfer(incoming.name, { progress: Math.min(100, Math.round(incoming.received / incoming.size * 100)) })
          return
        }
        const msg = JSON.parse(event.data) as { type: string; text?: string; name?: string; size?: number; mime?: string; reason?: string; payload?: unknown }
        if (msg.type === 'device-info' && validDeviceInfo(msg.payload)) {
          const { browser, os, deviceType } = msg.payload
          setPeerDevice({ browser, os, deviceType })
        }
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
            beginSpeed('↓')
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
          recordSpeed(incoming.received, true)
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
    cursorRef.current = restartCursorRef.current || active.signalCursor || 0
    restartCursorRef.current = 0
    offerStarted.current = false
    const pendingCandidates: RTCIceCandidateInit[] = []
    pc.onicecandidate = e => { if (e.candidate) api(`/api/rooms/${active.code}/signals`, 'POST', { type: 'candidate', payload: e.candidate.toJSON() }, active.token).catch(reportError) }
    const markReconnected = () => {
      if (reconnectingRef.current && dcRef.current?.readyState === 'open' && ['connected', 'completed'].includes(pc.iceConnectionState)) {
        reconnectingRef.current = false
        updateConnection('已建立點對點連線')
      }
    }
    pc.oniceconnectionstatechange = markReconnected
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') markReconnected()
      if (pc.connectionState === 'failed' && !reconnectingRef.current) updateConnection('點對點連線失敗，請使用暫存分享')
      if (pc.connectionState === 'disconnected' && !reconnectingRef.current) updateConnection('裝置暫時斷線')
    }
    pc.ondatachannel = e => attachChannel(e.channel)
    if (active.role === 'host') attachChannel(pc.createDataChannel('fastdrop', { ordered: true }))
    let restarting = false
    let lastConnectedPoll = 0
    async function startReconnect() {
      if (stopped || Date.now() >= active.expiresAt) { updateConnection('房間已過期'); return }
      reconnectingRef.current = true
      updateConnection('正在建立點對點連線')
      try {
        if (active.role === 'guest') {
          await api(`/api/rooms/${active.code}/signals`, 'POST', { type: 'restart', payload: {} }, active.token)
          return
        }
        if (restarting) return
        restarting = true
        if (pc.signalingState === 'have-local-offer') await pc.setLocalDescription({ type: 'rollback' })
        if (pc.signalingState !== 'stable') throw new Error('連線尚在協商中，請稍後重試')
        if (!dcRef.current || dcRef.current.readyState === 'closed') attachChannel(pc.createDataChannel('fastdrop', { ordered: true }))
        pc.restartIce()
        const offer = await pc.createOffer({ iceRestart: true })
        await pc.setLocalDescription(offer)
        await api(`/api/rooms/${active.code}/signals`, 'POST', { type: 'offer', payload: pc.localDescription }, active.token)
      } catch (error) { restarting = false; reconnectingRef.current = false; reportError(error); updateConnection('點對點連線失敗，請使用暫存分享') }
    }
    reconnectRef.current = startReconnect
    if (active.role === 'guest' && active.resumed) {
      reconnectingRef.current = true
      void api(`/api/rooms/${active.code}/signals`, 'POST', { type: 'restart', payload: { fresh: true } }, active.token).catch(reportError)
    }
    async function tick() {
      if (stopped || polling) return
      if (pc.connectionState === 'connected' && !reconnectingRef.current && Date.now() - lastConnectedPoll < 10000) return
      if (pc.connectionState === 'connected') lastConnectedPoll = Date.now()
      if (Date.now() >= active.expiresAt) { stopped = true; pc.close(); updateConnection('房間已過期'); return }
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
          if (signal.type === 'restart' && active.role === 'host') {
            if ((signal.payload as { fresh?: unknown }).fresh === true) {
              restartCursorRef.current = signal.id
              reconnectingRef.current = true
              updateConnection('正在建立點對點連線')
              setReconnectEpoch(epoch => epoch + 1)
              return
            }
            await startReconnect(); continue
          }
          if (signal.type === 'offer' && active.role === 'guest' && pc.signalingState === 'stable') {
            if (pc.remoteDescription) { reconnectingRef.current = true; updateConnection('正在建立點對點連線') }
            await pc.setRemoteDescription(signal.payload as RTCSessionDescriptionInit)
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            await api(`/api/rooms/${active.code}/signals`, 'POST', { type: 'answer', payload: pc.localDescription }, active.token)
            markReconnected()
          }
          if (signal.type === 'answer' && active.role === 'host' && pc.signalingState === 'have-local-offer') { await pc.setRemoteDescription(signal.payload as RTCSessionDescriptionInit); restarting = false; markReconnected() }
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
    return () => { stopped = true; clearInterval(timer); reconnectRef.current = null; reconnectingRef.current = false; pc.close(); dcRef.current = null; setPeerDevice(null) }
  // The peer connection belongs to a room; UI callback changes must not reconnect it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, reconnectEpoch])
  async function createRoom() {
    try {
      const result = await api<Room>('/api/rooms', 'POST')
      setPeerDevice(null); setNetworkStats({}); setSpeed(null); speedSampleRef.current = null
      setRoom(result); setMode('room'); updateConnection('等待另一裝置加入'); setNotice('')
    } catch (e) { reportError(e) }
  }
  async function joinRoom() {
    const code = codeInput.trim().toUpperCase()
    if (!/^[A-HJ-NP-Z2-9]{10}$/.test(code)) { setNotice('請輸入 10 位配對碼'); return }
    try {
      const result = await api<Room>(`/api/rooms/${code}/join`, 'POST', undefined, rememberedGuestToken(code))
      try {
        localStorage.setItem(guestSessionKey(code), JSON.stringify({ token: result.token, expiresAt: result.expiresAt }))
        localStorage.setItem(`fastdrop-active-${code}`, instanceIdRef.current)
      } catch { /* Joining still works if storage is unavailable. */ }
      setPeerDevice(null); setNetworkStats({}); setSpeed(null); speedSampleRef.current = null
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
      beginSpeed('↑')
      for (let offset = 0; offset < file.size; offset += 16 * 1024) {
        if (channel.readyState !== 'open') throw new Error('連線中斷')
        if (channel.bufferedAmount > 512 * 1024) await new Promise<void>(resolve => { channel.addEventListener('bufferedamountlow', () => resolve(), { once: true }) })
        channel.send(await file.slice(offset, Math.min(offset + 16 * 1024, file.size)).arrayBuffer())
        recordSpeed(Math.min(offset + 16 * 1024, file.size))
        updateTransfer(file.name, { status: '傳送中', progress: Math.round(Math.min(offset + 16 * 1024, file.size) / file.size * 100) })
      }
      channel.send(JSON.stringify({ type: 'end' }))
      recordSpeed(file.size, true)
      updateTransfer(file.name, { status: '等待對方確認', progress: 100 })
      setTimeout(() => { if (sendingRef.current && sentNameRef.current === file.name) { sendingRef.current = false; updateTransfer(file.name, { status: '對方未確認完成' }) } }, 30000)
    } catch (e) { sendingRef.current = false; updateTransfer(file.name, { status: '傳送失敗' }); reportError(e) }
  }
  async function uploadCloud(file: File) {
    if (!file.size || file.size > CLOUD_MAX) { setNotice('暫存分享單檔上限 250 MB'); return }
    let result: Cloud | null = null
    try {
      result = await api<Cloud>('/api/files', 'POST', { name: file.name, mime: file.type || 'application/octet-stream', size: file.size, hours, deleteAfterDownload: deleteAfter, uploaderOs: myDevice.os })
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
      setAlert({ id: ++alertSequenceRef.current, title: '已複製到剪貼簿', detail: '可以貼到另一台裝置使用。', kind: 'connection' })
    } catch (e) { reportError(e) }
  }
  const incomingLink = new URLSearchParams(location.search)
  const incomingFile = incomingLink.get('file'), incomingToken = incomingLink.get('token')
  const isConnected = connection === '已建立點對點連線' || connection === '檔案已送達'
  const roomNeedsRecovery = ['點對點連線失敗，請使用暫存分享', '連線發生錯誤', '連線已中斷', '裝置暫時斷線', '房間已過期'].includes(connection)
  async function reconnectRoom() {
    if (!room || Date.now() >= room.expiresAt) { updateConnection('房間已過期'); return }
    if (!reconnectRef.current) { setNotice('房間連線尚未就緒，請稍後再試'); return }
    setFailureOpen(false)
    await reconnectRef.current()
  }
  function closePanel() {
    setMode('home')
    setFailureOpen(false)
    setDetailPanel(null)
    setNotice('')
    if (location.search) history.replaceState({}, '', '/')
  }
  return <main>
    <header className="topbar"><button className="brand" onClick={closePanel}>↗ FastDrop</button><div className="topbarActions"><span>跨裝置快傳，打開瀏覽器就能用</span><button className="themeToggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? '切換淺色模式' : '切換深色模式'} title={theme === 'dark' ? '開燈：淺色模式' : '關燈：深色模式'}>{theme === 'dark' ? '☀ 開燈' : '☾ 關燈'}</button></div></header>
    <section className="hero"><div className="heroCopy"><span className="eyebrow">簡單 • 即時 • 無需安裝</span><h1>檔案和文字，<br /><em>輕鬆傳到另一台裝置。</em></h1><p>兩台裝置配對後直接傳送；對方不在線時，也能使用限時暫存分享。</p><div className="heroPills"><span>⚡ 即時點對點</span><span>☁ 限時分享</span><span>✧ 跨裝置</span></div></div><div className="heroArt" aria-hidden="true"><div className="orbit orbitOne"/><div className="orbit orbitTwo"/><div className="artCenter">↗<span>FastDrop</span></div><div className="artNode nodeOne">檔案 <span>↗</span></div><div className="artNode nodeTwo">文字 <span>✓</span></div><div className="artNode nodeThree">安全傳送 <span>✦</span></div><div className="artSpark sparkOne">✦</div><div className="artSpark sparkTwo">✦</div></div></section>
    {mode === 'home' && notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice('')}>×</button></div>}
    <div className="cards">
      <button className="choice" onClick={() => room && !roomNeedsRecovery ? setMode('room') : void createRoom()}><span className="icon">↗</span><strong>{room && !roomNeedsRecovery ? '返回傳送房間' : '建立傳送'}</strong><span>產生配對碼與 QR Code，讓另一裝置加入</span><b>{room && !roomNeedsRecovery ? '打開房間 →' : '建立房間 →'}</b></button>
      <button className="choice" onClick={() => setMode('join')}><span className="icon">⌁</span><strong>加入裝置</strong><span>輸入對方顯示的配對碼</span><b>輸入配對碼 →</b></button>
      <button className="choice" onClick={() => setMode('cloud')}><span className="icon">☁</span><strong>暫存分享</strong><span>對方不在線？上傳後傳送限時下載連結</span><b>選擇檔案 →</b></button>
    </div>
    {mode !== 'home' && <div className="modalBackdrop" onMouseDown={e => { if (e.target === e.currentTarget) closePanel() }}><div className="modalWindow" role="dialog" aria-modal="true" aria-label={mode === 'room' ? '即時傳送' : mode === 'join' ? '加入裝置' : mode === 'cloud' ? '暫存分享' : '下載檔案'}><div className="modalTop"><button className="backButton" onClick={closePanel}>← 返回主畫面</button><span>FASTDROP / {mode === 'room' ? '即時傳送' : mode === 'join' ? '加入裝置' : mode === 'cloud' ? '暫存分享' : '下載檔案'}</span><div className="modalTopActions"><button className="themeToggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? '切換淺色模式' : '切換深色模式'} title={theme === 'dark' ? '開燈：淺色模式' : '關燈：深色模式'}>{theme === 'dark' ? '☀ 開燈' : '☾ 關燈'}</button><button className="closeButton" onClick={closePanel} aria-label="關閉視窗">×</button></div></div><div className="modalBody">{notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice('')}>×</button></div>}
    {mode === 'join' && <section className="panel joinPanel"><span className="eyebrow">CONNECT YOUR DEVICES</span><h2>加入另一台裝置</h2><p>輸入對方畫面上的 10 位配對碼，即可開始直接傳送。</p><div className="join"><input aria-label="配對碼" autoFocus value={codeInput} onChange={e => setCodeInput(e.target.value.toUpperCase())} onKeyDown={e => { if (e.key === 'Enter') void joinRoom() }} placeholder="10 位配對碼" maxLength={10} /><button onClick={joinRoom}>加入房間 →</button></div></section>}
    {mode === 'download' && incomingFile && incomingToken && <section className="panel downloadPanel">
      <span className="eyebrow">YOUR FILE IS READY</span><h2>收到暫存分享</h2>
      {shareState.loading ? <p>正在取得分享資訊…</p> : shareState.error ? <div className="shareUnavailable" role="alert"><strong>目前無法查看此分享</strong><p>{shareState.error}</p></div> : shareState.info && <>
        <p>這份檔案只會暫存一段時間，請在到期前下載。</p>
        <div className="receivedFile"><span className="receivedIcon" aria-hidden="true">↓</span><div><span>分享檔案</span><strong>{shareState.info.name}</strong><small>{formatSize(shareState.info.size)} · {shareState.info.mime}</small></div></div>
        <div className="shareDetails"><div><span>上傳裝置系統</span><strong>{shareState.info.uploaderOs}</strong></div><div><span>上傳時間</span><strong>{formatDate(shareState.info.uploadedAt)}</strong></div><div><span>到期時間</span><strong>{formatDate(shareState.info.expiresAt)}</strong></div></div>
        {shareState.info.deleteAfterDownload ? <div className="oneTimeHint"><strong>✓ 下載後立即移除雲端暫存</strong><span>檔案完整傳送後，這個連結就無法再次下載。請先確認裝置有足夠空間。</span></div> : <div className="expiryHint">此連結可在到期前重複下載；到期後會自動失效。</div>}
        <a className="button primary" href={downloadUrl(incomingFile, incomingToken)}>下載檔案 ↓</a><small className="shareTimezone">時間依你目前裝置的時區顯示 · 上傳系統由瀏覽器提供</small>
      </>}
    </section>}
    {mode === 'room' && room && ['localhost', '127.0.0.1'].includes(location.hostname) && <div className="localHint">目前連結只適合同一台電腦；手機測試請使用可連線的 HTTPS 網址。</div>}
    {mode === 'room' && room && <section className="panel">
      <div className="sectionHead"><div><span className="eyebrow">即時傳送</span><h2>房間 {room.code}</h2></div><div className="roomStatus"><span className="status">{connection}</span>{isConnected && <button className="infoButton" onClick={() => setDetailPanel('connection')}>查看連線資訊 ↗</button>}{(roomNeedsRecovery || isConnected) && connection !== '房間已過期' && <button className="infoButton" onClick={() => void reconnectRoom()}>重新連線 ↻</button>}{roomNeedsRecovery && <button className="infoButton" onClick={() => void createRoom()}>建立新房間 ↗</button>}</div></div>
      <div className="roomInfo"><div><p>讓另一裝置掃描 QR Code 或輸入配對碼</p><div className="code">{room.code}<button onClick={() => copy(room.code)}>複製代碼</button></div><button className="textButton" onClick={() => copy(joinUrl(room.code))}>複製加入連結 ↗</button></div><div className="qr"><QRCodeSVG value={joinUrl(room.code)} size={128} level="M" /><small>掃描後開啟加入頁面</small></div></div>
      <div className="privacyBanner"><svg className="shieldIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2.5 20 6v5.6c0 4.8-3.1 8.1-8 10-4.9-1.9-8-5.2-8-10V6l8-3.5Z"/><path d="m8.5 11.9 2.3 2.3 4.7-4.8"/></svg><div><strong>此房間不儲存傳輸內容</strong><span>文字與檔案透過 WebRTC 點對點傳送</span></div><button onClick={() => setDetailPanel('privacy')}>了解更多 →</button></div>
      <div className="divider" /><h3>傳送文字</h3><div className="compose"><textarea value={textInput} onChange={e => setTextInput(e.target.value)} placeholder="貼上文字或連結…" maxLength={5000} /><button onClick={sendText} disabled={connection !== '已建立點對點連線' && connection !== '檔案已送達'}>傳送</button></div>
      {messages.map((m, i) => <div className="message" key={i}><span>{m.own ? '我' : '對方'}：{m.text}</span><button onClick={() => copy(m.text)}>複製</button></div>)}
      <div className="divider" /><h3>傳送檔案</h3><div className="drop" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) void sendP2P(file) }}><p>拖放檔案到這裡，或選擇檔案</p><button onClick={() => fileInputRef.current?.click()}>選擇檔案</button><input ref={fileInputRef} type="file" hidden onChange={e => { const file = e.target.files?.[0]; if (file) void sendP2P(file); e.target.value = '' }} /><small>點對點上限 1 GB，使用分段傳送</small></div>
      {transfers.map((t, i) => <div className="fileRow" key={i}><div><strong>{t.name}</strong><small>{formatSize(t.size)} · {t.mime || '未知類型'} · {t.status}</small></div><div className="progress"><span style={{ width: `${t.progress}%` }} /></div>{t.url && <a href={t.url} download={t.name}>儲存檔案</a>}</div>)}
    </section>}
    {mode === 'cloud' && <section className="panel"><span className="eyebrow">離線也能分享</span><h2>限時暫存</h2><p>每個檔案最多 250 MB；暫存池總容量 0.5 GB。容量不足時會顯示排隊等待。</p>
      <div className="settings"><label>保留時間 <select value={hours} onChange={e => setHours(Number(e.target.value))}>{[1,2,3,4,5,6].map(h => <option key={h} value={h}>{h} 小時</option>)}</select></label><div className="deleteSetting"><label><input type="checkbox" checked={deleteAfter} onChange={e => setDeleteAfter(e.target.checked)} /> 成功下載後刪除（推薦）</label><button className="settingHelp" onClick={() => setDetailPanel('cloud-delete')} aria-label="了解下載後刪除">為什麼推薦？ ↗</button></div></div>
      <div className="drop" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) void uploadCloud(file) }}><p>拖放檔案到這裡，或選擇檔案</p><button onClick={() => cloudInputRef.current?.click()}>選擇檔案</button><input ref={cloudInputRef} type="file" hidden onChange={e => { const file = e.target.files?.[0]; if (file) void uploadCloud(file); e.target.value = '' }} /></div>
      <div className="uploadWarning" role="note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5"/><circle cx="12" cy="16.5" r=".6" fill="currentColor" stroke="none"/></svg><div><strong>請僅分享你有權傳送的內容</strong><p>請勿上傳或分享違法、侵權、未經同意的私密內容，或其他可能造成傷害的檔案。</p></div></div>
      {cloud && <div className="fileRow"><div><strong>{cloud.name}</strong><small>{formatSize(cloud.size)} · {cloud.mime} · {cloud.status === 'waiting' ? '容量不足，排隊等待中' : cloud.status === 'ready' ? '可分享' : cloud.status === 'failed' ? '上傳失敗' : '上傳中'}</small></div><div className="progress"><span style={{ width: `${cloud.progress}%` }} /></div>{cloud.url && <div className="share"><input readOnly value={cloud.url} aria-label="下載連結" /><button onClick={() => copy(cloud.url!)}>複製連結</button></div>}</div>}
    </section>}
    </div></div></div>}
    {alert && <div key={alert.id} className={`eventAlert ${alert.kind}`} role="status"><div className="eventIcon">{alert.kind === 'file' ? '↓' : alert.kind === 'message' ? '✉' : '↗'}</div><div className="eventContent"><strong>{alert.title}</strong><p>{alert.detail}</p><div className="eventActions">{alert.kind === 'file' && alert.url && <a href={alert.url} download={alert.name}>儲存檔案 ↓</a>}{alert.kind === 'message' && <button onClick={() => { setMode('room'); setAlert(null) }}>檢視訊息 →</button>}</div></div>{alert.kind === 'message' && <span className="eventCountdown" aria-hidden="true" />}</div>}
    {connection === '正在建立點對點連線' && room && !failureOpen && <div className="connectionLoading" role="status" aria-live="polite"><div className="loadingContent"><div className="p2pAnimation" aria-hidden="true"><span className="deviceNode">▣</span><span className="signalTrack"><i/><i/><i/></span><span className="deviceNode">▣</span></div><h2>正在建立點對點連線</h2><p>正在透過 WebRTC 連接另一台裝置…</p><small>通常只需要幾秒鐘</small></div></div>}
    {failureOpen && <div className="connectionFailureBackdrop"><section className="connectionFailure" role="alertdialog" aria-modal="true" aria-labelledby="failure-title" aria-describedby="failure-description"><span className="failureIcon" aria-hidden="true">!</span><h2 id="failure-title">無法建立直接連線</h2><p id="failure-description">可以用原本的房間代碼重新連線，或建立新房間再試。</p><div className="failureActions"><button onClick={() => setFailureOpen(false)}>取消</button><button onClick={() => { setFailureOpen(false); setMode('cloud') }}>暫存分享</button><button onClick={() => void reconnectRoom()}>重新連線</button></div></section></div>}
    {detailPanel && <div className="detailBackdrop" onMouseDown={event => { if (event.target === event.currentTarget) setDetailPanel(null) }}><section className="detailModal" role="dialog" aria-modal="true" aria-labelledby="detail-title">
      <button className="detailClose" onClick={() => setDetailPanel(null)} aria-label="關閉">×</button>
      {detailPanel === 'connection' ? <>
        <span className="eyebrow">CURRENT SESSION</span><h2 id="detail-title">連線資訊</h2><p className="detailIntro">只顯示這次連線的概略資訊，不記錄裝置或位置。</p>
        <div className="deviceGrid"><div className="deviceTile"><span>我的裝置</span><strong>{myDevice.os} · {myDevice.browser} · {myDevice.deviceType}</strong></div><div className="deviceTile"><span>對方裝置</span><strong>{peerDevice ? `${peerDevice.os} · ${peerDevice.browser} · ${peerDevice.deviceType}` : '無法取得'}</strong></div></div>
        <div className="detailDivider"/><div className="detailRows"><div><span>連線狀態</span><strong className="connectedValue"><i />{isConnected ? 'P2P 已連線' : '未連線'}</strong></div><div><span>傳輸方式</span><strong>WebRTC DataChannel</strong></div><div><span>DataChannel</span><strong>{isConnected ? 'Open' : 'Closed'}</strong></div>{networkStats.latencyMs !== undefined && <div><span>延遲</span><strong>{networkStats.latencyMs} ms</strong></div>}{networkStats.transport && <div><span>網路協定</span><strong>{networkStats.transport}</strong></div>}{speed && <div><span>{speed.finished ? '上次平均速度' : '目前速度'}</span><strong>{speed.direction} {formatSpeed(speed.mbPerSecond)}</strong></div>}</div>
      </> : detailPanel === 'privacy' ? <>
        <span className="eyebrow">FAST. SIMPLE. DIRECT.</span><h2 id="detail-title">🛡️ WebRTC 點對點傳輸</h2>
        <div className="privacyCopy"><h3>檔案直接在裝置之間傳送</h3><p>兩台裝置成功連線後，文字與檔案會透過 WebRTC DataChannel 在兩端之間傳送。P2P 模式不將傳輸內容存入 Cloudflare R2。</p><div className="deviceFlow"><span>你的裝置</span><b>══════▶<small>WebRTC</small></b><span>對方裝置</span></div><h3>Cloudflare 負責什麼？</h3><p>Cloudflare Worker 協助建立房間、交換 WebRTC 連線資訊並完成配對。這些資訊用來建立連線；連線後的文字與檔案內容由 WebRTC DataChannel 傳送。</p><h3>☁️ 限時暫存是另一種模式</h3><p>只有你主動選擇「限時暫存分享」時，檔案才會上傳至 Cloudflare R2，並依設定時間刪除。</p><div className="modeCompare"><div><strong>即時傳送</strong><span>WebRTC P2P · 不將傳輸內容存入 R2</span></div><div><strong>限時暫存</strong><span>Cloudflare R2 · 檔案暫時存放於雲端</span></div></div></div>
      </> : <>
        <span className="eyebrow">限時暫存設定</span><h2 id="detail-title">下載後即移除暫存</h2>
        <p className="detailIntro">推薦開啟，讓分享檔案在完成一次下載後就從雲端暫存空間移除。</p>
        <div className="deleteExplainer"><div><strong>更快釋放儲存空間</strong><p>檔案完整傳送後，FastDrop 會立即刪除 R2 中的暫存副本，讓容量更快提供給下一位使用者。</p></div><div><strong>一次性分享連結</strong><p>刪除後連結無法再次下載。若傳輸中途取消，檔案會保留到設定的到期時間，方便重試。</p></div></div>
        <p className="deleteFinePrint">這項設定只影響雲端暫存副本，不會刪除接收者已下載到裝置的檔案。</p>
      </>}
      <div className="detailFooter"><span>FastDrop · Fast. Simple. Direct.</span><button onClick={() => setDetailPanel(null)}>{detailPanel === 'connection' ? '完成' : '我知道了'}</button></div>
    </section></div>}
    <footer>© 2026 FastDrop. Crafted with ☕ by 胡鈞揚 (National Quemoy University). All rights reserved.</footer>
  </main>
}
export default App
