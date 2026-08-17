import { db } from './src/lib/db';
import { Prisma } from '@prisma/client';

async function main() {
  const search = 'parmawi';
  const ftsTerm = search
    .split(/\s+/)
    .filter(Boolean)
    .map((tok) => `"${tok.replace(/"/g, '""')}"*`)
    .join(' ');

  const results = await db.$queryRaw`
    SELECT rowid, * FROM Student_fts WHERE Student_fts MATCH ${ftsTerm}
  `;
  console.log('FTS match:', results);

  const results2 = await db.$queryRaw`
    SELECT rowid, * FROM Student_fts WHERE name LIKE '%Parmawi%'
  `;
  console.log('FTS LIKE match:', results2);
}

main().catch(console.error).finally(() => process.exit());
