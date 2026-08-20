import { db } from '@/lib/db';
import { Redis } from '@upstash/redis';

export interface SiteSettings {
  heroBadgeText?: string;
  heroBannerText?: string;
  footerCtaTitle?: string;
  footerCtaSubtitle?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessAddress?: string;
  heroImageUrl?: string;
  businessName?: string;
  businessDescription?: string;
  logoUrl?: string;
}

export interface BatchItemSummary {
  id: string;
  batchName: string;
  startDate: string;
  endDate: string | null;
  timing: string;
  seats: number;
  totalSeats: number;
  status: string;
  description?: string | null;
}

export interface CourseItem {
  id: string;
  name: string;
  durationValue?: number | null;
  durationUnit?: string | null;
  duration: string | null;
  totalFee: number;
  description: string | null;
  status?: string;
  batches?: BatchItemSummary[];
  nextBatch?: BatchItemSummary | null;
  activeBatch?: BatchItemSummary | null;
  isOngoing?: boolean;
  hasOpenBatches?: boolean;
  departmentId?: string;
  departmentName?: string;
}

export interface Department {
  id: string;
  name: string;
  courses: CourseItem[];
}

export interface BatchData {
  id: string;
  courseId: string;
  batchName: string;
  courseName: string;
  department: string;
  departmentId: string;
  startDate: string;
  endDate: string | null;
  duration: string;
  timing: string;
  seats: number;
  totalSeats: number;
  status: string;
  fee: number;
  description?: string | null;
}

export interface SuccessStory {
  id: string;
  name: string;
  achievement: string;
  batch: string;
}

export interface FeatureCard {
  id: string;
  title: string;
  description: string;
  image: string;
  icon: string;
  linkText: string;
  linkHref: string;
}

export interface DailyQuote {
  text: string;
  author: string;
}

export interface HomepageData {
  siteSettings: SiteSettings;
  departments: Department[];
  batches: BatchData[];
  stories: SuccessStory[];
  featureCards: FeatureCard[];
  dailyQuote: DailyQuote;
}

const DEFAULT_QUOTE: DailyQuote = {
  text: "Success is no accident. It is hard work, perseverance, learning, studying, sacrifice and most of all, love of what you are doing or learning to do.",
  author: "Pelé",
};

const DEFAULT_SUCCESS_STORIES: SuccessStory[] = [
  {
    id: '1',
    name: 'Rahul Sharma',
    achievement: 'SSC CGL 2023 - Income Tax Inspector',
    batch: 'Batch of 2023',
  },
  {
    id: '2',
    name: 'Priya Patel',
    achievement: 'IBPS PO 2023 - SBI',
    batch: 'Batch of 2023',
  },
  {
    id: '3',
    name: 'Amit Kumar',
    achievement: 'UPSC EPFO 2023',
    batch: 'Batch of 2023',
  },
  {
    id: '4',
    name: 'Neha Singh',
    achievement: 'RRB NTPC 2022 - Station Master',
    batch: 'Batch of 2022',
  },
];

const SETTINGS_KEY_MAP: Record<string, keyof SiteSettings> = {
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
  'hero_image_url': 'heroImageUrl',
};

