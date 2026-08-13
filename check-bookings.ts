import { db } from "./src/lib/db"

async function main() {
  const bookings = await db.booking.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { payments: true }
  })
  console.log(JSON.stringify(bookings, null, 2))
}

main()
  .catch(console.error)
  .finally(() => process.exit(0))
