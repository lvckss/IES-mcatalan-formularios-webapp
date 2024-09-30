import React from 'react';
import StudentTable from './StudentTable';
import { Separator } from "@/components/ui/separator";
import AddStudentButton from './AddStudentButton';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api'

async function getTotalStudents() {
  const result = await api.students.$get();
  if (!result.ok) {
    throw new Error('Error fetching students');
  }
  const data = await result.json();
  return data.students;
}

const Estudiantes: React.FC = () => {
  const { isPending, error, data } = useQuery({
    queryKey: ['get-total-students'],
    queryFn: getTotalStudents
  });

  if (isPending) return 'Loading...';
  if (error) return 'An error has occurred: ' + error.message;

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