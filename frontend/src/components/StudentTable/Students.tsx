import React from 'react';
import StudentTable from '@/components/StudentTable/StudentTable';
import { Separator } from "@/components/ui/separator";
import AddStudentButton from './AddStudentButton';
import { Skeleton } from "@/components/ui/skeleton"

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api'


async function getStudents() {
  const response = await api.students.$get();
  const data = await response.json();
  
  const estudiantesWithDates = data.estudiantes.map((student: any) => ({
    ...student,
    fecha_nac: new Date(student.fecha_nac),
  }));
  return estudiantesWithDates;
}

const Estudiantes: React.FC = () => {
  const { isPending, error, data } = useQuery({
    queryKey: ['get-total-students'],
    queryFn: getStudents
  });

  if (error) return 'An error has occurred: ' + error.message;

  if (isPending) {
    return (
      <main className="flex-1 p-4 md:p-6">
        <div className="grid gap-6">
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Todos los Estudiantes</h2>
            </div>
            {/* Render skeleton rows in place of the table */}
            <div>
              {Array.from({ length: 17 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-full mb-2" />
              ))}
            </div>
          </div>
        </div>
        <Separator />
        <div className="flex justify-center my-8">
          <Skeleton className="h-12 w-32" />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-6">
      <div className="grid gap-6">
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Todos los Estudiantes</h2>
          </div>
          <StudentTable students={data} />
        </div>
      </div>
      <Separator />
      <div className="flex justify-center my-8">
        <AddStudentButton />
      </div>
    </main>
  );
};

export default Estudiantes;