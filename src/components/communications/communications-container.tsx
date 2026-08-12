'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NoticesView from '@/components/notices/notices-view';
import ContactView from '@/components/contacts/contact-view';
import NewsletterView from '@/components/newsletter/newsletter-view';
import SupportView from '@/components/support/support-view';

export default function CommunicationsContainer() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="notices" className="w-full">
        <TabsList className="grid w-full sm:w-[800px] grid-cols-4">
          <TabsTrigger value="notices">Notices</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="newsletter">Newsletter</TabsTrigger>
          <TabsTrigger value="support">Support Tickets</TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="notices" className="mt-0">
            <NoticesView />
          </TabsContent>
          <TabsContent value="messages" className="mt-0">
            <ContactView />
          </TabsContent>
          <TabsContent value="newsletter" className="mt-0">
            <NewsletterView />
          </TabsContent>
          <TabsContent value="support" className="mt-0">
            <SupportView />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
