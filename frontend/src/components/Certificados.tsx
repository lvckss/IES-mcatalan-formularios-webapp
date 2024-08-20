import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PlusIcon, MoveHorizontalIcon, SettingsIcon } from '@/components/icons';

const Certificados: React.FC = () => {
  return (
    <div className="flex flex-1 flex-col">
      <main className="flex-1 p-4 md:p-6">
        <div className="grid gap-6">
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Todos los Certificados</h2>
              <Button size="sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                Crear Certificado
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Certificado</TableHead>
                  <TableHead>Emitido a</TableHead>
                  <TableHead>Emitido por</TableHead>
                  <TableHead>Fecha de Emisión</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">Licenciatura en Ciencias</div>
                    <div className="text-sm text-muted-foreground">Ciencias de la Computación</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">John Doe</div>
                    <div className="text-sm text-muted-foreground">ID de Estudiante: 12345</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">Dra. Jane Smith</div>
                    <div className="text-sm text-muted-foreground">ID de Facultad: 54321</div>
                  </TableCell>
                  <TableCell>2023-05-15</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Emitido</Badge>
                  </TableCell>
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
                        <DropdownMenuItem>Revocar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">Maestría en Artes</div>
                    <div className="text-sm text-muted-foreground">Literatura Inglesa</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">Jane Doe</div>
                    <div className="text-sm text-muted-foreground">ID de Estudiante: 67890</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">Dr. John Smith</div>
                    <div className="text-sm text-muted-foreground">ID de Facultad: 09876</div>
                  </TableCell>
                  <TableCell>2023-06-01</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Emitido</Badge>
                  </TableCell>
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
                        <DropdownMenuItem>Revocar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">Diploma en Bellas Artes</div>
                    <div className="text-sm text-muted-foreground">Pintura</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">Bob Johnson</div>
                    <div className="text-sm text-muted-foreground">ID de Estudiante: 24680</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">Dra. Sarah Lee</div>
                    <div className="text-sm text-muted-foreground">ID de Facultad: 13579</div>
                  </TableCell>
                  <TableCell>2023-07-01</TableCell>
                  <TableCell>
                    <Badge variant="outline">Pendiente</Badge>
                  </TableCell>
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
                        <DropdownMenuItem>Revocar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Panel de Administración</h2>
              <Button size="sm">
                <SettingsIcon className="h-4 w-4 mr-2" />
                Configuración
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Total de Certificados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">1,234</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Certificados Emitidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">987</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Certificados Pendientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">247</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Certificados Revocados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">32</div>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Emisiones Recientes</h2>
                <a href="#" className="text-sm text-primary">
                  Ver todo
                </a>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Certificado</TableHead>
                    <TableHead>Emitido a</TableHead>
                    <TableHead>Emitido por</TableHead>
                    <TableHead>Fecha de Emisión</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <div className="font-medium">Licenciatura en Ciencias</div>
                      <div className="text-sm text-muted-foreground">Ciencias de la Computación</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">John Doe</div>
                      <div className="text-sm text-muted-foreground">ID de Estudiante: 12345</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">Dra. Jane Smith</div>
                      <div className="text-sm text-muted-foreground">ID de Facultad: 54321</div>
                    </TableCell>
                    <TableCell>2023-05-15</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Emitido</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <div className="font-medium">Maestría en Artes</div>
                      <div className="text-sm text-muted-foreground">Literatura Inglesa</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">Jane Doe</div>
                      <div className="text-sm text-muted-foreground">ID de Estudiante: 67890</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">Dr. John Smith</div>
                      <div className="text-sm text-muted-foreground">ID de Facultad: 09876</div>
                    </TableCell>
                    <TableCell>2023-06-01</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Emitido</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <div className="font-medium">Diploma en Bellas Artes</div>
                      <div className="text-sm text-muted-foreground">Pintura</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">Bob Johnson</div>
                      <div className="text-sm text-muted-foreground">ID de Estudiante: 24680</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">Dra. Sarah Lee</div>
                      <div className="text-sm text-muted-foreground">ID de Facultad: 13579</div>
                    </TableCell>
                    <TableCell>2023-07-01</TableCell>
                    <TableCell>
                      <Badge variant="outline">Pendiente</Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Certificados;
