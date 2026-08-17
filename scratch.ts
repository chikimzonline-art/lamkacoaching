import { db } from './src/lib/db';
import { Prisma } from '@prisma/client';

async function main() {
  const search = 'parmawi';
  const ftsTerm = search
    .split(/\s+/)
    .filter(Boolean)
    .map((tok) => `"${tok.replace(/"/g, '""')}"*`)
    .join(' ');
  
  console.log('ftsTerm:', ftsTerm);
  
  const students = await db.$queryRaw`
    SELECT * FROM Student
    WHERE rowid IN (
      SELECT rowid FROM Student_fts WHERE Student_fts MATCH ${ftsTerm}
    )
  `;
  console.log('Students:', students);
}

main().catch(console.error).finally(() => process.exit());
