import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/ui/dropdown-menu';
import { PlusIcon, FilterIcon, ListOrderedIcon, MoveHorizontalIcon } from '@/components/icons';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('/api/alumnos'); // Asegúrate de que este endpoint esté disponible
      const data = await response.json();
      setStudents(data.alumnos);
    };

    fetchData();
  }, []);

  return (
    <main className="flex-1 p-4 md:p-6">
      <div className="grid gap-6">
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Todos los Estudiantes</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Apellido 1</TableHead>
                <TableHead>Apellido 2</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>ID legal</TableHead>
                <TableHead>Fecha de Nacimiento</TableHead>
                <TableHead>Código de Expediente</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {students.map((student) => (
                <TableRow key={student.id_alumno}>
                  <TableCell>{student.apellido1}</TableCell>
                  <TableCell>{student.apellido2}</TableCell>
                  <TableCell>{student.nombre}</TableCell>
                  <TableCell>{student.id_legal}</TableCell>
                  <TableCell>{new Date(student.fecha_nacimiento).toLocaleDateString()}</TableCell>
                  <TableCell>{student.code_expediente}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </main>
  );
};

export default Estudiantes;
