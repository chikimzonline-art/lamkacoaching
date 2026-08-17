import { db } from './src/lib/db';
import { Prisma } from '@prisma/client';

async function main() {
  const students = await db.$queryRaw`
    SELECT rowid, * FROM Student WHERE name LIKE '%Parmawi%'
  `;
  console.log('LIKE query:', students);

  const ftsCount = await db.$queryRaw`
    SELECT count(*) as count FROM Student_fts
  `;
  console.log('FTS table count:', ftsCount);
}

main().catch(console.error).finally(() => process.exit());
