import fs from 'fs';
import os from 'os';
import path from 'path';
import { execSync } from 'child_process';
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl) {
  console.error('Error: TURSO_DATABASE_URL not found in .env');
  process.exit(1);
}
if (!tursoToken) {
  console.error('Error: TURSO_AUTH_TOKEN not found in .env');
  process.exit(1);
}

const schemaPath = 'prisma/schema.prisma';
const oldSchemaPath = path.join(os.tmpdir(), 'prisma-old-schema.prisma');

// Snapshot the last-committed schema so we can diff against it.
// This assumes the committed schema matches what's currently on Turso.
try {
  const oldSchema = execSync('git show HEAD:prisma/schema.prisma', { encoding: 'utf-8' });
  fs.writeFileSync(oldSchemaPath, oldSchema, { encoding: 'utf-8' });
} catch {
  console.error('Error: could not read committed schema via git. Is this a git repo?');
  process.exit(1);
}

// Generate the SQL delta with Prisma's migrate diff (no DB connection needed).
let sql;
try {
  sql = execSync(
    `npx prisma migrate diff --from-schema-datamodel "${oldSchemaPath}" --to-schema-datamodel "${schemaPath}" --script`,
    { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
  ).trim();
} catch (err) {
  console.error('Error: prisma migrate diff failed:');
  console.error(err.stderr ? err.stderr.toString() : err.message);
  process.exit(1);
}

if (!sql || sql.includes('-- No changes detected')) {
  console.log('No schema changes to apply.');
  process.exit(0);
}

// Strip comment lines first, then split into individual statements.
const statements = sql
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n')
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);

if (statements.length === 0) {
  console.log('No schema changes to apply.');
  process.exit(0);
}

// Rewrite statements to be idempotent where possible so re-runs are safe.
const idempotent = statements.map((stmt) => {
  if (/^CREATE\s+(UNIQUE\s+)?INDEX\b/i.test(stmt) && !/IF\s+NOT\s+EXISTS/i.test(stmt)) {
    return stmt.replace(/^CREATE\s+(UNIQUE\s+)?INDEX\b/i, 'CREATE $1INDEX IF NOT EXISTS');
  }
  return stmt;
});

console.log(`Applying ${idempotent.length} statement(s) to Turso (${tursoUrl})...\n`);

const client = createClient({ url: tursoUrl, authToken: tursoToken });

let applied = 0;
let skipped = 0;
for (const stmt of idempotent) {
  const label = stmt.replace(/\s+/g, ' ').slice(0, 90);
  try {
    await client.execute(stmt);
    console.log(`  + ${label}`);
    applied++;
  } catch (err) {
    // ALTER TABLE ADD COLUMN / CREATE TABLE on re-runs: benign if it already exists.
    const msg = err.message || String(err);
    if (/already exists|duplicate column/i.test(msg)) {
      console.log(`  ~ skip (already exists): ${label}`);
      skipped++;
    } else {
      console.error(`  x FAILED: ${label}`);
      console.error(`      ${msg}`);
    }
  }
}

console.log(`\nDone. ${applied} applied, ${skipped} skipped.`);
client.close();
