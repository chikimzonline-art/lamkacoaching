import { createClient } from '@libsql/client'
import { readFileSync } from 'fs'
import { join } from 'path'

// Applies prisma/fts5-students.sql to Turso. Idempotent — safe to re-run.
// Usage: node scripts/apply-fts5.ts  (or)  bun scripts/apply-fts5.ts

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN

if (!url || !authToken) {
  console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN')
  process.exit(1)
}

const client = createClient({ url, authToken })

const sqlFile = join(import.meta.dir, '..', 'prisma', 'fts5-students.sql')
const rawSql = readFileSync(sqlFile, 'utf-8')

// Strip comment lines, then split on semicolons
const sql = rawSql
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n')

console.log(`Applying FTS5 statements to Turso using executeMultiple...`)

try {
  await client.executeMultiple(sql)
  console.log(`\nDone. All statements applied successfully.`)
  process.exit(0)
} catch (err: any) {
  console.error(`\nFAIL: Could not apply FTS5 statements.`)
  console.error(`Error details: ${err.message}`)
  process.exit(1)
}
