import { db } from '../src/lib/db';

async function main() {
  console.log('Starting migration for booking types and settings...');

  // 1. Migrate settings keys
  console.log('Migrating settings...');
  
  // Upsert new settings
  const defaultSettings = [
    { key: 'shift_morning_rate', value: '500' },
    { key: 'shift_day_rate', value: '800' },
    { key: 'shift_night_rate', value: '800' },
    { key: 'booking_registration_fee', value: '500' }
  ];

  for (const s of defaultSettings) {
    const existing = await db.setting.findUnique({ where: { key: s.key } });
    if (!existing) {
      await db.setting.create({ data: s });
      console.log(`Initialized setting: ${s.key} = ${s.value}`);
    }
  }

  // Remove hourly_rate if it exists (optional but keeps DB clean)
  try {
    await db.setting.delete({ where: { key: 'hourly_rate' } });
    console.log('Deleted old hourly_rate setting.');
  } catch {
    // Ignore if not found
  }

  // 2. Migrate bookings
  console.log('Migrating bookings...');
  
  // Update exclusive -> reserved
  const exclusiveUpdate = await db.booking.updateMany({
    where: { type: 'exclusive' },
    data: { type: 'reserved' }
  });
  console.log(`Updated ${exclusiveUpdate.count} exclusive bookings to reserved.`);

  // Update hourly -> shift
  const hourlyUpdate = await db.booking.updateMany({
    where: { type: 'hourly' },
    data: { 
      type: 'shift',
    }
  });
  console.log(`Updated ${hourlyUpdate.count} hourly bookings to shift.`);

  // Check if any shift bookings lack startTime/endTime
  const nullTimeBookings = await db.booking.findMany({
    where: {
      type: 'shift',
      OR: [
        { startTime: null },
        { endTime: null }
      ]
    }
  });

  if (nullTimeBookings.length > 0) {
    console.log(`Found ${nullTimeBookings.length} shift bookings with null times. Defaulting to Morning Shift (05:00 - 10:00)...`);
    for (const b of nullTimeBookings) {
      await db.booking.update({
        where: { id: b.id },
        data: {
          startTime: '05:00',
          endTime: '10:00'
        }
      });
    }
  }

  console.log('Migration completed successfully!');
}

main()
  .catch((e) => {
    console.error('Migration error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
