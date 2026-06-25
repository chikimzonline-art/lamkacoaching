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
    { key: 'shift_morning_rate', value: '500' },
    { key: 'shift_day_rate', value: '800' },
    { key: 'shift_night_rate', value: '800' },
    { key: 'booking_registration_fee', value: '500' },
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
  for (let i = 1; i <= 45; i++) {
    await db.cabin.upsert({
      where: { floor_cabinNum: { floor: 3, cabinNum: i } },
      update: {},
      create: {
        floor: 3,
        cabinNum: i,
        status: 'active',
        notes: i <= 15 ? '3rd Floor, near entrance' : i <= 30 ? '3rd Floor, quiet zone' : '3rd Floor, standard',
      },
    });
  }
  for (let i = 1; i <= 25; i++) {
    await db.cabin.upsert({
      where: { floor_cabinNum: { floor: 4, cabinNum: i } },
      update: {},
      create: {
        floor: 4,
        cabinNum: i,
        status: 'active',
        notes: i <= 10 ? '4th Floor, premium' : '4th Floor, standard',
      },
    });
  }
  console.log('Created 70 cabins (45 on 3rd floor + 25 on 4th floor)');

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

  const cabin1 = await db.cabin.findUnique({ where: { floor_cabinNum: { floor: 3, cabinNum: 1 } } });
  const cabin2 = await db.cabin.findUnique({ where: { floor_cabinNum: { floor: 3, cabinNum: 2 } } });
  const cabin3 = await db.cabin.findUnique({ where: { floor_cabinNum: { floor: 3, cabinNum: 3 } } });
  const cabin5 = await db.cabin.findUnique({ where: { floor_cabinNum: { floor: 3, cabinNum: 5 } } });
  const cabin6 = await db.cabin.findUnique({ where: { floor_cabinNum: { floor: 3, cabinNum: 6 } } });

  // Active exclusive booking
  if (rahul && cabin1) {
    const existing = await db.booking.findFirst({ where: { studentId: rahul.id, cabinId: cabin1.id, status: 'active' } });
    if (!existing) {
      await db.booking.create({
        data: {
          studentId: rahul.id, cabinId: cabin1.id, type: 'reserved', status: 'active',
          startDate: new Date('2026-04-01'), endDate: new Date('2026-05-01'),
          totalAmount: 350000, paidAmount: 200000,
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
          studentId: priya.id, cabinId: cabin2.id, type: 'shift', status: 'active',
          startDate: new Date(today), startTime: '05:00', endTime: '10:00',
          totalAmount: 100000, paidAmount: 100000,
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
          studentId: neha.id, cabinId: cabin3.id, type: 'reserved', status: 'active',
          startDate: new Date('2026-03-15'), endDate: new Date('2026-04-15'),
          totalAmount: 350000, paidAmount: 350000,
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
          studentId: amit.id, cabinId: cabin5.id, type: 'reserved', status: 'pending',
          startDate: new Date('2026-05-01'), endDate: new Date('2026-06-01'),
          totalAmount: 350000, paidAmount: 0,
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
          studentId: raj.id, cabinId: cabin6.id, type: 'shift', status: 'pending',
          startDate: new Date(today), startTime: '10:00', endTime: '17:00',
          totalAmount: 130000, paidAmount: 0,
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

  // ─── Impact Stats ──────────────────────────────────────
  const impactStats = [
    { label: 'Students Trained', value: 2500, suffix: '+', iconName: 'GraduationCap', iconBg: 'bg-cyan-500/20', iconColor: 'text-cyan-400', numberColor: 'text-cyan-400', sortOrder: 1 },
    { label: 'Selection Rate', value: 85, suffix: '%', iconName: 'TrendingUp', iconBg: 'bg-emerald-500/20', iconColor: 'text-emerald-400', numberColor: 'text-emerald-400', sortOrder: 2 },
    { label: 'Expert Faculty', value: 30, suffix: '+', iconName: 'Users', iconBg: 'bg-amber-500/20', iconColor: 'text-amber-400', numberColor: 'text-amber-400', sortOrder: 3 },
    { label: 'Years of Excellence', value: 10, suffix: '+', iconName: 'Award', iconBg: 'bg-rose-500/20', iconColor: 'text-rose-400', numberColor: 'text-rose-400', sortOrder: 4 },
  ];

  for (const stat of impactStats) {
    const existing = await db.impactStat.findFirst({ where: { label: stat.label } });
    if (!existing) {
      await db.impactStat.create({ data: stat });
    }
  }
  console.log('Created impact stats');

  // ─── Achievement Cards ─────────────────────────────────
  const achievementCards = [
    { badge: 'Top Result', badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', title: 'SSC CGL 2025 - AIR 45', description: 'Our student secured All India Rank 45 in SSC CGL 2025, making us proud with outstanding performance.', barColor: 'from-cyan-500 to-sky-400', sortOrder: 1 },
    { badge: 'Banking', badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', title: 'IBPS PO Selection - 28 Students', description: '28 students from our banking batch cleared the IBPS PO exam in 2025, a record for our center.', barColor: 'from-emerald-500 to-green-400', sortOrder: 2 },
    { badge: 'Computer', badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20', title: '100% CCC Pass Rate', description: 'All 120 students who appeared for the NIELIT CCC exam from our center passed with distinction.', barColor: 'from-amber-500 to-yellow-400', sortOrder: 3 },
    { badge: 'Railway', badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20', title: 'RRB NTPC - 15 Selections', description: '15 of our students were selected in RRB NTPC 2025, continuing our strong track record in railway exams.', barColor: 'from-rose-500 to-pink-400', sortOrder: 4 },
  ];

  for (const card of achievementCards) {
    const existing = await db.achievementCard.findFirst({ where: { title: card.title } });
    if (!existing) {
      await db.achievementCard.create({ data: card });
    }
  }
  console.log('Created achievement cards');

  // ─── Success Stories ───────────────────────────────────
  const successStories = [
    { name: 'Thangminlen Haokip', exam: 'SSC CGL 2025', quote: 'The structured approach and personal attention at Lamka Coaching made all the difference. I could not have achieved AIR 45 without the amazing faculty here.', result: 'AIR 45', initials: 'TH', gradient: 'from-cyan-500 to-sky-500', sortOrder: 1 },
    { name: 'Lunghing Singson', exam: 'IBPS PO 2025', quote: 'From basics to mock interviews, every step was guided perfectly. The banking batch preparation was thorough and well-organized.', result: 'Selected', initials: 'LS', gradient: 'from-emerald-500 to-teal-500', sortOrder: 2 },
    { name: 'Nemlal Hangshing', exam: 'RRB NTPC 2025', quote: 'I joined Lamka Coaching with zero preparation and within 4 months, I cleared RRB NTPC. The study material and test series are top-notch.', result: 'Selected', initials: 'NH', gradient: 'from-amber-500 to-orange-500', sortOrder: 3 },
    { name: 'Kimson Touthang', exam: 'NIELIT CCC 2025', quote: 'The computer training here is practical and industry-relevant. I passed CCC with distinction and it helped me get my government job.', result: 'Distinction', initials: 'KT', gradient: 'from-rose-500 to-pink-500', sortOrder: 4 },
    { name: 'Dilkim Chongloi', exam: 'UPSC CSE 2024', quote: 'The foundation course at Lamka Coaching gave me the confidence and clarity to pursue civil services. The faculty mentorship was invaluable.', result: 'Prelims Cleared', initials: 'DC', gradient: 'from-violet-500 to-purple-500', sortOrder: 5 },
    { name: 'Hening Kipgen', exam: 'SSC CHSL 2025', quote: 'Affordable fees, excellent teaching, and a supportive environment. Lamka Coaching is the best in Churachandpur for competitive exam preparation.', result: 'Selected', initials: 'HK', gradient: 'from-cyan-500 to-emerald-500', sortOrder: 6 },
  ];

  for (const story of successStories) {
    const existing = await db.successStory.findFirst({ where: { name: story.name, exam: story.exam } });
    if (!existing) {
      await db.successStory.create({ data: story });
    }
  }
  console.log('Created success stories');

  // ─── Testimonials ──────────────────────────────────────
  const testimonials = [
    { name: 'Rahul Sharma', course: 'SSC CGL Preparation', badge: 'Selected', badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', text: 'Lamka Coaching Center transformed my preparation completely. The teachers are dedicated and the study material is comprehensive. I cracked SSC CGL in my first attempt thanks to their guidance.', rating: 5, avatar: 'RS', gradient: 'from-cyan-500 to-teal-500', sortOrder: 1 },
    { name: 'Priya Devi', course: 'Tally Prime with GST', badge: 'Certified', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', text: 'The Tally Prime course was very practical. Within 3 months, I was confident enough to handle real accounting work. Now I work as an accountant at a local firm.', rating: 5, avatar: 'PD', gradient: 'from-emerald-500 to-green-500', sortOrder: 2 },
    { name: 'Vikram Meitei', course: 'IBPS PO Coaching', badge: 'Selected', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30', text: 'The mock test series and interview preparation at Lamka Coaching are exceptional. The faculty goes above and beyond to ensure every student is well-prepared.', rating: 5, avatar: 'VM', gradient: 'from-amber-500 to-orange-500', sortOrder: 3 },
    { name: 'Sunita Devi', course: 'CCC (Course on Computer Concepts)', badge: 'Distinction', badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30', text: 'I had never used a computer before joining Lamka Coaching. The patient teaching method helped me learn from scratch and pass CCC with distinction. Highly recommended!', rating: 5, avatar: 'SD', gradient: 'from-rose-500 to-pink-500', sortOrder: 4 },
    { name: 'Amit Singh', course: 'Python Programming', badge: 'Completed', badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30', text: 'The Python course was well-structured with lots of hands-on projects. I now build small automation tools at my workplace. Great value for money!', rating: 4, avatar: 'AS', gradient: 'from-violet-500 to-purple-500', sortOrder: 5 },
    { name: 'Anjali Thapa', course: 'UPSC CSE Foundation', badge: 'Prelims Cleared', badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30', text: 'The foundation course gave me a solid base for UPSC preparation. The current affairs sessions and answer writing practice were particularly helpful. Thank you, Lamka Coaching!', rating: 5, avatar: 'AT', gradient: 'from-sky-500 to-cyan-500', sortOrder: 6 },
  ];

  for (const t of testimonials) {
    const existing = await db.testimonial.findFirst({ where: { name: t.name, course: t.course } });
    if (!existing) {
      await db.testimonial.create({ data: t });
    }
  }
  console.log('Created testimonials');

  // ─── FAQs ──────────────────────────────────────────────
  const faqs = [
    { question: 'What courses does Lamka Coaching Center offer?', answer: 'We offer a wide range of courses including Computer Training (CCC, Tally Prime, Advanced Excel, Web Design, Python), SSC exam preparation (CGL, CHSL, MTS), Banking exam coaching (IBPS PO, SBI Clerk, IBPS RRB), UPSC CSE Foundation, and Railway exam coaching (RRB NTPC, RRB Group D).', sortOrder: 1, active: true },
    { question: 'What are the class timings?', answer: 'Our classes run from 7:00 AM to 10:00 PM, Monday to Saturday. Batch timings vary by course. Morning batches are from 7-10 AM, afternoon batches from 2-5 PM, and evening batches from 6-9 PM. Sunday classes are available for special revision and doubt-clearing sessions.', sortOrder: 2, active: true },
    { question: 'How can I enroll in a course?', answer: 'You can enroll by visiting our center at Lamka, Churachandpur, or by calling us at +91 3874 123456. You can also fill out the contact form on our website. Our counselors will guide you through the enrollment process and help you choose the right course.', sortOrder: 3, active: true },
    { question: 'Do you offer demo classes?', answer: 'Yes! We offer free demo classes for all our courses so you can experience our teaching methodology before enrolling. Demo classes are held every Saturday. No registration is required—just walk in and attend!', sortOrder: 4, active: true },
    { question: 'What is the fee structure?', answer: 'Our fees vary by course and range from ₹2,500 for short-term courses to ₹35,000 for long-term comprehensive programs. We offer installment payment options and early bird discounts. Please contact us for detailed fee information for your chosen course.', sortOrder: 5, active: true },
    { question: 'Is study material provided?', answer: 'Yes, we provide comprehensive study material including printed notes, practice workbooks, and access to our online test series. All materials are included in the course fee and are regularly updated to match the latest exam patterns.', sortOrder: 6, active: true },
    { question: 'Do you provide job placement assistance?', answer: 'While we do not guarantee placement, we provide career counseling, resume building workshops, and interview preparation sessions. Many of our alumni have been placed in government jobs, banks, and private companies. Our strong track record speaks for itself.', sortOrder: 7, active: true },
    { question: 'Can I join mid-batch?', answer: 'In most cases, yes. Our teachers provide extra support to help you catch up on missed topics. However, for some intensive courses, we recommend joining at the start of a new batch for the best learning experience.', sortOrder: 8, active: true },
  ];

  for (const faq of faqs) {
    const existing = await db.fAQ.findFirst({ where: { question: faq.question } });
    if (!existing) {
      await db.fAQ.create({ data: faq });
    }
  }
  console.log('Created FAQs');

  // ─── About Us - Team Members ──────────────────────────
  const teamMembers = [
    { name: 'Thangkham Singson', role: 'Founder & Director', bio: 'With over 15 years of experience in education, Thangkham founded Lamka Coaching Center with a vision to provide quality coaching to students in Churachandpur. His leadership has guided thousands of students to success.', initials: 'TS', color: 'from-cyan-500 to-sky-500', sortOrder: 1 },
    { name: 'Dr. Ningthoujam Roshan', role: 'Head of Academics', bio: 'PhD in Mathematics with 12 years of teaching experience. Dr. Roshan designs our curriculum and ensures every course meets the highest academic standards. His students consistently top competitive exams.', initials: 'NR', color: 'from-emerald-500 to-teal-500', sortOrder: 2 },
    { name: 'Khamkhenthang Haokip', role: 'Computer Training Head', bio: 'MCA with industry experience in software development. Khamkhenthang leads our computer training department, bringing real-world expertise to courses like CCC, Tally Prime, and Python Programming.', initials: 'KH', color: 'from-amber-500 to-orange-500', sortOrder: 3 },
    { name: 'Laldiklung Chongloi', role: 'Banking & SSC Faculty', bio: 'A former bank officer with 8 years of coaching experience. Laldiklung specializes in quantitative aptitude and reasoning, and has helped over 200 students crack banking and SSC exams.', initials: 'LC', color: 'from-rose-500 to-pink-500', sortOrder: 4 },
  ];

  for (const member of teamMembers) {
    const existing = await db.teamMember.findFirst({ where: { name: member.name } });
    if (!existing) {
      await db.teamMember.create({ data: member });
    }
  }
  console.log('Created team members');

  // ─── About Us - Milestones ─────────────────────────────
  const milestones = [
    { year: '2015', event: 'Lamka Coaching Center established with 2 rooms and 15 students', sortOrder: 1 },
    { year: '2016', event: 'Launched Computer Training department with CCC and Tally courses', sortOrder: 2 },
    { year: '2017', event: 'First batch of SSC students—12 out of 15 selected', sortOrder: 3 },
    { year: '2018', event: 'Expanded to Banking exam coaching; 500+ students trained', sortOrder: 4 },
    { year: '2019', event: 'Introduced UPSC CSE Foundation course; moved to larger premises', sortOrder: 5 },
    { year: '2020', event: 'Launched online classes during pandemic; 1000+ students trained online', sortOrder: 6 },
    { year: '2021', event: 'Added Railway exam coaching; crossed 1500+ alumni milestone', sortOrder: 7 },
    { year: '2022', event: 'Opened 70-seat study cabin facility across 2 floors', sortOrder: 8 },
    { year: '2023', event: 'Achieved 85% selection rate in banking exams; 2000+ students trained', sortOrder: 9 },
    { year: '2024', event: 'Launched Python Programming and Web Development courses', sortOrder: 10 },
    { year: '2025', event: 'SSC CGL AIR 45 achievement; 2500+ students trained to date', sortOrder: 11 },
  ];

  for (const milestone of milestones) {
    const existing = await db.aboutMilestone.findFirst({ where: { year: milestone.year, event: milestone.event } });
    if (!existing) {
      await db.aboutMilestone.create({ data: milestone });
    }
  }
  console.log('Created about milestones');

  // ─── Additional Settings (About Us & Homepage) ────────
  const additionalSettings = [
    { key: 'about_title', value: 'About Lamka Coaching Center' },
    { key: 'about_subtitle', value: 'Empowering Dreams, Building Futures Since 2015' },
    { key: 'about_mission', value: 'To provide affordable, high-quality coaching and computer training to students in Churachandpur and the surrounding areas, enabling them to achieve their career goals and contribute to the development of our community.' },
    { key: 'about_vision', value: 'To be the most trusted and impactful coaching center in Northeast India, known for producing top results in competitive exams and creating skilled professionals through our computer training programs.' },
    { key: 'about_story', value: 'Founded in 2015 by Thangkham Singson, Lamka Coaching Center started with just 2 rooms and 15 students in the heart of Lamka, Churachandpur. What began as a small initiative to help local youth prepare for government exams has grown into one of the most respected coaching centers in Manipur. Over the past decade, we have trained over 2,500 students, with many securing positions in government services, banks, railways, and the private sector. Our success is built on a foundation of dedicated faculty, comprehensive study material, and a genuine commitment to every student who walks through our doors.' },
    { key: 'impact_section_title', value: 'Our Impact' },
    { key: 'impact_section_subtitle', value: 'Numbers that reflect our commitment to excellence' },
    { key: 'achievement_section_title', value: 'Recent Achievements' },
    { key: 'achievement_section_subtitle', value: 'Celebrating the success of our students' },
    { key: 'success_stories_title', value: 'Success Stories' },
    { key: 'success_stories_subtitle', value: 'Hear from students who achieved their dreams with us' },
    { key: 'testimonial_section_title', value: 'What Our Students Say' },
    { key: 'testimonial_section_subtitle', value: 'Real experiences from real students' },
    { key: 'faq_section_title', value: 'Frequently Asked Questions' },
    { key: 'faq_section_subtitle', value: 'Find answers to common questions about our courses and services' },
  ];

  for (const setting of additionalSettings) {
    await db.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log('Created additional settings (' + additionalSettings.length + ')');

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
