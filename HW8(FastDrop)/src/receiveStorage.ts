const MEMORY_LIMIT = 50 * 1024 * 1024
const RECEIVED_KEY = 'fastdrop-received-files'
type StoredFile = { key: string; createdAt: number }
const validKey = (key: string) => /^fastdrop-[a-f0-9-]{36}$/.test(key)

function storedFiles(): StoredFile[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(RECEIVED_KEY) || '[]')
    return Array.isArray(value) ? value.filter((item): item is StoredFile =>
      !!item && typeof item.key === 'string' && validKey(item.key) && Number.isSafeInteger(item.createdAt)) : []
  } catch { return [] }
}

export function rememberReceivedFile(key: string) {
  if (!validKey(key)) return
  try { localStorage.setItem(RECEIVED_KEY, JSON.stringify([...storedFiles(), { key, createdAt: Date.now() }])) } catch { /* Storage may be disabled. */ }
}

export async function cleanupReceivedFiles(storage?: StorageManager, time = Date.now()) {
  if (!storage?.getDirectory) return
  const files = storedFiles(), keep: StoredFile[] = []
  const root = await storage.getDirectory()
  for (const file of files) {
    if (time - file.createdAt < 24 * 3600_000) keep.push(file)
    else await root.removeEntry(file.key).catch(() => {})
  }
  try { localStorage.setItem(RECEIVED_KEY, JSON.stringify(keep)) } catch { /* Storage may be disabled. */ }
}

export type ReceiveTarget = {
  writer?: FileSystemWritableFileStream
  handle?: FileSystemFileHandle
  key?: string
  chunks?: BlobPart[]
}

export async function prepareReceiveTarget(size: number, storage?: StorageManager): Promise<ReceiveTarget> {
  if (storage?.getDirectory) {
    let root: FileSystemDirectoryHandle | undefined
    let key: string | undefined
    try {
      root = await storage.getDirectory()
      key = `fastdrop-${crypto.randomUUID()}`
      const handle = await root.getFileHandle(key, { create: true })
      const writer = await handle.createWritable()
      return { writer, handle, key }
    } catch {
      if (root && key) await root.removeEntry(key).catch(() => {})
    }
  }
  if (size <= MEMORY_LIMIT) return { chunks: [] }
  throw new Error('此瀏覽器僅能接收 50 MB 以下的點對點檔案')
}
