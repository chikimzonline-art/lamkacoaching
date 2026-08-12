'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StudentsView from '@/components/students/students-view';
import EnrollmentsView from '@/components/enrollments/enrollments-view';

export default function StudentsContainer() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="directory" className="w-full">
        <TabsList className="grid w-full sm:w-[400px] grid-cols-2">
          <TabsTrigger value="directory">Student Directory</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="directory" className="mt-0">
            <StudentsView />
          </TabsContent>
          <TabsContent value="enrollments" className="mt-0">
            <EnrollmentsView />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
