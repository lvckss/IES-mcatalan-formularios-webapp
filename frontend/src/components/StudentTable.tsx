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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Student } from '@/interfaces';

interface StudentTableProps {
  students: Student[];
}

const StudentTable: React.FC<StudentTableProps> = ({ students }) => {
  console.log('Students Data:', students);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

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

  return (
    <ScrollArea className="max-h-[60vh] border rounded-lg mb-4">
      <Table className="w-full">
        <TableHeader className="sticky top-0 z-10 bg-gray-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <React.Fragment key={headerGroup.id}>
              <TableRow>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} style={{ width: header.column.getSize() }}>
                    {header.isPlaceholder ? null : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )
                    )}
                  </TableHead>
                ))}
              </TableRow>
              <TableRow>
                {headerGroup.headers.map((header) => (
                  <TableHead className='bg-gray-50' key={`${header.id}-filter`} style={{ width: header.column.getSize() }}>
                    {header.column.getCanFilter() ? (
                      <Input
                        value={(header.column.getFilterValue() as string) ?? ''}
                        onChange={(e) =>
                          header.column.setFilterValue(e.target.value)
                        }
                        placeholder=". . ."
                        className="h-7 w-[calc(100%-0.5rem)] text-xs px-2 py-1 m-1 bg-white"
                      />
                    ) : null}
                  </TableHead>
                ))}
              </TableRow>
            </React.Fragment>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}

export default StudentTable;