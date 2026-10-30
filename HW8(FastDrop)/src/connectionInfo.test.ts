import { describe, expect, it } from 'vitest'
import { detectDevice, readConnectionStats, validDeviceInfo } from './connectionInfo'

describe('connection information', () => {
  it('recognizes common desktop and mobile browsers without exposing raw user agent', () => {
    expect(detectDevice('Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/120.0 Safari/537.36 Edg/120.0')).toEqual({ browser: 'Edge', os: 'Windows', deviceType: 'Desktop' })
    expect(detectDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1')).toEqual({ browser: 'Safari', os: 'iOS', deviceType: 'Mobile' })
    expect(detectDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17 Safari/605.1', 5).deviceType).toBe('Tablet')
    expect(detectDevice('Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0').browser).toBe('Firefox')
    expect(detectDevice('Mozilla/5.0 (Linux; Android 14; Pixel) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36').deviceType).toBe('Mobile')
  })
  it('rejects malformed peer device information', () => {
    expect(validDeviceInfo({ browser: 'Safari', os: 'iOS', deviceType: 'Mobile' })).toBe(true)
    expect(validDeviceInfo({ browser: 'Safari', os: 'iOS', deviceType: 'Phone X', ip: '1.2.3.4' })).toBe(false)
  })
  it('only shows reliable selected candidate statistics', () => {
    const report = new Map<string, unknown>([
      ['transport', { id: 'transport', type: 'transport', selectedCandidatePairId: 'pair' }],
      ['pair', { id: 'pair', type: 'candidate-pair', state: 'succeeded', currentRoundTripTime: 0.024, localCandidateId: 'local' }],
      ['local', { id: 'local', type: 'local-candidate', protocol: 'udp', address: '192.0.2.1' }],
    ]) as unknown as RTCStatsReport
    expect(readConnectionStats(report)).toEqual({ latencyMs: 24, transport: 'UDP' })
    expect(readConnectionStats(new Map() as RTCStatsReport)).toEqual({})
    expect(readConnectionStats(new Map([['pair', { id: 'pair', type: 'candidate-pair', state: 'succeeded', nominated: true, currentRoundTripTime: NaN }]]) as RTCStatsReport).latencyMs).toBeUndefined()
  })
})
