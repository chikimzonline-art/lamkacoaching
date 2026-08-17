import { db } from './src/lib/db';

async function main() {
  await db.$executeRaw`INSERT INTO Student_fts(Student_fts) VALUES('rebuild')`;
  console.log('Rebuilt FTS index');
  
  const search = 'parmawi';
  const ftsTerm = search
    .split(/\s+/)
    .filter(Boolean)
    .map((tok) => `"${tok.replace(/"/g, '""')}"*`)
    .join(' ');

  const results = await db.$queryRaw`
    SELECT rowid, * FROM Student_fts WHERE Student_fts MATCH ${ftsTerm}
  `;
  console.log('FTS match after rebuild:', results);
}

main().catch(console.error).finally(() => process.exit());
