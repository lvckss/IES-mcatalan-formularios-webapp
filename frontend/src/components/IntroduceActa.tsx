import React, { useState, useCallback, useEffect } from 'react';
import { useForm, useFieldArray } from "react-hook-form"

import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import SelectField from "@/components/StudentTable/SelectField";

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { Plus, Save, RefreshCw } from "lucide-react"

// Fetch ciclos sin diferenciar curso POR LEY (LOE, LOGSE o LFP)
async function getCiclosByLey(ley: string) {
  const response = await api.cycles.law[':ley'].$get({
    param: { ley }
  })

  if (!response) {
    throw new Error("no existen ciclos con esa ley");
  }

  const data = await response.json();
  return data.ciclo;
}

const generateSchoolYearOptions = (): { value: string; label: string }[] => {
  const currentYear = new Date().getFullYear(); // Año actual (2025 en este caso)
  const startYear = 2014; // Año de inicio
  const options: { value: string; label: string }[] = [];

  for (let year = currentYear; year >= startYear; year--) {
    const schoolYear = `${year}-${year + 1}`;
    options.push({
      value: schoolYear, // Ejemplo: "2024-2025"
      label: schoolYear, // Ejemplo: "2024-2025"
    });
  }

  return options;
};

// schemas tabla
const actaNotaSchema = z
  .number()
  .min(0, "La nota debe ser mayor o igual a 0")
  .max(10, "La nota debe ser menor o igual a 10")

const actaEstudianteSchema = z.object({
  apellido1: z.string().max(100),
  apellido2: z.string().max(100),
  nombre: z.string().max(100),
  notas: z.array(actaNotaSchema),
  nota_final: z.number().optional(),
})

const tablaSchema = z.object({
  students: z.array(actaEstudianteSchema),
  numSubjects: z.number().min(1, "Debe haber al menos 1 asignatura"),
})

type tablaForm = z.infer<typeof tablaSchema>

