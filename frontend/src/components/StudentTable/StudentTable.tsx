import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '../ui/button';
import { ContactRound, Trash, FolderPlus } from 'lucide-react';
import { Input } from "@/components/ui/input";
import StudentProfilePanel from '../StudentPanel/StudentProfilePanel';
import NewEnrollmentDialog from './NewEnrollmentDialog';
import { toast } from 'sonner';
import { Student } from '@/types';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable
} from '@tanstack/react-table';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

import { useState } from 'react';

async function deleteStudent({ id }: { id: number }) {
  const response = await api.students[':id'].$delete({ param: { id: id.toString() } });

  if (!response.ok) {
    throw new Error("server error");
  }
}

interface StudentTableProps {
  students: Student[];
}

const StudentTable: React.FC<StudentTableProps> = ({ students }) => {

  // filtros de las columnas
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  // columnas definidas y adicionalmente memorizadas para evitar re-renders innecesarios (React.useMemo)
  const columns = React.useMemo<ColumnDef<Student>[]>(
    () => [
      {
        accessorKey: 'apellido_1',
        header: 'Apellido 1',
      },
      {
        accessorKey: 'apellido_2',
        header: 'Apellido 2',
      },
      {
        accessorKey: 'nombre',
        header: 'Nombre',
      },
      {
        accessorKey: 'fecha_nac',
        header: 'Fecha de Nacimiento',
        // Custom cell rendering for spanish date formatting
        cell: info => new Date(info.getValue<string>()).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        filterFn: (row, columnId, filterValue) => {
          const rowValue = row.getValue<string>(columnId); // Fecha en formato aaaa-mm-dd
          if (!rowValue) return false;

          // Convertir a dd/mm/aaaa para comparar
          const formattedRowValue = new Date(rowValue).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }); // dd/mm/aaaa
          return formattedRowValue.includes(filterValue);
        }
      },
      {
        accessorKey: 'id_legal',
        header: 'ID Legal',
      },
      {
        header: 'Acciones',
        enableColumnFilter: false,
        size: 80,
        cell: ({ row }) => (
          <>
            <StudentPanelButton id={row.original.id_estudiante} />
            <NewEnrollmentButton id={row.original.id_estudiante} />
            <StudentDeleteButton id={row.original.id_estudiante} />
          </>
        ),
      }
    ],
    []
  );

  // inicialización de la tabla
  const table = useReactTable({
    data: students,
    columns,
    filterFns: {},
    state: {
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const { rows } = table.getRowModel()

  const parentRef = React.useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
    overscan: 5,
  });

  return (
    <div className="border rounded-lg mb-4">
      {/* Encabezado de la tabla con posicionamiento sticky */}
      <Table className="w-full">
        <TableHeader className="sticky top-0 z-10 bg-gray-50">
          {table.getHeaderGroups().map(headerGroup => (
            <React.Fragment key={headerGroup.id}>
              <TableRow>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id} style={{ width: header.column.getSize() }}>
                    {!header.isPlaceholder && flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
              <TableRow>
                {/* Renderizar campos de entrada para los filtros de columna */}
                {headerGroup.headers.map(header => (
                  <TableHead className="bg-gray-50" key={`${header.id}-filter`} style={{ width: header.column.getSize() }}>
                    {header.column.getCanFilter() && (
                      <Input
                        value={(header.column.getFilterValue() as string) ?? ''}
                        onChange={e => header.column.setFilterValue(e.target.value)}
                        placeholder=". . ."
                        className="h-7 w-[calc(100%-0.5rem)] text-xs px-2 py-1 bg-white"
                      />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </React.Fragment>
          ))}
        </TableHeader>
      </Table>

      {/* Cuerpo de la tabla con scroll vertical */}
      <div ref={parentRef} className="max-h-[60vh] min-h-[60vh] overflow-auto">
        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative', width: '100%' }}>
          <Table className="w-full">
            <TableBody>
              {rowVirtualizer.getVirtualItems().map((virtualRow, index) => {
                const row = rows[virtualRow.index]
                return (
                  <TableRow
                    key={row.id}
                    className='border-none hover:bg-slate-100'
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start - index * virtualRow.size}px)`,
                    }}
                  >
                    {row.getVisibleCells().map((cell) => {
                      return (
                        <TableCell key={cell.id} style={{
                          width: cell.column.getSize(),
                        }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export default StudentTable;

function StudentDeleteButton({ id }: { id: number }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: deleteStudent,
    onError: () => {
      toast("No se pudo eliminar el estudiante con éxito.", {
        description: `ID del estudiante: ${id}`
      });
    },
    onSuccess: () => {
      toast("Estudiante eliminado con éxito.", {
        description: `ID del estudiante: ${id}`
      });

      queryClient.invalidateQueries({ queryKey: ['get-total-students'] });
    },
  })

  return (
    <Button variant={'outline'} size={'icon'} onClick={() => mutation.mutate({ id })} disabled={mutation.isPending}>
      {mutation.isPending ? "..." : (
        <Trash className='h-8 w-8 text-red-400' />
      )}
    </Button>
  );
}

function StudentPanelButton({ id }: { id: number }) {
  const [panelIsOpen, setPanelIsOpen] = useState(false);

  return (
    <>
      <Button variant={'outline'} size={'icon'} className='mr-2' onClick={() => setPanelIsOpen(true)} >
        <ContactRound className='h-6 w-6' />
      </Button>
      <StudentProfilePanel
        id={id}
        isOpen={panelIsOpen}
        onClose={() => setPanelIsOpen(false)}
      />
    </>
  )
}

function NewEnrollmentButton({ id }: { id: number }) {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);

  return (
    <>
      <Button variant={'outline'} size={'icon'} className='mr-2' onClick={() => setDialogIsOpen(true)}>
        <FolderPlus className='h-6 w-6' />
      </Button>
      <NewEnrollmentDialog
        student_id = {id}
        isOpen = {dialogIsOpen}
        onClose={() => setDialogIsOpen(false)}
      />
    </>
  )
}