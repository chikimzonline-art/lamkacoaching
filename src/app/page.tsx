import { db } from '@/lib/db';
import HomeClient from './home-client';

export default async function HomePage() {
  const [departments, notices, settings, successStories, faqs, cabinCount] = await Promise.all([
    // Fetch departments & active courses
    db.department.findMany({
      where: { status: 'active' },
      orderBy: { name: 'asc' },
      include: {
        courses: {
          where: { status: 'active' },
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            duration: true,
            totalFee: true,
            description: true,
            createdAt: true,
          },
        },
      },
    }),

    // Fetch latest published notices
    db.notice.findMany({
      where: { status: 'published' },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      take: 4,
    }),

    // Fetch site settings
    db.setting.findMany({
      where: {
        key: {
          in: [
            'business_name',
            'business_phone',
            'business_email',
            'business_address',
            'business_description',
            'hero_badge_text',
            'hero_banner_text',
            'footer_cta_title',
            'footer_cta_subtitle',
            'logo_url',
            'favicon_url',
          ],
        },
      },
    }),

    // Fetch success stories
    db.successStory.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    }),

    // Fetch FAQs
    db.fAQ.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    }),

    // Active cabins count
    db.cabin.count({ where: { status: 'active' } }),
  ]);

  // Serialize notices dates for the client component
  const serializedNotices = notices.map((n) => ({
    id: n.id,
    title: n.title,
    content: n.content,
    pinned: n.pinned,
    createdAt: n.createdAt.toISOString(),
  }));

  // Map settings keys to frontend camelCase keys
  const siteKeyMap: Record<string, string> = {
    'business_name': 'businessName',
    'business_phone': 'businessPhone',
    'business_email': 'businessEmail',
    'business_address': 'businessAddress',
    'business_description': 'businessDescription',
    'hero_badge_text': 'heroBadgeText',
    'hero_banner_text': 'heroBannerText',
    'footer_cta_title': 'footerCtaTitle',
    'footer_cta_subtitle': 'footerCtaSubtitle',
    'logo_url': 'logoUrl',
    'favicon_url': 'faviconUrl',
  };

  const siteSettingsMap: Record<string, string> = {};
  settings.forEach((s) => {
    const camelKey = siteKeyMap[s.key] || s.key;
    siteSettingsMap[camelKey] = s.value;
  });

  // Map database success stories to structure needed
  const mappedSuccessStories = successStories.map((s) => ({
    id: s.id,
    name: s.name,
    exam: s.exam,
    quote: s.quote,
    result: s.result,
    initials: s.initials,
    gradient: s.gradient || 'from-cyan-500 to-sky-500',
  }));

  // Map database FAQs to simple key-value structure
  const mappedFaqs = faqs.map((f) => ({
    question: f.question,
    answer: f.answer,
  }));

  // Serialize department courses dates for the client component
  const serializedDepartments = departments.map((dept) => ({
    id: dept.id,
    name: dept.name,
    courses: dept.courses.map((course) => ({
      id: course.id,
      name: course.name,
      duration: course.duration,
      totalFee: course.totalFee,
      description: course.description,
      createdAt: course.createdAt.toISOString(),
    })),
  }));

  return (
    <HomeClient
      initialDepartments={serializedDepartments}
      initialNotices={serializedNotices}
      initialSiteSettings={siteSettingsMap}
      initialCabinCount={cabinCount}
      initialSuccessStories={mappedSuccessStories}
      initialFaqs={mappedFaqs}
    />
  );
}
