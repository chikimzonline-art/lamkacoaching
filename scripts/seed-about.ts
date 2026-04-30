import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed team members
  const teamMembers = [
    { name: 'Thangkhopao Kipgen', role: 'Founder & Director', bio: 'Visionary leader with over 15 years of experience in education and community development. Founded Lamka Coaching Center with a mission to make quality education accessible to every student in the region.', initials: 'TK', color: 'from-cyan-500 to-sky-500', sortOrder: 0 },
    { name: 'Lalhriatpuii', role: 'Head of Academics', bio: 'Experienced educator specializing in competitive exam preparation. Oversees curriculum design, faculty training, and ensures every student receives the guidance they need to succeed.', initials: 'LP', color: 'from-blue-500 to-indigo-500', sortOrder: 1 },
    { name: 'Thangboi Lhungdim', role: 'Computer Training Head', bio: 'IT professional with expertise in software development and digital literacy training. Leads the Computer Training department, bringing industry-relevant skills to the classroom.', initials: 'TL', color: 'from-cyan-500 to-teal-500', sortOrder: 2 },
    { name: 'Nemnilhing Haokip', role: 'Student Counselor', bio: 'Dedicated counselor who guides students through their academic journey, from course selection to career planning. Ensures every student feels supported and motivated throughout their preparation.', initials: 'NH', color: 'from-purple-500 to-violet-500', sortOrder: 3 },
    { name: 'Lunghthawan Touthang', role: 'Operations Manager', bio: "Keeps everything running smoothly — from cabin bookings and facility management to scheduling and student services. The backbone of the center's day-to-day operations.", initials: 'LT', color: 'from-green-500 to-emerald-500', sortOrder: 4 },
    { name: 'Khamkhanpau Gangte', role: 'Faculty - Competitive Exams', bio: 'Seasoned teacher with a proven track record of producing successful candidates in SSC, Banking, and Railway exams. Known for making complex concepts easy to understand.', initials: 'KG', color: 'from-orange-500 to-amber-500', sortOrder: 5 },
  ];

  for (const member of teamMembers) {
    await prisma.teamMember.upsert({
      where: { id: `seed-${member.initials}` },
      update: member,
      create: { id: `seed-${member.initials}`, ...member },
    });
  }
  console.log(`Seeded ${teamMembers.length} team members`);

  // Seed milestones
  const milestones = [
    { year: '2018', event: 'Founded Lamka Coaching Center with a vision to transform education in the region, starting with just two classrooms and a handful of dedicated students.', sortOrder: 0 },
    { year: '2019', event: 'Launched Computer Training department with CCC and Tally courses, bringing essential digital skills to the community for the first time.', sortOrder: 1 },
    { year: '2020', event: 'Expanded competitive exam coaching to include Banking and UPSC preparation, despite the challenges of the pandemic year.', sortOrder: 2 },
    { year: '2021', event: 'Introduced dedicated Study Cabin facility with 20+ cabins, providing students with quiet, focused study spaces available throughout the day.', sortOrder: 3 },
    { year: '2023', event: 'Crossed the milestone of 500+ trained students, with successful candidates placed in government jobs across multiple departments.', sortOrder: 4 },
    { year: '2025', event: 'Launched advanced IT programs including Python and Web Development, and expanded to a full-service education hub with modern infrastructure.', sortOrder: 5 },
  ];

  for (const milestone of milestones) {
    await prisma.aboutMilestone.upsert({
      where: { id: `seed-ms-${milestone.sortOrder}` },
      update: milestone,
      create: { id: `seed-ms-${milestone.sortOrder}`, ...milestone },
    });
  }
  console.log(`Seeded ${milestones.length} milestones`);

  // Seed about page text content as settings
  const aboutSettings = [
    { key: 'about_story', value: 'Lamka Coaching Center was founded in 2018 with a simple yet powerful belief — that every student, regardless of their background or circumstances, deserves access to quality education and the opportunity to build a better life. What started as a small coaching class in Lamka, Churachandpur, has grown into a full-service education hub that serves hundreds of students every year.' },
    { key: 'about_story_extra', value: 'We offer a unique combination of services under one roof: expert coaching for competitive government exams like SSC, Banking, UPSC, and Railway; professional computer training programs ranging from basic CCC to advanced Python and Web Development; and dedicated study cabin spaces designed for focused, distraction-free learning. This holistic approach ensures that students can find everything they need to succeed without having to look elsewhere.' },
    { key: 'about_story_closing', value: "Our team of experienced educators, industry professionals, and dedicated support staff work together to create an environment where students don't just prepare for exams — they develop the skills, confidence, and discipline needed to excel in their careers and in life. With small batch sizes, personalized attention, and a result-oriented approach, we have helped over 500 students achieve their goals and secure their future." },
    { key: 'about_mission', value: 'To provide accessible, high-quality education and training that empowers students from all backgrounds to achieve their career goals. We are committed to delivering practical, result-oriented coaching programs that combine expert instruction with modern teaching methods, ensuring every student is prepared to face competitive exams and professional challenges with confidence and competence.' },
    { key: 'about_vision', value: 'To become the most trusted and impactful education center in the region — a place where aspirations turn into achievements. We envision a future where every young person in our community has the skills, knowledge, and opportunity to build a successful career, whether in government service, the IT industry, or any field they choose to pursue. Through continuous innovation and unwavering dedication, we aim to be the catalyst for that transformation.' },
  ];

  for (const setting of aboutSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log(`Seeded ${aboutSettings.length} about settings`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
