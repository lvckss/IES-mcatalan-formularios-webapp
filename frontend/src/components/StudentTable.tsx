import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserCircle } from 'lucide-react';

interface Student {
  id_alumno: number;
  apellido1: string;
  apellido2: string;
  nombre: string;
  id_legal: string;
  fecha_nacimiento: string;
  code_expediente: string;
}

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
}

const StudentTable: React.FC<StudentTableProps> = ({ students, filters }) => {
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
      <ScrollArea className="h-[60vh]">
        <div className='relative'>
          <Table className='text-lg'>
            <TableHeader className='sticky top-0 bg-white drop-shadow-lg font-bold z-10'>
              <TableRow>
                <TableHead className="text-left text-black flex-grow">Apellido 1</TableHead>
                <TableHead className="text-left text-black flex-grow">Apellido 2</TableHead>
                <TableHead className="text-left text-black flex-grow">Nombre</TableHead>
                <TableHead className="text-left text-black flex-grow">ID legal</TableHead>
                <TableHead className="text-left text-black flex-grow">Fecha de Nacimiento</TableHead>
                <TableHead className="text-left text-black flex-grow">Código de Expediente</TableHead>
                <TableHead className="text-left w-[5%]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id_alumno}>
                  <TableCell className='text-left'>{student.apellido1}</TableCell>
                  <TableCell className='text-left'>{student.apellido2}</TableCell>
                  <TableCell className='text-left'>{student.nombre}</TableCell>
                  <TableCell className='text-left'>{student.id_legal}</TableCell>
                  <TableCell className='text-left'>{new Date(student.fecha_nacimiento).toLocaleDateString()}</TableCell>
                  <TableCell className='text-left'>{student.code_expediente}</TableCell>
                  <TableCell className='text-left'>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className='border'>
                          <UserCircle className="h-7 w-7" />
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
        </div>
      </ScrollArea>
    </div>
  );
};

export default StudentTable;