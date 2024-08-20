import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/ui/dropdown-menu';
import { PlusIcon, FilterIcon, ListOrderedIcon, MoveHorizontalIcon } from '@/components/icons';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const Estudiantes: React.FC = () => {
  return (
    <main className="flex-1 p-4 md:p-6">
      <div className="grid gap-6">
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Todos los Estudiantes</h2>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FilterIcon className="h-4 w-4 mr-2" />
                    Filtrar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem>Ciencias de la Computación</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem>Literatura Inglesa</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem>Bellas Artes</DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem>Inscritos antes de 2022</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem>Inscritos en 2022 o después</DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ListOrderedIcon className="h-4 w-4 mr-2" />
                    Ordenar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value="name">
                    <DropdownMenuRadioItem value="name">Nombre</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="id">ID de Estudiante</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="enrolled">Fecha de Inscripción</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button size="sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                Agregar Estudiante
              </Button>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>ID de Estudiante</TableHead>
                <TableHead>Correo Electrónico</TableHead>
                <TableHead>Inscrito</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <div className="font-medium">John Doe</div>
                  <div className="text-sm text-muted-foreground">Ciencias de la Computación</div>
                </TableCell>
                <TableCell>12345</TableCell>
                <TableCell>john.doe@example.com</TableCell>
                <TableCell>2021-09-01</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoveHorizontalIcon className="h-4 w-4" />
                        <span className="sr-only">Más acciones</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Ver</DropdownMenuItem>
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem>Desinscribir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <div className="font-medium">Jane Doe</div>
                  <div className="text-sm text-muted-foreground">Literatura Inglesa</div>
                </TableCell>
                <TableCell>67890</TableCell>
                <TableCell>jane.doe@example.com</TableCell>
                <TableCell>2022-01-15</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoveHorizontalIcon className="h-4 w-4" />
                        <span className="sr-only">Más acciones</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Ver</DropdownMenuItem>
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem>Desinscribir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <div className="font-medium">Bob Johnson</div>
                  <div className="text-sm text-muted-foreground">Bellas Artes</div>
                </TableCell>
                <TableCell>24680</TableCell>
                <TableCell>bob.johnson@example.com</TableCell>
                <TableCell>2023-02-01</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoveHorizontalIcon className="h-4 w-4" />
                        <span className="sr-only">Más acciones</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Ver</DropdownMenuItem>
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem>Desinscribir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <Separator className="my-4" />
        <div className="grid gap-4 mt-8">
          <form className="grid grid-cols-[1fr_auto] gap-4 items-center">
            <div className="grid gap-2">
              <Label htmlFor="query">Consulta SQL</Label>
              <Textarea id="query" placeholder="Ingrese su consulta SQL aquí..." className="min-h-[100px]" />
            </div>
            <Button type="submit">Ejecutar Consulta</Button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default Estudiantes;
