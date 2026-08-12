'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CabinsView from '@/components/cabins/cabins-view';
import BookingsView from '@/components/bookings/bookings-view';

export default function FacilitiesContainer() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="cabins" className="w-full">
        <TabsList className="grid w-full sm:w-[400px] grid-cols-2">
          <TabsTrigger value="cabins">Cabins</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="cabins" className="mt-0">
            <CabinsView />
          </TabsContent>
          <TabsContent value="bookings" className="mt-0">
            <BookingsView />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
