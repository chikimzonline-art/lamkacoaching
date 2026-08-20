import { getHomepageData } from '@/lib/homepage-data';
import HomePageClient from '@/components/homepage/homepage-client';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const data = await getHomepageData();

  return <HomePageClient data={data} />;
}
