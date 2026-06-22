import { db } from '@/lib/db';
import AboutClient from './about-client';

export default async function AboutPage() {
  // Fetch team members
  const teamMembers = await db.teamMember.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
  });

  // Fetch milestones
  const milestones = await db.aboutMilestone.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  // Fetch about-related settings
  const aboutKeys = [
    'about_story',
    'about_story_extra',
    'about_story_closing',
    'about_mission',
    'about_vision',
  ];

  const aboutSettings = await db.setting.findMany({
    where: { key: { in: aboutKeys } },
  });

  const aboutSettingsMap: Record<string, string> = {};
  aboutSettings.forEach((s) => {
    aboutSettingsMap[s.key] = s.value;
  });

  // Fetch site settings
  const siteKeyMap: Record<string, string> = {
    'business_name': 'businessName',
    'business_phone': 'businessPhone',
    'business_email': 'businessEmail',
    'business_address': 'businessAddress',
    'business_description': 'businessDescription',
  };

  const siteSettings = await db.setting.findMany({
    where: { key: { in: Object.keys(siteKeyMap) } },
  });

  const siteSettingsMap: Record<string, string> = {};
  siteSettings.forEach((s) => {
    const camelKey = siteKeyMap[s.key] || s.key;
    siteSettingsMap[camelKey] = s.value;
  });

  return (
    <AboutClient
      initialSiteSettings={siteSettingsMap}
      initialAboutSettings={aboutSettingsMap}
      initialTeamMembers={teamMembers}
      initialMilestones={milestones}
    />
  );
}
