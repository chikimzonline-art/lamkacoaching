import { db } from '../src/lib/db';
import { hashPassword } from '../src/lib/auth';

async function main() {
  console.log('Seeding database...');

  // ─── Users ──────────────────────────────────────────────
  const adminPassword = await hashPassword('admin123');
  const admin = await db.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', password: adminPassword, name: 'Admin', role: 'admin', active: true },
  });
  console.log('Created admin user:', admin.username);

  const staffPassword = await hashPassword('staff123');
  const staff = await db.user.upsert({
    where: { username: 'staff' },
    update: {},
    create: { username: 'staff', password: staffPassword, name: 'Staff Member', role: 'staff', active: true },
  });
  console.log('Created staff user:', staff.username);

  // ─── Settings ───────────────────────────────────────────
  const settings = [
    { key: 'business_name', value: 'Lamka Coaching Center' },
    { key: 'business_phone', value: '+91 3874 123456' },
    { key: 'business_email', value: 'info@lamkacoaching.com' },
    { key: 'business_address', value: 'Lamka, Churachandpur, Manipur 795128' },
    { key: 'business_description', value: 'Empowering students with quality coaching for competitive exams and professional computer training. Your success is our mission.' },
    { key: 'operating_hours_start', value: '07:00' },
    { key: 'operating_hours_end', value: '22:00' },
    { key: 'hourly_rate', value: '100' },
    { key: 'monthly_rate', value: '3000' },
    { key: 'hero_badge_text', value: 'Admissions Open 2025-26' },
    { key: 'hero_banner_text', value: 'New batches starting soon!' },
    { key: 'footer_cta_title', value: 'New Batches Starting Soon!' },
    { key: 'footer_cta_subtitle', value: 'Enroll now to secure your seat.' },
  ];

  for (const setting of settings) {
    await db.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log('Created settings (' + settings.length + ')');

  // ─── Departments ────────────────────────────────────────
  const deptNames = ['Computer Training', 'SSC', 'Banking', 'UPSC', 'Railway'];
  const deptRecords: Record<string, string> = {};

  for (const name of deptNames) {
    const dept = await db.department.upsert({
      where: { name },
      update: { status: 'active' },
      create: { name, status: 'active' },
    });
    deptRecords[name] = dept.id;
  }
  console.log('Created departments (' + deptNames.length + ')');

  // ─── Courses ────────────────────────────────────────────
  // Computer Training courses
  const computerCourses = [
    { name: 'CCC (Course on Computer Concepts)', duration: '3 months', totalFee: 500000, description: 'NIELIT certified basic computer course covering office automation, internet, and digital literacy. Ideal for government job requirements.' },
    { name: 'Tally Prime with GST', duration: '3 months', totalFee: 600000, description: 'Master Tally Prime for accounting, inventory management, GST filing, and financial reporting. Hands-on practice with real business data.' },
    { name: 'Advanced Excel & Data Analysis', duration: '2 months', totalFee: 400000, description: 'From formulas to pivot tables, macros, and data visualization. Become proficient in business data analysis and reporting.' },
    { name: 'Web Design & Development', duration: '6 months', totalFee: 1500000, description: 'Learn HTML, CSS, JavaScript, React, and build responsive websites from scratch. Portfolio project included.' },
    { name: 'Python Programming', duration: '4 months', totalFee: 1200000, description: 'From basics to advanced Python including data structures, OOP, file handling, and real-world projects.' },
    { name: 'Typing (Hindi & English)', duration: '2 months', totalFee: 250000, description: 'Improve your typing speed in both Hindi and English. Essential for government exam computer proficiency tests.' },
  ];

  for (const c of computerCourses) {
    await db.course.upsert({
      where: { id: `${deptRecords['Computer Training']}-${c.name}` },
      update: {},
      create: { name: c.name, duration: c.duration, totalFee: c.totalFee, description: c.description, departmentId: deptRecords['Computer Training'], status: 'active' },
    });
  }

  // SSC courses
  const sscCourses = [
    { name: 'SSC CGL Preparation', duration: '6 months', totalFee: 1500000, description: 'Complete SSC CGL coaching covering Tier I, II, and III with mock tests, previous year papers, and doubt sessions.' },
    { name: 'SSC CHSL Preparation', duration: '5 months', totalFee: 1200000, description: 'Structured coaching for SSC CHSL exam with focus on typing test, descriptive paper, and objective tests.' },
    { name: 'SSC MTS Coaching', duration: '3 months', totalFee: 800000, description: 'Focused preparation for SSC MTS exam covering reasoning, numerical aptitude, and general awareness.' },
  ];

  for (const c of sscCourses) {
    await db.course.upsert({
      where: { id: `${deptRecords['SSC']}-${c.name}` },
      update: {},
      create: { name: c.name, duration: c.duration, totalFee: c.totalFee, description: c.description, departmentId: deptRecords['SSC'], status: 'active' },
    });
  }

  // Banking courses
  const bankingCourses = [
    { name: 'IBPS PO Coaching', duration: '6 months', totalFee: 1800000, description: 'Complete IBPS PO preparation with prelims and mains strategy, mock interviews, and sectional tests.' },
    { name: 'SBI Clerk Preparation', duration: '4 months', totalFee: 1200000, description: 'Focused SBI Clerk exam coaching with practice sessions, speed tests, and current affairs updates.' },
    { name: 'IBPS RRB Coaching', duration: '5 months', totalFee: 1400000, description: 'Specialized coaching for IBPS RRB Officer and Assistant exams with regional language support.' },
  ];

  for (const c of bankingCourses) {
    await db.course.upsert({
      where: { id: `${deptRecords['Banking']}-${c.name}` },
      update: {},
      create: { name: c.name, duration: c.duration, totalFee: c.totalFee, description: c.description, departmentId: deptRecords['Banking'], status: 'active' },
    });
  }

  // UPSC courses
  const upscCourses = [
    { name: 'UPSC CSE Foundation', duration: '12 months', totalFee: 3500000, description: 'Comprehensive UPSC Civil Services coaching covering Prelims, Mains, and Interview preparation with experienced faculty.' },
    { name: 'UPSC Prelims Crash Course', duration: '3 months', totalFee: 1000000, description: 'Intensive prelims-focused course with daily tests, current affairs, and answer writing practice.' },
  ];

  for (const c of upscCourses) {
    await db.course.upsert({
      where: { id: `${deptRecords['UPSC']}-${c.name}` },
      update: {},
      create: { name: c.name, duration: c.duration, totalFee: c.totalFee, description: c.description, departmentId: deptRecords['UPSC'], status: 'active' },
    });
  }

  // Railway courses
  const railwayCourses = [
    { name: 'RRB NTPC Coaching', duration: '4 months', totalFee: 1000000, description: 'Complete RRB NTPC preparation with CBT 1 & 2 strategy, typing practice, and mock tests.' },
    { name: 'RRB Group D Coaching', duration: '3 months', totalFee: 800000, description: 'Focused coaching for RRB Group D exam covering mathematics, reasoning, general science, and current affairs.' },
  ];

  for (const c of railwayCourses) {
    await db.course.upsert({
      where: { id: `${deptRecords['Railway']}-${c.name}` },
      update: {},
      create: { name: c.name, duration: c.duration, totalFee: c.totalFee, description: c.description, departmentId: deptRecords['Railway'], status: 'active' },
    });
  }

  console.log('Created courses for all departments');

  // ─── Notices ────────────────────────────────────────────
  const notices = [
    { title: 'New Computer Batch Starting May 5th', content: 'Admissions are now open for the new CCC and Tally Prime batches starting May 5th, 2026. Limited seats available. Register now to secure your spot!', pinned: true, status: 'published' },
    { title: 'SSC CGL 2026 Batch Enrollment Open', content: 'Enrollments for the SSC CGL 2026 preparation batch are now open. Classes will be held Monday to Saturday from 7 AM to 10 AM. Early bird discount available.', pinned: true, status: 'published' },
    { title: 'Holiday Notice: Independence Day', content: 'The coaching center will remain closed on August 15th on account of Independence Day. Regular classes will resume on August 16th.', pinned: false, status: 'published' },
    { title: 'Free Demo Class This Saturday', content: 'We are offering a free demo class for Python Programming this Saturday at 10 AM. All interested students are welcome to attend. No registration required.', pinned: false, status: 'published' },
  ];

  for (const n of notices) {
    const existing = await db.notice.findFirst({ where: { title: n.title } });
    if (!existing) {
      await db.notice.create({ data: n });
    }
  }
  console.log('Created notices');

  // ─── Cabins ─────────────────────────────────────────────
  for (let i = 1; i <= 25; i++) {
    await db.cabin.upsert({
      where: { cabinNum: i },
      update: {},
      create: {
        cabinNum: i,
        status: 'active',
        notes: i <= 5 ? 'Ground floor, near entrance' : i <= 10 ? 'Ground floor, quiet zone' : i <= 15 ? 'First floor, AC section' : i <= 20 ? 'First floor, standard' : 'Second floor, premium',
      },
    });
  }
  console.log('Created 25 cabins');

  // ─── Students ───────────────────────────────────────────
  const students = [
    { name: 'Rahul Sharma', phone: '9876543210', email: 'rahul@example.com', address: 'Lamka, Manipur' },
    { name: 'Priya Devi', phone: '9876543211', email: 'priya@example.com', address: 'Churachandpur' },
    { name: 'Amit Singh', phone: '9876543212', email: null, address: 'Imphal' },
    { name: 'Neha Kumari', phone: '9876543213', email: 'neha@example.com', address: 'Lamka, Manipur' },
    { name: 'Raj Kumar', phone: '9876543214', email: null, address: 'Churachandpur' },
    { name: 'Sunita Devi', phone: '9876543215', email: 'sunita@example.com', address: 'Imphal East' },
    { name: 'Vikram Meitei', phone: '9876543216', email: null, address: 'Lamka, Manipur' },
    { name: 'Anjali Thapa', phone: '9876543217', email: 'anjali@example.com', address: 'Churachandpur' },
  ];

  for (const student of students) {
    await db.student.upsert({
      where: { phone: student.phone },
      update: {},
      create: student,
    });
  }
  console.log('Created students');

  // ─── Bookings (including pending) ───────────────────────
  const rahul = await db.student.findUnique({ where: { phone: '9876543210' } });
  const priya = await db.student.findUnique({ where: { phone: '9876543211' } });
  const amit = await db.student.findUnique({ where: { phone: '9876543212' } });
  const neha = await db.student.findUnique({ where: { phone: '9876543213' } });
  const raj = await db.student.findUnique({ where: { phone: '9876543214' } });
  const sunita = await db.student.findUnique({ where: { phone: '9876543215' } });

  const cabin1 = await db.cabin.findUnique({ where: { cabinNum: 1 } });
  const cabin2 = await db.cabin.findUnique({ where: { cabinNum: 2 } });
  const cabin3 = await db.cabin.findUnique({ where: { cabinNum: 3 } });
  const cabin5 = await db.cabin.findUnique({ where: { cabinNum: 5 } });
  const cabin6 = await db.cabin.findUnique({ where: { cabinNum: 6 } });

  // Active exclusive booking
  if (rahul && cabin1) {
    const existing = await db.booking.findFirst({ where: { studentId: rahul.id, cabinId: cabin1.id, status: 'active' } });
    if (!existing) {
      await db.booking.create({
        data: {
          studentId: rahul.id, cabinId: cabin1.id, type: 'exclusive', status: 'active',
          startDate: new Date('2026-04-01'), endDate: new Date('2026-05-01'),
          totalAmount: 300000, paidAmount: 200000,
        },
      });
    }
  }

  // Active hourly booking (today)
  if (priya && cabin2) {
    const today = new Date().toISOString().split('T')[0];
    const existing = await db.booking.findFirst({ where: { studentId: priya.id, cabinId: cabin2.id, status: 'active', startDate: new Date(today) } });
    if (!existing) {
      await db.booking.create({
        data: {
          studentId: priya.id, cabinId: cabin2.id, type: 'hourly', status: 'active',
          startDate: new Date(today), startTime: '09:00', endTime: '12:00',
          totalAmount: 30000, paidAmount: 30000,
        },
      });
    }
  }

  // Active exclusive booking for neha
  if (neha && cabin3) {
    const existing = await db.booking.findFirst({ where: { studentId: neha.id, cabinId: cabin3.id, status: 'active' } });
    if (!existing) {
      await db.booking.create({
        data: {
          studentId: neha.id, cabinId: cabin3.id, type: 'exclusive', status: 'active',
          startDate: new Date('2026-03-15'), endDate: new Date('2026-04-15'),
          totalAmount: 300000, paidAmount: 300000,
        },
      });
    }
  }

  // Pending bookings (to test approve/reject feature)
  if (amit && cabin5) {
    const existing = await db.booking.findFirst({ where: { studentId: amit.id, cabinId: cabin5.id, status: 'pending' } });
    if (!existing) {
      await db.booking.create({
        data: {
          studentId: amit.id, cabinId: cabin5.id, type: 'exclusive', status: 'pending',
          startDate: new Date('2026-05-01'), endDate: new Date('2026-06-01'),
          totalAmount: 300000, paidAmount: 0,
        },
      });
    }
  }

  if (raj && cabin6) {
    const existing = await db.booking.findFirst({ where: { studentId: raj.id, cabinId: cabin6.id, status: 'pending' } });
    if (!existing) {
      const today = new Date().toISOString().split('T')[0];
      await db.booking.create({
        data: {
          studentId: raj.id, cabinId: cabin6.id, type: 'hourly', status: 'pending',
          startDate: new Date(today), startTime: '14:00', endTime: '18:00',
          totalAmount: 40000, paidAmount: 0,
        },
      });
    }
  }

  console.log('Created bookings (active + pending)');

  // ─── Sample Enrollment ──────────────────────────────────
  if (rahul) {
    const cccCourse = await db.course.findFirst({ where: { name: 'CCC (Course on Computer Concepts)' } });
    if (cccCourse) {
      const existing = await db.enrollment.findFirst({ where: { studentId: rahul.id, courseId: cccCourse.id } });
      if (!existing) {
        await db.enrollment.create({
          data: {
            studentId: rahul.id, courseId: cccCourse.id,
            startDate: new Date('2026-04-01'),
            totalFee: cccCourse.totalFee, paidAmount: 250000, status: 'active',
          },
        });
      }
    }
  }

  if (priya) {
    const tallyCourse = await db.course.findFirst({ where: { name: 'Tally Prime with GST' } });
    if (tallyCourse) {
      const existing = await db.enrollment.findFirst({ where: { studentId: priya.id, courseId: tallyCourse.id } });
      if (!existing) {
        await db.enrollment.create({
          data: {
            studentId: priya.id, courseId: tallyCourse.id,
            startDate: new Date('2026-04-15'),
            totalFee: tallyCourse.totalFee, paidAmount: 300000, status: 'active',
          },
        });
      }
    }
  }

  if (sunita) {
    const sscCourse = await db.course.findFirst({ where: { name: 'SSC CGL Preparation' } });
    if (sscCourse) {
      const existing = await db.enrollment.findFirst({ where: { studentId: sunita.id, courseId: sscCourse.id } });
      if (!existing) {
        await db.enrollment.create({
          data: {
            studentId: sunita.id, courseId: sscCourse.id,
            startDate: new Date('2026-03-01'),
            totalFee: sscCourse.totalFee, paidAmount: 750000, status: 'active',
          },
        });
      }
    }
  }

  console.log('Created sample enrollments');

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
