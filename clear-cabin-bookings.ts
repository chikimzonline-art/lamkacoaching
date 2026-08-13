import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Deleting existing cabin bookings...');
  
  // In this schema, all Booking records are for cabins
  const result = await prisma.booking.deleteMany({});

  console.log(`Deleted ${result.count} cabin bookings.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
