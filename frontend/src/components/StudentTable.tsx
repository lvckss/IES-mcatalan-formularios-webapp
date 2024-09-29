import React from 'react';
import {
  Column,
  ColumnDef,
  ColumnFiltersState,
  RowData,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from "@/components/ui/input";
import { Student } from '@/interfaces';

import { useVirtualizer } from '@tanstack/react-virtual';

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
        accessorKey: 'apellido1',
        header: 'Apellido 1',
      },
      {
        accessorKey: 'apellido2',
        header: 'Apellido 2',
      },
      {
        accessorKey: 'nombre',
        header: 'Nombre',
      },
      {
        accessorKey: 'fecha_nacimiento',
        header: 'Fecha de Nacimiento',
        // Custom cell rendering for date formatting
        cell: info => new Date(info.getValue<string>()).toLocaleDateString(),
      },
      {
        accessorKey: 'id_legal',
        header: 'ID Legal',
      },
      {
        accessorKey: 'codigo_expediente',
        header: 'Código de Expediente',
      },
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

  /* const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 5,
  }); */

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
                        className="h-7 w-[calc(100%-0.5rem)] text-xs px-2 py-1 m-1 bg-white"
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
      {/* <div ref={parentRef} className="max-h-[60vh] overflow-y-auto"> */}
        <Table className="w-full">
          <TableBody>
            {table.getRowModel().rows.map(row => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    /* </div> */
  );
}

export default StudentTable;