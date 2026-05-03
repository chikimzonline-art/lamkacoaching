'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap,
  TrendingUp,
  Award,
  Clock,
  Trophy,
  Users,
  BookOpen,
  Target,
} from 'lucide-react';
import AnimatedCounter from '@/components/public/animated-counter';

// Icon mapping from iconName string to component
const iconMap: Record<string, React.ReactNode> = {
  GraduationCap: <GraduationCap className="h-7 w-7" />,
  TrendingUp: <TrendingUp className="h-7 w-7" />,
  Award: <Award className="h-7 w-7" />,
  Clock: <Clock className="h-7 w-7" />,
  Users: <Users className="h-7 w-7" />,
  BookOpen: <BookOpen className="h-7 w-7" />,
  Target: <Target className="h-7 w-7" />,
};

// Fallback data when API is unavailable
const fallbackStats = [
  { label: 'Students Trained', value: 500, suffix: '+', iconName: 'GraduationCap', iconBg: 'bg-cyan-500/20', iconColor: 'text-cyan-400', numberColor: 'text-cyan-400' },
  { label: 'Success Rate', value: 90, suffix: '%+', iconName: 'TrendingUp', iconBg: 'bg-green-500/20', iconColor: 'text-green-400', numberColor: 'text-green-400' },
  { label: 'Govt Jobs Secured', value: 150, suffix: '+', iconName: 'Award', iconBg: 'bg-blue-500/20', iconColor: 'text-blue-400', numberColor: 'text-blue-400' },
  { label: 'Years of Excellence', value: 7, suffix: '+', iconName: 'Clock', iconBg: 'bg-purple-500/20', iconColor: 'text-purple-400', numberColor: 'text-purple-400' },
];

const fallbackAchievements = [
  { badge: 'Latest Result', badgeColor: 'bg-green-500/10 text-green-400 border-green-500/20', title: 'SSC CGL 2024', description: '12 students selected in SSC CGL 2024 from our coaching program. Highest score: 178/200 in Tier-I.', barColor: 'from-green-500 to-emerald-400' },
  { badge: 'Certification', badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', title: 'NIELIT CCC', description: '100% pass rate in NIELIT CCC exam. Average score: 82%. Our students consistently outperform national averages.', barColor: 'from-cyan-500 to-sky-400' },
  { badge: 'Banking', badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20', title: 'Banking Exams 2024', description: '8 students cleared IBPS PO and SBI Clerk exams. Combined success rate: 85% for dedicated students.', barColor: 'from-blue-500 to-indigo-400' },
];

interface ImpactStat {
  id: string;
  label: string;
  value: number;
  suffix: string;
  iconName: string;
  iconBg: string;
  iconColor: string;
  numberColor: string;
  sortOrder: number;
  active: boolean;
}

interface AchievementCard {
  id: string;
  badge: string;
  badgeColor: string;
  title: string;
  description: string;
  barColor: string;
  sortOrder: number;
  active: boolean;
}

export default function AchievementsSection() {
  const [stats, setStats] = useState<ImpactStat[] | typeof fallbackStats>(fallbackStats);
  const [achievements, setAchievements] = useState<AchievementCard[] | typeof fallbackAchievements>(fallbackAchievements);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/homepage')
      .then((r) => r.json())
      .then((data) => {
        if (data.impactStats && data.impactStats.length > 0) {
          setStats(data.impactStats);
        }
        if (data.achievementCards && data.achievementCards.length > 0) {
          setAchievements(data.achievementCards);
        }
      })
      .catch(() => {
        // Keep fallback data on error
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-20 sm:py-28 bg-gray-950 dark:bg-gray-900 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 25% 40%, rgba(6,182,212,0.07) 0%, transparent 50%), radial-gradient(circle at 75% 60%, rgba(6,182,212,0.05) 0%, transparent 40%)' }} />
      <div className="absolute inset-0 dot-grid-bg pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <Badge className="mb-3 bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
            <Trophy className="h-3 w-3 mr-1" /> Our Impact
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Results That Speak for Themselves
          </h2>
          <p className="mt-3 text-gray-400 max-w-xl mx-auto text-lg">
            Our students consistently achieve outstanding results in competitive exams and professional certifications.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-14">
          {stats.map((stat) => {
            const icon = (iconMap[stat.iconName] || <GraduationCap className="h-7 w-7" />);
            return (
              <div
                key={stat.id || stat.label}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className={`inline-flex items-center justify-center h-14 w-14 rounded-2xl ${stat.iconBg} ${stat.iconColor} mb-4`}>
                  {icon}
                </div>
                <div className={`text-3xl sm:text-4xl font-extrabold ${stat.numberColor} mb-1`}>
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} duration={2000} />
                </div>
                <p className="text-gray-400 text-sm font-medium">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Achievement Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {achievements.map((achievement) => (
            <div
              key={achievement.id || achievement.title}
              className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
            >
              {/* Badge */}
              <Badge className={`mb-4 ${achievement.badgeColor}`}>
                {achievement.badge}
              </Badge>

              {/* Title */}
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                {achievement.title}
              </h3>

              {/* Description */}
              <p className="text-gray-400 text-sm leading-relaxed mb-5">
                {achievement.description}
              </p>

              {/* Decorative progress bar */}
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full w-3/4 bg-gradient-to-r ${achievement.barColor} rounded-full transition-all duration-500 group-hover:w-full`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
