// ==================== IMPORTS ====================
import React, { useState, useCallback, useEffect } from 'react';
import { useForm, useFieldArray } from "react-hook-form";

import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import SelectField from "@/components/StudentTable/SelectField";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Plus, Save, RefreshCw } from "lucide-react";

// ==================== API HELPERS ====================
// FETCH CICLOS SIN DIFERENCIAR CURSO POR LEY (LOGSE, LOE, LFP)
async function getCiclosByLey(ley: string) {
  const response = await api.cycles.law[':ley'].$get({
    param: { ley }
  });

  if (!response) {
    throw new Error("No existen ciclos con esa ley");
  }

  const data = await response.json();
  return data.ciclo;
}

// FETCH MÓDULOS POR CÓDIGO DE CICLO Y CURSO
async function getModulosByCicloAndCurso(cod_ciclo: string, curso: string) {
  const response = await api.modules.cycle[':cycle_code'].curso[':curso'].$get({
    param: { cycle_code: cod_ciclo, curso: curso }
  });

  if (!response) {
    throw new Error(`No existen móduclos para el ciclo ${cod_ciclo} en el curso ${curso}`);
  }

  const data = await response.json();
  return data.modulos;
}

// ==================== UTILS ====================
// GENERA LAS OPCIONES DE AÑO ESCOLAR (EJ: 2024-2025)
const generateSchoolYearOptions = (): { value: string; label: string }[] => {
  const currentYear = new Date().getFullYear(); // AÑO ACTUAL
  const startYear = 2014; // AÑO DE INICIO
  const options: { value: string; label: string }[] = [];

  for (let year = currentYear; year >= startYear; year--) {
    const schoolYear = `${year}-${year + 1}`;
    options.push({
      value: schoolYear,
      label: schoolYear,
    });
  }

  return options;
};

// ==================== VALIDATION SCHEMAS (ZOD) ====================
const actaNotaSchema = z
  .number()
  .min(0, "La nota debe ser mayor o igual a 0")
  .max(10, "La nota debe ser menor o igual a 10");

const actaEstudianteSchema = z.object({
  apellido1: z.string().max(100),
  apellido2: z.string().max(100),
  nombre: z.string().max(100),
  notas: z.array(actaNotaSchema),
  nota_final: z.number().optional(),
});

const tablaSchema = z.object({
  students: z.array(actaEstudianteSchema),
  numSubjects: z.number().min(1, "Debe haber al menos 1 asignatura"),
});

type tablaForm = z.infer<typeof tablaSchema>;

