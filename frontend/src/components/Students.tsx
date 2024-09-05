import React, { useState, useEffect } from 'react';
import StudentTable from './StudentTable';
import { Separator } from "@/components/ui/separator";
import AddStudentButton from './AddStudentButton';

interface Student {
    id_alumno: number;
    apellido1: string;
    apellido2: string;
    nombre: string;
    id_legal: string;
    fecha_nacimiento: string;
    code_expediente: string;
}

const Estudiantes: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filters, setFilters] = useState({
    apellido1: '',
    apellido2: '',
    nombre: '',
    id_legal: '',
    fecha_nacimiento: '',
    code_expediente: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('/api/alumnos');
      const data = await response.json();
      setStudents(data.alumnos);
    };

    fetchData();
  }, []);

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  return (
    <main className="flex-1 p-4 md:p-6">
      <div className="grid gap-6">
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Todos los Estudiantes</h2>
          </div>
          <StudentTable students={students} filters={filters} onFilterChange={handleFilterChange} />
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