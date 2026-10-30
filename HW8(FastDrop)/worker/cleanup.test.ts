import { describe, expect, it, vi } from 'vitest'
import { cleanup } from './index.js'

describe('scheduled cleanup ordering', () => {
  it('removes expired waiting metadata before the bounded R2 cleanup pass', async () => {
    const statements: Array<{ sql: string; values: unknown[]; action: string }> = []
    const db = {
      prepare(sql: string) {
        let values: unknown[] = []
        return {
          bind(...args: unknown[]) { values = args; return this },
          async run() { statements.push({ sql, values, action: 'run' }); return { meta: { changes: 0 } } },
          async all() { statements.push({ sql, values, action: 'all' }); return { results: [] } },
        }
      },
    }
    await cleanup({ fastdrop_db: db, y: { delete: vi.fn() } } as never)
    expect(statements[0].sql).toContain("DELETE FROM files WHERE status='waiting' AND expires_at<=?")
    expect(statements[1].sql).toContain("status!='finalizing'")
    expect(Number(statements[1].values[0]) - Number(statements[1].values[1])).toBe(120_000)
    expect(statements.some(item => item.sql.startsWith('DELETE FROM signals'))).toBe(true)
    expect(statements.some(item => item.sql.startsWith('DELETE FROM rooms'))).toBe(true)
  })
})
