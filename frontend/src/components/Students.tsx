import React, { useState, useEffect } from 'react';
import StudentTable from './StudentTable';
import StudentFilters from './StudentFilters';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UserRoundPlus } from 'lucide-react';

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
          <StudentTable students={students} filters={filters} />
        </div>
      </div>
      <h1 className='mb-2 font-bold'>Filtros de búsqueda:</h1>
      <StudentFilters filters={filters} onFilterChange={handleFilterChange} />
      <Separator />
      <div className="flex justify-center my-8">
        <Button variant="outline">
          <UserRoundPlus className="mr-2 h-5 w-5" />Añadir estudiante
        </Button>
      </div>
    </main>
  );
};

export default Estudiantes;