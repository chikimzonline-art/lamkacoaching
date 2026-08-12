'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DepartmentsView from '@/components/departments/departments-view';
import CoursesView from '@/components/courses/courses-view';
import BatchesView from '@/components/batches/batch-view';

export default function AcademicsContainer() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="departments" className="w-full">
        <TabsList className="grid w-full sm:w-[600px] grid-cols-3">
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="batches">Batches</TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="departments" className="mt-0">
            <DepartmentsView />
          </TabsContent>
          <TabsContent value="courses" className="mt-0">
            <CoursesView />
          </TabsContent>
          <TabsContent value="batches" className="mt-0">
            <BatchesView />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
