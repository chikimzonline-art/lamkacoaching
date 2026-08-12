'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HomepageView from '@/components/homepage/homepage-view';
import AboutView from '@/components/about/about-view';
import FaqView from '@/components/faqs/faq-view';

export default function WebsiteContainer() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="homepage" className="w-full">
        <TabsList className="grid w-full sm:w-[600px] grid-cols-3">
          <TabsTrigger value="homepage">Homepage</TabsTrigger>
          <TabsTrigger value="about">About Page</TabsTrigger>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="homepage" className="mt-0">
            <HomepageView />
          </TabsContent>
          <TabsContent value="about" className="mt-0">
            <AboutView />
          </TabsContent>
          <TabsContent value="faqs" className="mt-0">
            <FaqView />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
