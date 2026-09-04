'use client';

import { useSession } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CabinsView from '@/components/cabins/cabins-view';
import BookingsView from '@/components/bookings/bookings-view';
import CabinAssetManagement from '@/components/cabins/cabin-asset-management';
import { MapPin, Settings2, History } from 'lucide-react';

export default function FacilitiesContainer() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === 'admin';

  return (
    <div className="space-y-6">
      <Tabs defaultValue="cabins" className="w-full">
        <TabsList className={isAdmin ? 'grid w-full sm:w-[650px] grid-cols-3' : 'grid w-full sm:w-[450px] grid-cols-2'}>
          <TabsTrigger value="cabins" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <MapPin className="h-3.5 w-3.5 text-cyan-600 hidden min-[400px]:inline" />
            <span>Cabin Map & Bookings</span>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="setup" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Settings2 className="h-3.5 w-3.5 text-amber-600 hidden min-[400px]:inline" />
              <span>Cabin Setup & Desks</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="bookings" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <History className="h-3.5 w-3.5 text-slate-500 hidden min-[400px]:inline" />
            <span>Booking History & Approvals</span>
          </TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="cabins" className="mt-0">
            <CabinsView />
          </TabsContent>
          {isAdmin && (
            <TabsContent value="setup" className="mt-0">
              <CabinAssetManagement />
            </TabsContent>
          )}
          <TabsContent value="bookings" className="mt-0">
            <BookingsView />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