const IntroduceActa: React.FC = () => {
  const [selectedLey, setSelectedLey] = useState<string>("");
  const [selectedCiclo, setSelectedCiclo] = useState<string>("");
  const [selectedCurso, setSelectedCurso] = useState<string>("");
  const [selectedAnioEscolar, setSelectedAnioEscolar] = useState<string>("");
  const [numEstudiantes, setNumEstudiantes] = useState<number>(0);
  const [numAsignaturas, setNumAsignaturas] = useState<number>(0);

  const {
    isPending: ciclosLoading,
    error: ciclosError,
    data: ciclosData = []
  } = useQuery({
    queryKey: ['ciclos-by-ley', selectedLey],
    queryFn: () => getCiclosByLey(selectedLey),
    enabled: !!selectedLey,
    staleTime: 5 * 60 * 1000, // Cacheamos los ciclos cada 5 minutos para evitar overloadear la API
  });

  // definimos el formulario
  const form = useForm<tablaForm>({
    resolver: zodResolver(tablaSchema),
    defaultValues: {
      students: [],
      numSubjects: 5,
    },
  })
  // métodos del formulario
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "students",
  })

  // Función para calcular la media de un estudiante
  const calculateAverage = useCallback((grades: number[]) => {
    const validGrades = grades.filter((grade) => !isNaN(grade) && grade !== null)
    if (validGrades.length === 0) return 0
    return Number((validGrades.reduce((sum, grade) => sum + grade, 0) / validGrades.length).toFixed(2))
  }, [])

  // Generar o actualizar la tabla
  const generateTable = useCallback(() => {
    const currentStudents = form.getValues("students")
    const newStudents = []

    // Mantener estudiantes existentes y ajustar sus notas
    for (let i = 0; i < numEstudiantes; i++) {
      const existingStudent = currentStudents[i]
      const newGrades = Array(numAsignaturas)
        .fill(0)
        .map((_, gradeIndex) => {
          return existingStudent?.notas[gradeIndex] || 0
        })

      newStudents.push({
        apellido1: existingStudent?.apellido1 || "",
        apellido2: existingStudent?.apellido2 || "",
        nombre: existingStudent?.nombre || "",
        notas: newGrades,
        nota_final: calculateAverage(newGrades),
      })
    }

    form.setValue("students", newStudents)
    form.setValue("numSubjects", numAsignaturas)
  }, [numEstudiantes, numAsignaturas, form, calculateAverage])

  // Actualizar medias cuando cambien las notas
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name?.includes("grades")) {
        const students = form.getValues("students")
        students.forEach((student, index) => {
          const average = calculateAverage(student.notas)
          form.setValue(`students.${index}.nota_final`, average)
        })
      }
    })
    return () => subscription.unsubscribe()
  }, [form, calculateAverage])

  const addStudent = () => {
    append({
      apellido1: "",
      apellido2: "",
      nombre: "",
      notas: Array(numAsignaturas).fill(0),
      nota_final: 0,
    })
    setNumEstudiantes((prev) => prev + 1)
  }

  return (
    <div>
      <div className='mt-5 ml-5'>
        <div>
          <div>
            <SelectField
              label="Ley Educativa"
              name="ley_educativa"
              value={selectedLey}
              onValueChange={(value) => setSelectedLey(value)}
              placeholder="Seleccionar ley"
              options={[
                { label: "LOGSE", value: "LOGSE" },
                { label: "LOE", value: "LOE" },
                { label: "LFP", value: "LFP" },
              ]}
              width={310}
            />
          </div>
          <div className='mt-1'>
            <SelectField
              label="Ciclo Formativo"
              name="ciclo_formativo"
              value={selectedCiclo ? `${selectedCiclo}` : ""}
              onValueChange={(value) => setSelectedCiclo(value)}
              placeholder="Seleccionar ciclo"
              options={(ciclosData ?? []).map((ciclo) => ({
                value: `${ciclo.codigo}`,
                label: `${ciclo.nombre} (${ciclo.codigo})`,
              }))}
              width={1000}
            />
          </div>
          <div className='mt-1'>
            <SelectField
              label="Año escolar"
              name="anio_escolar"
              value={selectedAnioEscolar ? `${selectedAnioEscolar}` : ""}
              onValueChange={(value) => setSelectedAnioEscolar(value)}
              placeholder="Año escolar"
              options={generateSchoolYearOptions()}
              width={1000}
            />
          </div>
          <div className='mt-1'>
            <SelectField
              label="Curso"
              name="curso"
              value={selectedCurso ? `${selectedCurso}` : ""}
              onValueChange={(value) => setSelectedCurso(value)}
              placeholder="Curso"
              options={[{ value: '1', label: '1°' }, { value: '2', label: '2°' },]}
              width={1000}
            />
          </div>
        </div>
      </div>
      <div className='mt-2 ml-5 mr-5'>
        <Card>
          <CardHeader>
            <CardTitle>Evaluación de Estudiantes</CardTitle>
            <CardDescription>Introduce manualmente los datos de evaluación de los alumnos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Controles de configuración */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="numEstudiantes">Número de estudiantes</Label>
                <Input
                  id="numEstudiantes"
                  type="number"
                  min="1"
                  max="50"
                  value={numEstudiantes}
                  onChange={(e) => setNumEstudiantes(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numSubjects">Número de asignaturas</Label>
                <Input
                  id="numSubjects"
                  type="number"
                  min="1"
                  max="20"
                  value={numAsignaturas}
                  onChange={(e) => setNumAsignaturas(Number(e.target.value))}
                />
              </div>
              <Button onClick={generateTable} variant="outline" className="w-full bg-transparent">
                <RefreshCw className="w-4 h-4 mr-2" />
                Generar/Actualizar Tabla
              </Button>
            </div>

            {/* Formulario con tabla */}
            <form /* onSubmit={form.handleSubmit(onSubmit)} */ className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead className="min-w-[100px]">Apellido 1</TableHead>
                      <TableHead className="min-w-[100px]">Apellido 2</TableHead>
                      <TableHead className="min-w-[100px]">Nombre</TableHead>
                      {Array.from({ length: numAsignaturas }, (_, i) => (
                        <TableHead key={i} className="w-24">
                          Asig. {i + 1}
                        </TableHead>
                      ))}
                      <TableHead className="w-24 text-center bg-muted">Media</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, studentIndex) => (
                      <TableRow key={field.id}>
                        <TableCell className="font-medium text-center">{studentIndex + 1}</TableCell>
                        <TableCell>
                          <Input
                            {...form.register(`students.${studentIndex}.apellido1`)}
                            placeholder="..."
                            data-row={studentIndex}
                            data-col="0"
                            className={form.formState.errors.students?.[studentIndex]?.apellido1 ? "border-red-500" : ""}
                          />
                          {form.formState.errors.students?.[studentIndex]?.apellido1 && (
                            <p className="text-sm text-red-500 mt-1">
                              {form.formState.errors.students[studentIndex]?.apellido1?.message}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            {...form.register(`students.${studentIndex}.apellido2`)}
                            placeholder="..."
                            data-row={studentIndex}
                            data-col="1"
                            className={form.formState.errors.students?.[studentIndex]?.apellido2 ? "border-red-500" : ""}
                          />
                          {form.formState.errors.students?.[studentIndex]?.apellido2 && (
                            <p className="text-sm text-red-500 mt-1">
                              {form.formState.errors.students[studentIndex]?.apellido2?.message}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            {...form.register(`students.${studentIndex}.nombre`)}
                            placeholder="..."
                            data-row={studentIndex}
                            data-col="2"
                            className={form.formState.errors.students?.[studentIndex]?.nombre ? "border-red-500" : ""}
                          />
                          {form.formState.errors.students?.[studentIndex]?.nombre && (
                            <p className="text-sm text-red-500 mt-1">
                              {form.formState.errors.students[studentIndex]?.nombre?.message}
                            </p>
                          )}
                        </TableCell>
                        {Array.from({ length: numAsignaturas }, (_, gradeIndex) => (
                          <TableCell key={gradeIndex}>
                            <Input
                              {...form.register(`students.${studentIndex}.notas.${gradeIndex}`, {
                                valueAsNumber: true,
                              })}
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              placeholder="0.0"
                              data-row={studentIndex}
                              data-col={gradeIndex + 1}
                              className={
                                form.formState.errors.students?.[studentIndex]?.notas?.[gradeIndex]
                                  ? "border-red-500 text-center"
                                  : "text-center"
                              }
                            />
                            {form.formState.errors.students?.[studentIndex]?.notas?.[gradeIndex] && (
                              <p className="text-xs text-red-500 mt-1">0-10</p>
                            )}
                          </TableCell>
                        ))}
                        <TableCell className="bg-muted">
                          <div className="text-center font-medium">
                            {form.watch(`students.${studentIndex}.nota_final`)?.toFixed(2) || "0.00"}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Acciones */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <Button type="button" variant="outline" onClick={addStudent} className="w-full sm:w-auto bg-transparent">
                  <Plus className="w-4 h-4 mr-2" />
                  Añadir Estudiante
                </Button>

                <Button type="submit" /* disabled={isLoading} */ className="w-full sm:w-auto">
                  {/* {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Evaluación
                    </>
                  )} */}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IntroduceActa;
