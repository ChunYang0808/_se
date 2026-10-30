import { describe, expect, it, vi } from 'vitest'
import { prepareReceiveTarget } from './receiveStorage'

describe('P2P receive storage', () => {
  it('keeps the disk-backed file available for the download link', async () => {
    const writer = { write: vi.fn(), close: vi.fn() }
    const handle = { createWritable: vi.fn().mockResolvedValue(writer) }
    const root = { getFileHandle: vi.fn().mockResolvedValue(handle), removeEntry: vi.fn() }
    const target = await prepareReceiveTarget(159_000, { getDirectory: vi.fn().mockResolvedValue(root) } as unknown as StorageManager)
    expect(target.writer).toBe(writer)
    expect(target.handle).toBe(handle)
    expect(root.removeEntry).not.toHaveBeenCalled()
  })
  it('falls back to memory for a small file when browser disk storage fails', async () => {
    const target = await prepareReceiveTarget(12_500, { getDirectory: vi.fn().mockRejectedValue(new Error('unsupported')) } as unknown as StorageManager)
    expect(target.chunks).toEqual([])
  })
  it('rejects a large file when disk storage is unavailable', async () => {
    await expect(prepareReceiveTarget(51 * 1024 * 1024, undefined)).rejects.toThrow('50 MB')
  })
})
