import { PrismaClient } from '@prisma/client';
import { clerkClient } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting role migration to Clerk...');
  
  const users = await prisma.user.findMany({
    where: {
      clerkUserId: {
        not: null,
      },
    },
  });

  console.log(`Found ${users.length} users with clerkUserId.`);

  for (const user of users) {
    if (!user.clerkUserId) continue;
    
    try {
      console.log(`Updating user ${user.username} (Clerk ID: ${user.clerkUserId}) with role: ${user.role}`);
      
      const client = await clerkClient();
      await client.users.updateUserMetadata(user.clerkUserId, {
        publicMetadata: {
          role: user.role,
        },
      });
      
      console.log(`✅ Successfully updated ${user.username}`);
    } catch (error) {
      console.error(`❌ Failed to update ${user.username}:`, error);
    }
  }

  console.log('Migration complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
