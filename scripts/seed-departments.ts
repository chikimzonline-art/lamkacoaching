import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const departments = ['SSC', 'Banking', 'UPSC', 'Railway'];
  
  for (const name of departments) {
    const existing = await prisma.department.findFirst({ where: { name } });
    if (!existing) {
      await prisma.department.create({ data: { name } });
      console.log(`Created department: ${name}`);
    } else {
      console.log(`Department already exists: ${name}`);
    }
  }
  
  console.log('Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
