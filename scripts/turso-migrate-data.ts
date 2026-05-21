/**
 * Migrate data from local SQLite to Turso.
 * Reads all tables from local db/custom.db and inserts into Turso.
 */
import Database from 'bun:sqlite'
import { createClient } from '@libsql/client'

const LOCAL_DB_PATH = './db/custom.db'

const tursoUrl = process.env.TURSO_DATABASE_URL
const tursoAuth = process.env.TURSO_AUTH_TOKEN

if (!tursoUrl || !tursoAuth) {
  console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in .env')
  process.exit(1)
}

const localDb = new Database(LOCAL_DB_PATH, { readonly: true })
const turso = createClient({ url: tursoUrl, authToken: tursoAuth })

// All tables in order (respecting foreign key dependencies)
const tables = [
  'Cabin', 'Student', 'Department', 'Course',
  'Enrollment', 'EnrollmentPayment',
  'Booking', 'Payment', 'Attendance',
  'Setting', 'User', 'Notice',
  'TeamMember', 'AboutMilestone', 'Batch',
  'NewsletterSubscriber', 'ContactSubmission',
  'ChatMessage', 'FAQ',
  'ImpactStat', 'AchievementCard', 'SuccessStory',
  'Testimonial', 'CampusGalleryItem',
]

console.log('Starting migration from local SQLite to Turso...\n')

let totalRows = 0

for (const table of tables) {
  try {
    const rows = localDb.query(`SELECT * FROM "${table}"`).all() as Record<string, any>[]
    
    if (rows.length === 0) {
      console.log(`  ${table}: 0 rows (skipped)`)
      continue
    }

    const columns = Object.keys(rows[0])
    const placeholders = columns.map(() => '?').join(', ')
    const colNames = columns.map(c => `"${c}"`).join(', ')
    const insertSql = `INSERT OR IGNORE INTO "${table}" (${colNames}) VALUES (${placeholders})`

    let inserted = 0
    // Insert in batches of 20 to avoid overwhelming the API
    for (let i = 0; i < rows.length; i += 20) {
      const batch = rows.slice(i, i + 20)
      const stmts = batch.map(row => ({
        sql: insertSql,
        args: columns.map(col => row[col] ?? null),
      }))
      await turso.batch(stmts)
      inserted += batch.length
    }

    console.log(`  ✓ ${table}: ${inserted} rows migrated`)
    totalRows += inserted
  } catch (err: any) {
    console.error(`  ✗ ${table}: FAILED - ${err.message}`)
  }
}

console.log(`\n✅ Migration complete! ${totalRows} total rows migrated.`)
localDb.close()
process.exit(0)
