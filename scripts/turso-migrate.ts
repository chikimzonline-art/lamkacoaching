import { createClient } from '@libsql/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN

if (!url || !authToken) {
  console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN')
  process.exit(1)
}

const client = createClient({ url, authToken })

const sqlFile = join(import.meta.dir, '..', 'prisma', 'turso-init.sql')
const rawSql = readFileSync(sqlFile, 'utf-8')

// Remove comment lines, then split on semicolons
const sql = rawSql
  .split('\n')
  .filter(line => !line.trim().startsWith('--'))
  .join('\n')

// Split on semicolons, filter empty
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0)

console.log(`Applying ${statements.length} SQL statements to Turso...`)

let success = 0
let skipped = 0
let failed = 0

for (const stmt of statements) {
  try {
    await client.execute(stmt)
    success++
    console.log(`✓ ${stmt.slice(0, 80).replace(/\n/g, ' ')}`)
  } catch (err: any) {
    if (err.message?.includes('already exists') || err.message?.includes('duplicate')) {
      skipped++
      console.log(`⚠ Skip (exists): ${stmt.slice(0, 60).replace(/\n/g, ' ')}`)
    } else {
      failed++
      console.error(`✗ FAILED: ${stmt.slice(0, 60).replace(/\n/g, ' ')}`)
      console.error(`  Error: ${err.message}`)
    }
  }
}

console.log(`\nDone! ✓ ${success} applied, ⚠ ${skipped} skipped, ✗ ${failed} failed.`)
process.exit(failed > 0 ? 1 : 0)