export async function getHomepageData(): Promise<HomepageData> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    settingsRows,
    featureCardRows,
    storyRows,
    deptRows,
    batchRows,
    quoteResult,
  ] = await Promise.all([
    // 1. Settings
    db.setting.findMany({
      where: { key: { in: Object.keys(SETTINGS_KEY_MAP) } },
    }).catch((err) => {
      console.error('Failed to fetch settings for homepage SSR:', err);
      return [];
    }),

    // 2. Feature Cards
    db.featureCard.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        image: true,
        icon: true,
        linkText: true,
        linkHref: true,
      },
    }).catch((err) => {
      console.error('Failed to fetch feature cards for homepage SSR:', err);
      return [];
    }),

    // 3. Success Stories
    db.successStory.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        achievement: true,
        batch: true,
      },
    }).catch((err) => {
      console.error('Failed to fetch success stories for homepage SSR:', err);
      return [];
    }),

    // 4. Courses & Departments
    db.department.findMany({
      where: { status: 'active' },
      orderBy: { name: 'asc' },
      include: {
        courses: {
          where: { status: { not: 'inactive' } },
          orderBy: { name: 'asc' },
          include: {
            batches: {
              where: {
                active: true,
                status: { not: 'closed' },
              },
              orderBy: { startDate: 'asc' },
              include: {
                _count: {
                  select: {
                    enrollments: {
                      where: { status: 'active' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }).catch((err) => {
      console.error('Failed to fetch departments/courses for homepage SSR:', err);
      return [];
    }),

    // 5. Upcoming Batches
    db.batch.findMany({
      where: {
        active: true,
        status: { in: ['enrolling', 'almost_full', 'full'] },
        startDate: { gte: startOfToday },
      },
      orderBy: [{ sortOrder: 'asc' }, { startDate: 'asc' }],
      include: {
        course: {
          include: {
            department: {
              select: { id: true, name: true },
            },
          },
        },
        _count: {
          select: {
            enrollments: {
              where: { status: 'active' },
            },
          },
        },
      },
    }).catch((err) => {
      console.error('Failed to fetch batches for homepage SSR:', err);
      return [];
    }),

    // 6. Daily Quote from Redis
    (async (): Promise<DailyQuote> => {
      try {
        if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
          const redis = Redis.fromEnv();
          const cached = await redis.get<DailyQuote | Array<DailyQuote>>('daily_inspiration');
          if (cached) {
            if (Array.isArray(cached) && cached.length > 0) return cached[0];
            if (typeof cached === 'object' && 'text' in cached && 'author' in cached) return cached;
          }
          const fallbackList = await redis.get<Array<DailyQuote>>('daily_inspirations');
          if (Array.isArray(fallbackList) && fallbackList.length > 0) return fallbackList[0];
        }
      } catch (err) {
        console.error('Error loading quote from Redis in homepage SSR:', err);
      }
      return DEFAULT_QUOTE;
    })(),
  ]);

  // Format Site Settings
  const siteSettings: SiteSettings = {};
  settingsRows.forEach((s) => {
    const prop = SETTINGS_KEY_MAP[s.key];
    if (prop) {
      siteSettings[prop] = s.value;
    }
  });

  // Format Courses & Departments
  const formattedDepartments: Department[] = deptRows
    .map((dept) => {
      const formattedCourses: CourseItem[] = dept.courses.map((course) => {
        const formattedDuration =
          course.durationValue && course.durationUnit
            ? `${course.durationValue} ${course.durationUnit}`
            : null;

        const formattedBatches: BatchItemSummary[] = course.batches.map((b) => {
          const remainingSeats = Math.max(0, b.seats - b._count.enrollments);
          let calculatedStatus = b.status;
          if (b.status === 'enrolling' && remainingSeats <= 3 && remainingSeats > 0) {
            calculatedStatus = 'almost_full';
          } else if (remainingSeats === 0) {
            calculatedStatus = 'full';
          }

          return {
            id: b.id,
            batchName: b.batchName,
            startDate: b.startDate.toISOString(),
            endDate: b.endDate ? b.endDate.toISOString() : null,
            timing: b.timing,
            seats: remainingSeats,
            totalSeats: b.seats,
            status: calculatedStatus,
            description: b.description,
          };
        });

        const upcomingBatches = formattedBatches.filter(
          (b) => new Date(b.startDate) >= startOfToday
        );

        const activeBatch = formattedBatches.find((b) => {
          const start = new Date(b.startDate);
          const end = b.endDate ? new Date(b.endDate) : null;
          return start <= now && (!end || end >= now);
        }) || null;

        return {
          id: course.id,
          name: course.name,
          departmentId: course.departmentId,
          departmentName: dept.name,
          durationValue: course.durationValue,
          durationUnit: course.durationUnit,
          duration: formattedDuration,
          totalFee: course.totalFee,
          description: course.description,
          status: course.status,
          batches: formattedBatches,
          nextBatch: upcomingBatches.length > 0 ? upcomingBatches[0] : null,
          activeBatch,
          isOngoing: activeBatch !== null,
          hasOpenBatches: upcomingBatches.length > 0,
        };
      });

      return {
        id: dept.id,
        name: dept.name,
        courses: formattedCourses,
      };
    })
    .filter((dept) => dept.courses.length > 0);

  // Format Batches
  const formattedBatches: BatchData[] = batchRows.map((b) => {
    const remainingSeats = Math.max(0, b.seats - b._count.enrollments);
    const duration =
      b.course.durationValue && b.course.durationUnit
        ? `${b.course.durationValue} ${b.course.durationUnit}`
        : 'Flexible';

    let calculatedStatus = b.status;
    if (b.status === 'enrolling' && remainingSeats <= 3 && remainingSeats > 0) {
      calculatedStatus = 'almost_full';
    } else if (remainingSeats === 0) {
      calculatedStatus = 'full';
    }

    return {
      id: b.id,
      courseId: b.courseId,
      batchName: b.batchName,
      courseName: b.course.name,
      department: b.course.department.name,
      departmentId: b.course.department.id,
      startDate: b.startDate.toISOString(),
      endDate: b.endDate ? b.endDate.toISOString() : null,
      timing: b.timing,
      seats: remainingSeats,
      totalSeats: b.seats,
      status: calculatedStatus,
      fee: b.course.totalFee,
      duration,
      description: b.description || b.course.description,
    };
  });

  return {
    siteSettings,
    departments: formattedDepartments,
    batches: formattedBatches,
    stories: storyRows.length > 0 ? storyRows : DEFAULT_SUCCESS_STORIES,
    featureCards: featureCardRows,
    dailyQuote: quoteResult,
  };
}
