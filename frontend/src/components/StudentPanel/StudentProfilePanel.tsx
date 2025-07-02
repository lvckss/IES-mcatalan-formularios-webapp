import React, { useState, useEffect } from "react"
import { Check, Pencil, Plus, Save, Trash, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import SelectField from "../StudentTable/SelectField"
import { api } from "@/lib/api"

import { useQuery, useQueryClient } from "@tanstack/react-query"

import { RecordExtended, FullStudentData } from "@/types"
import { record } from "zod"

// --------------------------------------------------------

async function getFullStudentData(id : number): Promise<FullStudentData> {
  const response = await api.students.fullInfo[':id'].$get({param: {id: id.toString() } });
  const data = await response.json();
  const raw = data.fullInfo;

  const student = {
    ...raw.student,
    fecha_nac: new Date(raw.student.fecha_nac)
  }

  const records = raw.records.map(r => ({
    ...r,
    fecha_pago_titulo: r.fecha_pago_titulo
      ? new Date(r.fecha_pago_titulo)
      : undefined
  }))

  return {student, records};
}

interface StudentProfilePanelProps {
  id: number;
  isOpen: boolean;
  onClose: () => void;
}

const StudentProfilePanel: React.FC<StudentProfilePanelProps> = ({ id, isOpen, onClose }) => {
  const [selectedCycle, setSelectedCycle] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [currentRecord, setCurrentRecord] = useState<RecordExtended | null>();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedCourses, setEditedCourses] = useState([])
  const [isAddingCourse, setIsAddingCourse] = useState(false)

  const queryClient = useQueryClient();

  // fullInfo API GET endpoint
  const { isPending: fullDataLoading, error: fullDataError, data: fullData } = useQuery({
    queryKey: ['full-student-data', id],
    queryFn: ({ queryKey }) => {
      // Extract the id from the queryKey array
      const [_key, studentId] = queryKey;
      return getFullStudentData(studentId as number);
    }
  });

  const seen = new Set();
  const cycleOptions = (fullData?.records?? [])
    .filter(rec => !seen.has(rec.ciclo_codigo) && seen.add(rec.ciclo_codigo))
    .map(rec => ({
      value: String(rec.ciclo_codigo),
      label: String(rec.ciclo_codigo),
      record: rec
    }))

  const handleCycleChange = (value : string) => {
    setSelectedCycle(value)
    const cicloRecords = (fullData?.records ?? [])
      .filter(rec => rec.ciclo_codigo === selectedCycle)

    console.log(cicloRecords[0])
  }
  

  const handlePeriodChange = (value : string) => {
    setSelectedPeriod(value)
    const [anoInicio, anoFin] = value.split('-').map((str : string) => parseInt(str,10))

    const encontrado = fullData?.records.find(r =>
      r.ano_inicio === anoInicio &&
      r.ano_fin === anoFin
    ) || null;

    setCurrentRecord(encontrado)
    setIsAddingCourse(false);
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open : boolean) => {
        if (!open) {
          onClose()
          setIsEditMode(false)
        }
      }}
    >
      <SheetContent className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl">
        <SheetHeader className="flex flex-row items-center justify-between pb-4">
          <SheetTitle className="text-xl font-bold">Perfil del estudiante</SheetTitle>
          <div className="flex space-x-2">
            {isEditMode ? (
              <>
                <Button variant="outline" size="sm" /* onClick={handleEditToggle} */>
                  <X className="h-4 w-4 mr-1" /> Cancelar
                </Button>
                <Button variant="default" size="sm" /* onClick={handleSaveChanges} */>
                  <Save className="h-4 w-4 mr-1" /> Save
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" className="mr-5" /* onClick={handleEditToggle} */>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)] pr-4">
          <div className="space-y-6">
            {/* Student Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información personal:</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {isEditMode ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre:</Label>
                      <Input
                        id="name"
                        value={fullData?.student.nombre || ""}
                        /* onChange={(e) => handlePersonalInfoChange("name", e.target.value)} */
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apellido1">Apellido 1:</Label>
                      <Input
                        id="apellido1"
                        value={fullData?.student.apellido_1 || ""}
                        /* onChange={(e) => handlePersonalInfoChange("name", e.target.value)} */
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apellido2">Apellido 2:</Label>
                      <Input
                        id="apellido2"
                        value={fullData?.student.apellido_2 || ""}
                        /* onChange={(e) => handlePersonalInfoChange("name", e.target.value)} */
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm font-medium text-muted-foreground">ID Legal:</div>
                      <div>{fullData?.student.id_estudiante}</div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fecha_nac">Fecha de nacimiento:</Label>
                      <Input
                        id="fecha_nac"
                        value={
                          fullData?.student.fecha_nac
                            .toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
                            || ''
                        }
                        /* onChange={(e) => handlePersonalInfoChange("email", e.target.value)} */
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm font-medium text-muted-foreground">Nombre:</div>
                    <div>{fullData?.student.nombre}</div>

                    <div className="text-sm font-medium text-muted-foreground">Apellido 1:</div>
                    <div>{fullData?.student.apellido_1}</div>
                    
                    <div className="text-sm font-medium text-muted-foreground">Apellido 2:</div>
                    <div>{fullData?.student.apellido_2}</div>

                    <div className="text-sm font-medium text-muted-foreground">ID Legal:</div>
                    <div>{fullData?.student.id_legal}</div>

                    <div className="text-sm font-medium text-muted-foreground">Fecha de nacimiento:</div>
                    <div>{
                          fullData?.student.fecha_nac
                            .toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
                            || ''
                        }</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Academic Records */}
            <Card>
              <CardHeader>
                <CardTitle>Registros académicos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Year Selection Dropdown */}
                  <div className="flex items-center space-x-4">
                    <div className="text-sm font-medium text-muted-foreground">Año académico:</div>
                      <SelectField
                        label="Periodo"
                        name="period"
                        value={selectedCycle}
                        onValueChange={handleCycleChange}
                        placeholder="Seleccionar periodo"
                        options={cycleOptions}
                      />
                  </div>

                  {/* Display selected year's cycle (degree) and courses */}
                  {selectedCycle && (
                    <div className="mt-6">
                      <div className="mb-4">
                        <div className="flex items-center mb-2">
                        </div>
                        <p className="text-sm text-muted-foreground">Año académico: {selectedPeriod}</p>
                      </div>

                      <div className="rounded-md border">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="p-2 text-left text-sm font-medium">Código</th>
                              <th className="p-2 text-left text-sm font-medium">Nombre</th>
                              <th className="p-2 text-left text-sm font-medium">Calificación</th>
                              {isEditMode && <th className="p-2 text-left text-sm font-medium w-[80px]">Actions</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {(isEditMode ? editedCourses : currentRecord?.enrollments ?? []).map((modulo) => (
                              <tr key={modulo.codigo_modulo} className="border-b last:border-0">
                                <td className="p-2 text-sm">
                                  {isEditMode ? (
                                    <Input
                                      value={modulo.codigo_modulo}
                                      /* onChange={(e) => handleCourseChange(courseIndex, "code", e.target.value)} */
                                      className="h-8 text-sm"
                                    />
                                  ) : (
                                    modulo.codigo_modulo
                                  )}
                                </td>
                                <td className="p-2 text-sm">
                                  {isEditMode ? (
                                    <Input
                                      value={modulo.nombre_modulo}
                                      /* onChange={(e) => handleCourseChange(courseIndex, "name", e.target.value)} */
                                      className="h-8 text-sm"
                                    />
                                  ) : (
                                    modulo.nombre_modulo
                                  )}
                                </td>
                                <td className="p-2 text-sm">
                                  {isEditMode ? (
                                    <Select
                                      value={modulo.nota?.toString()}
                                      /* onValueChange={(value) => handleCourseChange(courseIndex, "grade", value)} */
                                    >
                                      <SelectTrigger className="h-8 text-sm w-[120px]">
                                        <SelectValue placeholder="Select grade" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="A">A</SelectItem>
                                        <SelectItem value="A-">A-</SelectItem>
                                        <SelectItem value="B+">B+</SelectItem>
                                        <SelectItem value="B">B</SelectItem>
                                        <SelectItem value="B-">B-</SelectItem>
                                        <SelectItem value="C+">C+</SelectItem>
                                        <SelectItem value="C">C</SelectItem>
                                        <SelectItem value="C-">C-</SelectItem>
                                        <SelectItem value="D">D</SelectItem>
                                        <SelectItem value="F">F</SelectItem>
                                        <SelectItem value="In Progress">In Progress</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  ) :
                                    modulo.nota
                                  }
                                </td>
                                {isEditMode && (
                                  <td className="p-2 text-sm">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      /* onClick={() => handleDeleteCourse(courseIndex)} */
                                      className="h-8 w-8"
                                    >
                                      <Trash className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {isEditMode && !isAddingCourse && (
                        <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsAddingCourse(true)}>
                          <Plus className="h-4 w-4 mr-1" /> Add Course
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
};

export default StudentProfilePanel;
