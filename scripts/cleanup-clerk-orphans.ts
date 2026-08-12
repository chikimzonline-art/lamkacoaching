import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting cleanup of orphan Clerk student records...');
  
  // Find and delete all students created by Clerk webhooks
  const result = await prisma.student.deleteMany({
    where: {
      source: 'clerk_signup',
    },
  });
  
  console.log(`Deleted ${result.count} orphan students successfully.`);
  
  // We don't delete Users here, only students. Clerk Users were just linked.
}

main()
  .catch(e => {
    console.error('Error during cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
