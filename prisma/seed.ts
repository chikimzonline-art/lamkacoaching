import { db } from '../src/lib/db';
import { hashPassword } from '../src/lib/auth';

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await hashPassword('admin123');
  const admin = await db.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      name: 'Admin',
      role: 'admin',
      active: true,
    },
  });
  console.log('Created admin user:', admin.username);

  // Create staff user
  const staffPassword = await hashPassword('staff123');
  const staff = await db.user.upsert({
    where: { username: 'staff' },
    update: {},
    create: {
      username: 'staff',
      password: staffPassword,
      name: 'Staff Member',
      role: 'staff',
      active: true,
    },
  });
  console.log('Created staff user:', staff.username);

  // Create default settings
  const settings = [
    { key: 'business_name', value: 'Lamka Coaching Center' },
    { key: 'operating_hours_start', value: '07:00' },
    { key: 'operating_hours_end', value: '22:00' },
    { key: 'hourly_rate', value: '100' },
    { key: 'monthly_rate', value: '3000' },
  ];

  for (const setting of settings) {
    await db.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log('Created default settings');

  // Create sample cabins
  for (let i = 1; i <= 5; i++) {
    await db.cabin.upsert({
      where: { cabinNum: i },
      update: {},
      create: {
        cabinNum: i,
        status: 'active',
        notes: i === 1 ? 'Ground floor, near entrance' : i === 5 ? 'Top floor, quiet area' : null,
      },
    });
  }
  console.log('Created 5 sample cabins');

  // Create sample students
  const students = [
    { name: 'Rahul Sharma', phone: '9876543210', email: 'rahul@example.com', address: 'Lamka, Manipur' },
    { name: 'Priya Devi', phone: '9876543211', email: 'priya@example.com', address: 'Churachandpur' },
    { name: 'Amit Singh', phone: '9876543212', email: null, address: 'Imphal' },
    { name: 'Neha Kumari', phone: '9876543213', email: 'neha@example.com', address: 'Lamka, Manipur' },
    { name: 'Raj Kumar', phone: '9876543214', email: null, address: 'Churachandpur' },
  ];

  for (const student of students) {
    await db.student.upsert({
      where: { phone: student.phone },
      update: {},
      create: student,
    });
  }
  console.log('Created sample students');

  // Create sample bookings
  const rahul = await db.student.findUnique({ where: { phone: '9876543210' } });
  const priya = await db.student.findUnique({ where: { phone: '9876543211' } });
  const cabin1 = await db.cabin.findUnique({ where: { cabinNum: 1 } });
  const cabin2 = await db.cabin.findUnique({ where: { cabinNum: 2 } });

  if (rahul && cabin1) {
    await db.booking.create({
      data: {
        studentId: rahul.id,
        cabinId: cabin1.id,
        type: 'exclusive',
        status: 'active',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2026-05-01'),
        totalAmount: 300000, // ₹3000 in paise
        paidAmount: 200000, // ₹2000 paid
      },
    });
  }

  if (priya && cabin2) {
    const today = new Date().toISOString().split('T')[0];
    await db.booking.create({
      data: {
        studentId: priya.id,
        cabinId: cabin2.id,
        type: 'hourly',
        status: 'active',
        startDate: new Date(today),
        startTime: '09:00',
        endTime: '12:00',
        totalAmount: 30000, // ₹300 in paise
        paidAmount: 30000,
      },
    });
  }
  console.log('Created sample bookings');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
