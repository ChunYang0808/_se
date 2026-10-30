export type DeviceInfo = {
  browser: 'Chrome' | 'Edge' | 'Safari' | 'Firefox' | 'Other'
  os: 'Windows' | 'macOS' | 'iOS' | 'Android' | 'Linux' | 'Other'
  deviceType: 'Desktop' | 'Mobile' | 'Tablet'
}

export function detectDevice(userAgent: string, maxTouchPoints = 0): DeviceInfo {
  const isIPad = /iPad/i.test(userAgent) || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1)
  const os: DeviceInfo['os'] = /iPhone|iPod/i.test(userAgent) || isIPad ? 'iOS'
    : /Android/i.test(userAgent) ? 'Android'
    : /Windows/i.test(userAgent) ? 'Windows'
    : /Macintosh|Mac OS X/i.test(userAgent) ? 'macOS'
    : /Linux/i.test(userAgent) ? 'Linux' : 'Other'
  const browser: DeviceInfo['browser'] = /Edg(?:e|A|iOS)?\//i.test(userAgent) ? 'Edge'
    : /FxiOS\/|Firefox\//i.test(userAgent) ? 'Firefox'
    : /CriOS\/|Chrome\//i.test(userAgent) ? 'Chrome'
    : /Safari\//i.test(userAgent) ? 'Safari' : 'Other'
  const deviceType: DeviceInfo['deviceType'] = isIPad || (os === 'Android' && !/Mobile/i.test(userAgent)) ? 'Tablet'
    : os === 'iOS' || os === 'Android' ? 'Mobile' : 'Desktop'
  return { browser, os, deviceType }
}

export function validDeviceInfo(value: unknown): value is DeviceInfo {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return ['Chrome', 'Edge', 'Safari', 'Firefox', 'Other'].includes(String(v.browser)) &&
    ['Windows', 'macOS', 'iOS', 'Android', 'Linux', 'Other'].includes(String(v.os)) &&
    ['Desktop', 'Mobile', 'Tablet'].includes(String(v.deviceType))
}

export function readConnectionStats(report: RTCStatsReport): { latencyMs?: number; transport?: 'UDP' | 'TCP' } {
  const rows = Array.from(report.values()) as Array<RTCStats & Record<string, unknown>>
  const selectedId = rows.find(row => row.type === 'transport' && typeof row.selectedCandidatePairId === 'string')?.selectedCandidatePairId
  const pair = rows.find(row => row.type === 'candidate-pair' && row.id === selectedId) ??
    rows.find(row => row.type === 'candidate-pair' && row.state === 'succeeded' && (row.selected === true || row.nominated === true))
  if (!pair) return {}
  const latencyMs = typeof pair.currentRoundTripTime === 'number' && Number.isFinite(pair.currentRoundTripTime) && pair.currentRoundTripTime >= 0
    ? Math.round(pair.currentRoundTripTime * 1000) : undefined
  const candidate = rows.find(row => row.id === pair.localCandidateId && row.type === 'local-candidate')
  const protocol = typeof candidate?.protocol === 'string' ? candidate.protocol.toUpperCase() : ''
  const transport = protocol === 'UDP' || protocol === 'TCP' ? protocol : undefined
  return { latencyMs, transport }
}
