import { describe, expect, it } from 'vitest'
import { CLOUD_MAX, PART_SIZE, POOL_MAX, ROOM_RE, TOKEN_RE, canReserve, expectedPartSize, expectedParts, missingMultipartUpload, randomCode, randomToken, validFile } from './logic.js'

describe('input validation', () => {
  const file = { name: '照片.png', mime: 'image/png', size: 123, hours: 1, deleteAfterDownload: false, uploaderOs: 'iOS' }
  it('accepts valid metadata and exact cloud limit', () => {
    expect(validFile(file)).toBe(true)
    expect(validFile({ ...file, uploaderOs: undefined })).toBe(true)
    expect(validFile({ ...file, size: CLOUD_MAX, hours: 6 })).toBe(true)
  })
  it('rejects path, control, invalid size and expiry', () => {
    for (const change of [{ name: '../secret' }, { name: 'a\\b' }, { name: 'x\u0000' }, { size: 0 }, { size: CLOUD_MAX + 1 }, { size: 1.5 }, { hours: 7 }, { mime: 'x\r\ny' }, { uploaderOs: 'iPhone 17' }, { uploaderOs: '<script>' }]) {
      expect(validFile({ ...file, ...change })).toBe(false)
    }
  })
  it('uses unguessable shaped identifiers', () => {
    expect(ROOM_RE.test(randomCode())).toBe(true)
    expect(TOKEN_RE.test(randomToken())).toBe(true)
  })
})
describe('capacity and multipart boundaries', () => {
  it('reserves exactly up to the 0.5 GB cap', () => {
    expect(POOL_MAX).toBe(500_000_000)
    expect(canReserve(CLOUD_MAX, CLOUD_MAX)).toBe(true)
    expect(canReserve(POOL_MAX, 1)).toBe(false)
    expect(canReserve(POOL_MAX - CLOUD_MAX, CLOUD_MAX)).toBe(true)
    expect(canReserve(POOL_MAX - CLOUD_MAX + 1, CLOUD_MAX)).toBe(false)
    expect(canReserve(0, CLOUD_MAX + 1)).toBe(false)
  })
  it('requires fixed 8 MB parts except the final part', () => {
    expect(expectedParts(PART_SIZE * 2 + 1)).toBe(3)
    expect(expectedPartSize(PART_SIZE * 2 + 1, 1)).toBe(PART_SIZE)
    expect(expectedPartSize(PART_SIZE * 2 + 1, 3)).toBe(1)
    expect(expectedPartSize(PART_SIZE * 2 + 1, 4)).toBe(0)
  })
})

describe('expired multipart cleanup', () => {
  it('can retry after R2 has already aborted a missing upload', () => {
    expect(missingMultipartUpload({ code: 10024 })).toBe(true)
    expect(missingMultipartUpload({ code: 'NoSuchUpload' })).toBe(true)
    expect(missingMultipartUpload(new Error('NoSuchUpload: multipart upload does not exist'))).toBe(true)
  })
  it('keeps a reservation when abort failed for another reason', () => {
    expect(missingMultipartUpload(new Error('R2 temporarily unavailable'))).toBe(false)
    expect(missingMultipartUpload({ code: 429 })).toBe(false)
  })
})