// ==================== COMPONENTE PRINCIPAL ====================
const IntroduceActa: React.FC = () => {
  // ---------- STATE HOOKS ----------
  const [selectedLey, setSelectedLey] = useState<string>("");
  const [selectedCiclo, setSelectedCiclo] = useState<string>("");
  const [selectedCurso, setSelectedCurso] = useState<string>("");
  const [selectedAnioEscolar, setSelectedAnioEscolar] = useState<string>("");
  const [numEstudiantes, setNumEstudiantes] = useState<number | ''>(0);
  const [numAsignaturas, setNumAsignaturas] = useState<number | ''>('');
  const [selectedModuleCodes, setSelectedModuleCodes] = useState<string[]>([]);

  // ---------- REACT-QUERY: OBTENER CICLOS ----------
  const {
    data: ciclosData = [],
  } = useQuery({
    queryKey: ['ciclos-by-ley', selectedLey],
    queryFn: () => getCiclosByLey(selectedLey),
    enabled: !!selectedLey,
    staleTime: 5 * 60 * 1000, // CACHE DE 5 MINUTOS
  });

  // ---------- REACT-QUERY: OBTENER MÓDULOS ----------
  const {
    data: modulesData = [],
  } = useQuery({
    queryKey: ['modules-by-cycle-curso', selectedCiclo, selectedCurso],
    queryFn: () => getModulosByCicloAndCurso(selectedCiclo, selectedCurso),
    enabled: !!selectedCurso && !!selectedCiclo,
    staleTime: 5 * 60 * 1000,
  });

  // ---------- EFFECTS: SINCRONIZAR DATOS DE MÓDULOS Y ASIGNATURAS ----------
  // 1️⃣ Cuando llega modulesData ⇒ selecciona por defecto
  useEffect(() => {
    if (modulesData && modulesData.length) {
      setNumAsignaturas(modulesData.length);          // mismo nº de columnas que módulos
      setSelectedModuleCodes(modulesData.map(m => m.codigo_modulo)); // autoselección inicial
    }
  }, [modulesData]);

  // 2️⃣ Cuando el usuario cambie el nº de asignaturas ⇒ NO autoselecciones nada nuevo
  useEffect(() => {
    const n = typeof numAsignaturas === "number" ? numAsignaturas : 0;

    setSelectedModuleCodes(prev => {
      // Si añadió columnas → rellena las nuevas con ""
      if (n > prev.length) {
        return [...prev, ...Array(n - prev.length).fill("")];
      }
      // Si quitó columnas → recorta el array
      return prev.slice(0, n);
    });
  }, [numAsignaturas]);

  // ---------- FORM CONFIG (REACT-HOOK-FORM) ----------
  const form = useForm<tablaForm>({
    resolver: zodResolver(tablaSchema),
    defaultValues: {
      students: [],
      numSubjects: 5,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "students",
  });

  // ---------- UTILIDADES ----------
  const nAsign = typeof numAsignaturas === "number" ? numAsignaturas : 0;
  // CALCULA LA MEDIA DE UN ESTUDIANTE
  const calculateAverage = useCallback((grades: number[]) => {
    const validGrades = grades.filter((grade) => !isNaN(grade) && grade !== null);
    if (validGrades.length === 0) return 0;
    return Number((validGrades.reduce((sum, grade) => sum + grade, 0) / validGrades.length).toFixed(2));
  }, []);

  // GENERAR O ACTUALIZAR LA TABLA
  const generateTable = useCallback(() => {
    const currentStudents = form.getValues("students");
    const newStudents: any[] = [];

    const nEstud = typeof numEstudiantes === 'number' ? numEstudiantes : 0;

    for (let i = 0; i < nEstud; i++) {
      const existingStudent = currentStudents[i];
      const newGrades = Array(modulesData.length).fill(0).map((_, gradeIndex) => {
        return existingStudent?.notas[gradeIndex] || 0;
      });

      newStudents.push({
        apellido1: existingStudent?.apellido1 || "",
        apellido2: existingStudent?.apellido2 || "",
        nombre: existingStudent?.nombre || "",
        notas: newGrades,
        nota_final: calculateAverage(newGrades),
      });
    }

    form.setValue("students", newStudents);
    form.setValue("numSubjects", modulesData.length);
  }, [numEstudiantes, modulesData, form, calculateAverage]);

  // ACTUALIZAR SELECCIÓN DE MÓDULOS CUANDO CAMBIA numAsignaturas
  useEffect(() => {
    const nAsign = typeof numAsignaturas === 'number' ? numAsignaturas : 0;

    if (modulesData && nAsign > 0) {
      setSelectedModuleCodes(prev => {
        const nuevo = [...prev];
        while (nuevo.length < nAsign) nuevo.push('');
        return nuevo.slice(0, nAsign);
      });
    }
  }, [modulesData, numAsignaturas]);

  // ---------- HANDLERS ----------
  const addStudent = () => {
    append({
      apellido1: "",
      apellido2: "",
      nombre: "",
      notas: Array(modulesData.length).fill(0),
      nota_final: 0,
    });
    setNumEstudiantes(prev => {
      const n = typeof prev === "number" ? prev : 0;  // narrow
      return n + 1;
    });
  };

  const handleNumEstudiantesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setNumEstudiantes(value === '' ? '' : Number(value));
  };

  // ==================== RENDER ====================
  return (
    <div>
      {/* FILTROS DE CABECERA (LEY, CICLO, CURSO, AÑO) */}
      <div className='mt-5 ml-5'>
        {/* FILTRO DE CICLO, CURSO Y AÑO */}
        <div>
          {/* LEY EDUCATIVA */}
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
          {/* CICLO FORMATIVO */}
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
          {/* CURSO (1º / 2º) */}
          <div className='mt-1'>
            <SelectField
              label="Curso"
              name="curso"
              value={selectedCurso ? `${selectedCurso}` : ""}
              onValueChange={(value) => setSelectedCurso(value)}
              placeholder="Curso"
              options={[{ value: '1', label: '1°' }, { value: '2', label: '2°' }]}
              width={1000}
            />
          </div>
          {/* AÑO ESCOLAR */}
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
        </div>
      </div>

      {/* TARJETA PRINCIPAL CON LA TABLA Y CONTROLES */}
      <div className='mt-2 ml-5 mr-5'>
        <Card>
          <CardHeader>
            <CardTitle>Evaluación de Estudiantes</CardTitle>
            <CardDescription>Introduce manualmente los datos de evaluación de los alumnos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* CONTROLES DE CONFIGURACIÓN DE LA TABLA */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              {/* NÚMERO DE ESTUDIANTES */}
              <div className="space-y-2">
                <Label htmlFor="numEstudiantes">Número de estudiantes</Label>
                <Input
                  id="numEstudiantes"
                  type="number"
                  min="1"
                  max="50"
                  value={numEstudiantes}
                  onChange={handleNumEstudiantesChange}
                />
              </div>
              {/* NÚMERO DE ASIGNATURAS */}
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
              {/* BOTÓN GENERAR / ACTUALIZAR */}
              <Button onClick={generateTable} variant="outline" className="w-full bg-transparent">
                <RefreshCw className="w-4 h-4 mr-2" />
                Generar/Actualizar Tabla
              </Button>
            </div>

            {/* TABLA COMPLETA */}
            <form className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead className="min-w-[100px]">Apellido 1</TableHead>
                      <TableHead className="min-w-[100px]">Apellido 2</TableHead>
                      <TableHead className="min-w-[100px]">Nombre</TableHead>
                      {Array.from({ length: nAsign }, (_, i) => (
                        <TableHead key={i} className="w-24 text-center">
                          {/* NÚMERO DE COLUMNA Y SELECT DE MÓDULO */}
                          <div>{i + 1}</div>
                          <SelectField
                            label=""
                            name={`module_col_${i}`}
                            value={selectedModuleCodes[i] || ""}
                            onValueChange={(value) => {
                              setSelectedModuleCodes((prev) => {
                                const copy = [...prev];
                                copy[i] = value;
                                return copy;
                              });
                            }}
                            placeholder="Seleccionar módulo"
                            options={modulesData.map((modulo) => ({
                              value: modulo.codigo_modulo,
                              label: modulo.nombre,
                            }))}
                            width={100}
                          />
                        </TableHead>
                      ))}
                      <TableHead className="w-24 text-center bg-muted">Media</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, studentIndex) => (
                      <TableRow key={field.id}>
                        <TableCell className="font-medium text-center">{studentIndex + 1}</TableCell>
                        {/* CELDA: APELLIDO 1 */}
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
                        {/* CELDA: APELLIDO 2 */}
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
                        {/* CELDA: NOMBRE */}
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
                        {/* CELDAS: NOTAS */}
                        {Array.from({ length: nAsign }, (_, gradeIndex) => (
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
                        {/* CELDA: MEDIA */}
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

              {/* ACCIONES: AÑADIR + GUARDAR */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <Button type="button" variant="outline" onClick={addStudent} className="w-full sm:w-auto bg-transparent">
                  <Plus className="w-4 h-4 mr-2" />
                  Añadir Estudiante
                </Button>

                <Button type="submit" className="w-full sm:w-auto">
                  {/* <Save className="w-4 h-4 mr-2" /> */}
                  Guardar Evaluación
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
