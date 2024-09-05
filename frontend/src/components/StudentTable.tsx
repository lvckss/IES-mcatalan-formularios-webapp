import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserCircle } from 'lucide-react';
import { Student } from '@/interfaces';
import { Input } from "@/components/ui/input";
import FilterInput from '@/components/FilterInput';


interface StudentTableProps {
  students: Student[];
  filters: {
    apellido1: string;
    apellido2: string;
    nombre: string;
    id_legal: string;
    fecha_nacimiento: string;
    code_expediente: string;
  };
  onFilterChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const StudentTable: React.FC<StudentTableProps> = ({ students, filters, onFilterChange }) => {
  const filteredStudents = students.filter((student) =>
    student.apellido1.toLowerCase().includes(filters.apellido1.toLowerCase()) &&
    student.apellido2.toLowerCase().includes(filters.apellido2.toLowerCase()) &&
    student.nombre.toLowerCase().includes(filters.nombre.toLowerCase()) &&
    student.id_legal.toLowerCase().includes(filters.id_legal.toLowerCase()) &&
    student.fecha_nacimiento.includes(filters.fecha_nacimiento) &&
    student.code_expediente.toLowerCase().includes(filters.code_expediente.toLowerCase())
  );

  return (
    <div className='border rounded-lg mb-4'>
        <div className='relative'>
          <Table>
            <TableHeader className='bg-gray-50'>
              <TableRow>
              <TableHead className="w-[20%] py-2 px-2 text-sm font-medium rounded-tl-lg text-center">Apellido 1</TableHead>
                <TableHead className="w-[15%] py-2 px-2 text-sm font-medium text-center">Apellido 2</TableHead>
                <TableHead className="w-[10%] py-2 px-2 text-sm font-medium text-center">Nombre</TableHead>
                <TableHead className="w-[12%] py-2 px-2 text-sm font-medium text-center">Fecha de nacimiento</TableHead>
                <TableHead className="w-[10%] py-2 px-2 text-sm font-medium text-center">Enseñanza</TableHead>
                <TableHead className="w-[12%] py-2 px-2 text-sm font-medium text-center">ID legal</TableHead>
                <TableHead className="w-[15%] py-2 px-2 text-sm font-medium text-center">Código de expediente</TableHead>
                <TableHead className="w-[6%] py-2 px-2 text-sm font-medium rounded-tr-lg"></TableHead>
              </TableRow>
              <TableRow className="bg-gray-50">
                <TableCell className="py-1 px-2">
                <FilterInput
                    placeholder=". . ."
                    name="apellido1"
                    value={filters.apellido1}
                    onFilterChange={onFilterChange}
                  />
                </TableCell>
                <TableCell className="py-1 px-2">
                  <FilterInput
                    placeholder=". . ."
                    name="apellido2"
                    value={filters.apellido2}
                    onFilterChange={onFilterChange}
                  />
                </TableCell>
                <TableCell className="py-1 px-2">
                 <FilterInput
                    placeholder=". . ."
                    name="nombre"
                    value={filters.nombre}
                    onFilterChange={onFilterChange}
                  />
                </TableCell>
                <TableCell className="py-1 px-2">
                  <FilterInput
                    placeholder="Ejemplo: 2000-05-15    . . ."
                    name="fecha_nacimiento"
                    value={filters.fecha_nacimiento}
                    onFilterChange={onFilterChange}
                  />
                </TableCell>
                <TableCell className="py-1 px-2">
                  <Input placeholder="TO-DO" className="h-7 text-xs bg-background" />
                </TableCell>
                <TableCell className="py-1 px-2">
                  <FilterInput
                    placeholder=". . ."
                    name="id_legal"
                    value={filters.id_legal}
                    onFilterChange={onFilterChange}
                  />
                </TableCell>
                <TableCell className="py-1 px-2">
                  <FilterInput
                    placeholder=". . ."
                    name="code_expediente"
                    value={filters.code_expediente}
                    onFilterChange={onFilterChange}
                  />
                </TableCell>
                <TableCell className="py-1 px-2"></TableCell>
              </TableRow>
            </TableHeader>
          </Table>
          <ScrollArea className="h-[60vh]">
            <Table>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id_alumno}>
                    <TableCell className='w-[20%] py-1 px-2 text-xs'>{student.apellido1.toUpperCase()}</TableCell>
                    <TableCell className='w-[15%] py-1 px-2 text-xs'>{student.apellido2.toUpperCase()}</TableCell>
                    <TableCell className='w-[10%] py-1 px-2 text-xs'>{student.nombre}</TableCell>
                    <TableCell className='w-[12%] py-1 px-2 text-xs'>{new Date(student.fecha_nacimiento).toLocaleDateString()}</TableCell>
                    <TableCell className='w-[10%] py-1 px-2 text-xs'>{student.nombre}</TableCell>
                    <TableCell className='w-[12%] py-1 px-2 text-xs'>{student.id_legal}</TableCell>
                    <TableCell className='w-[15%] py-1 px-2 text-xs'>{student.code_expediente}</TableCell>
                    <TableCell className='w-[6%] py-1 px-2'>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className='h-5 w-5'>
                            <UserCircle className="h-5 w-5" />
                            <span className="sr-only">Ver toda la info</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Información del Estudiante</DialogTitle>
                          </DialogHeader> 
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <span className="font-bold">Apellido1:</span>
                              <span className="col-span-3">{student.apellido1}</span>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <span className="font-bold">Apellido2:</span>
                              <span className="col-span-3">{student.apellido2}</span>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <span className="font-bold">Nombre:</span>
                              <span className="col-span-3">{student.nombre}</span>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <span className="font-bold">ID Legal:</span>
                              <span className="col-span-3">{student.id_legal}</span>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <span className="font-bold">Fecha de Nacimiento:</span>
                              <span className="col-span-3">{new Date(student.fecha_nacimiento).toLocaleDateString()}</span>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <span className="font-bold">Código de Expediente:</span>
                              <span className="col-span-3">{student.code_expediente}</span>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
    </div>
  );
};

export default StudentTable;