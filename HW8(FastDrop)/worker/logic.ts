export const MiB = 1024 * 1024
export const CLOUD_MAX = 250_000_000
export const POOL_MAX = 500_000_000
export const PART_SIZE = 8 * MiB
export const P2P_MAX = 1024 * MiB
export const ROOM_RE = /^[A-HJ-NP-Z2-9]{10}$/
export const TOKEN_RE = /^[a-f0-9]{48}$/

export const UPLOADER_OS = ['Windows', 'macOS', 'iOS', 'Android', 'Linux', 'Other'] as const
export type UploaderOs = typeof UPLOADER_OS[number]

export function validFile(input: unknown): input is { name: string; mime: string; size: number; hours: number; deleteAfterDownload: boolean; uploaderOs?: UploaderOs } {
  if (!input || typeof input !== 'object') return false
  const v = input as Record<string, unknown>
  return typeof v.name === 'string' && v.name.length > 0 && v.name.length <= 180 && !/[\\/]/.test(v.name) && !Array.from(v.name).some(c => c.charCodeAt(0) < 32) &&
    typeof v.mime === 'string' && v.mime.length <= 120 && /^[a-zA-Z0-9.+-]+\/[a-zA-Z0-9.+-]+$/.test(v.mime) &&
    typeof v.size === 'number' && Number.isSafeInteger(v.size) && v.size > 0 && v.size <= CLOUD_MAX &&
    typeof v.hours === 'number' && Number.isInteger(v.hours) && v.hours >= 1 && v.hours <= 6 &&
    typeof v.deleteAfterDownload === 'boolean' &&
    (v.uploaderOs === undefined || UPLOADER_OS.includes(v.uploaderOs as UploaderOs))
}

export function expectedParts(size: number) { return Math.ceil(size / PART_SIZE) }
export function expectedPartSize(size: number, part: number) {
  const count = expectedParts(size)
  return Number.isInteger(part) && part >= 1 && part <= count ? Math.min(PART_SIZE, size - (part - 1) * PART_SIZE) : 0
}
export function canReserve(used: number, size: number) { return Number.isSafeInteger(used) && used >= 0 && size > 0 && size <= CLOUD_MAX && used + size <= POOL_MAX }
export function missingMultipartUpload(error: unknown) {
  if (!error || typeof error !== 'object') return false
  const value = error as { code?: unknown; message?: unknown }
  return value.code === 10024 || value.code === 'NoSuchUpload' ||
    (typeof value.message === 'string' && /NoSuchUpload|10024|multipart upload.*(?:not found|does not exist)/i.test(value.message))
}
export function randomToken() { return Array.from(crypto.getRandomValues(new Uint8Array(24)), b => b.toString(16).padStart(2, '0')).join('') }
export function randomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from(crypto.getRandomValues(new Uint8Array(10)), b => alphabet[b % alphabet.length]).join('')
}
