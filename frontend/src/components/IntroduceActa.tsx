// ==================== IMPORTS ====================
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from "react-hook-form";

import { api } from "@/lib/api";
import { useQuery, useQueries, useQueryClient } from "@tanstack/react-query";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import SelectField from "@/components/StudentTable/SelectField";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { toast } from "sonner";

// shadcn/ui select used inside NotaCell
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { PostRecord, PostEnrollment, Enrollment, Student, Law } from '@/types';

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { Check, ChevronsUpDown, Save, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// ==================== API HELPERS ====================

// Fetch Leyes data from API
async function getAllLeyes(): Promise<Law[]> {
  const response = await api.laws.$get();
  if (!response) throw new Error("Error fetching laws");
  const data = await response.json();
  return data.leyes as Law[];
}

// FETCH CICLOS SIN DIFERENCIAR CURSO POR LEY (LOGSE, LOE, LFP)
async function getCiclosByLey(ley: string) {
  const response = await api.cycles.law[':ley'].$get({ param: { ley } });
  if (!response) throw new Error("No existen ciclos con esa ley");
  const data = await response.json();
  return data.ciclo;
}

// FETCH MÓDULOS POR CÓDIGO DE CICLO Y CURSO
async function getModulosByCicloAndCurso(cod_ciclo: string, curso: string) {
  const response = await api.modules.cycle[':cycle_code'].curso[':curso'].$get({
    param: { cycle_code: cod_ciclo, curso: curso }
  });
  if (!response) throw new Error(`No existen móduclos para el ciclo ${cod_ciclo} en el curso ${curso}`);
  const data = await response.json();
  return data.modulos;
}

type StudentWithExpediente = Student & {
  expediente_id: number;
  convocatoria: 'Ordinaria' | 'Extraordinaria';
  dado_baja: boolean;
};

// FETCH ESTUDIANTES POR CICLO, CURSO, AÑO ESCOLAR Y TURNO
async function getAllStudentsFromCycleYearCursoTurnoConvocatoria(
  cycle_code: string,
  ano_inicio: number,
  ano_fin: number,
  curso: string,
  turno: string,
  convocatoria: string
) {
  const response = await api.students.filtro[':cycle_code'][':ano_inicio'][':ano_fin'][':curso'][':turno'][':convocatoria'].$get({
    param: { cycle_code: cycle_code, ano_inicio: String(ano_inicio), ano_fin: String(ano_fin), curso: curso, turno: turno, convocatoria: convocatoria }
  });
  if (!response) throw new Error('Error de query para obtener los estudiantes por ciclo, curso, año escolar y turno.');

  const data = await response.json();
  const arr = data.estudiantes as any[];

  // helper robusto para detectar "baja"
  const isTrue = (v: any) => {
    if (v === true) return true;
    if (v === 1) return true;
    const s = String(v).toLowerCase();
    return s === "true" || s === "1" || s === "t";
  };

  const activos = arr.filter((r) => {
    const baja =
      r?.dado_baja ??
      r?.expediente_dado_baja ??
      r?.record_dado_baja ??
      r?.baja ??
      false;
    return !isTrue(baja);
  });

  return activos.map((r): StudentWithExpediente => {
    const base: Student = {
      id_estudiante: Number(r.id_estudiante),
      nombre: r.nombre,
      apellido_1: r.apellido_1,
      apellido_2: r.apellido_2 ?? undefined,
      sexo: r.sexo,
      id_legal: r.id_legal,
      tipo_id_legal: r.tipo_id_legal,
      fecha_nac: new Date(r.fecha_nac),
      num_tfno: r.num_tfno ?? undefined,
      observaciones: r.observaciones ?? undefined,
      requisito_academico: Boolean(r.requisito_academico),
    };

    return {
      ...base,
      expediente_id: Number(r.expediente_id),
      convocatoria: r.convocatoria as 'Ordinaria' | 'Extraordinaria',
      dado_baja: false,
    };
  });
}

// CAMBIAR NOTA DE UN ENROLLMENT
async function patchNota(
  expediente_id: number,
  modulo_id: number,
  nota: Nota | null
) {
  const response = await api.enrollments.notas[':record_id'][':module_id'].$patch({
    param: { record_id: String(expediente_id), module_id: String(modulo_id) },
    json: { nota }
  });

  if (!response.ok) {
    throw new Error("No se pudo actualizar la matrícula");
  }

  return response.json();
}

type Convocatoria = "Ordinaria" | "Extraordinaria";

type NotaEnum =
  | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10"
  | "10-MH" | "10-Matr. Honor"
  | "CV" | "CV-5" | "CV-6" | "CV-7" | "CV-8" | "CV-9" | "CV-10" | "CV-10-MH"
  | "TRAS-5" | "TRAS-6" | "TRAS-7" | "TRAS-8" | "TRAS-9" | "TRAS-10" | "TRAS-10-MH"
  | "RC" | "NE" | "APTO" | "NO APTO" | "EX";

type NotasMasAltasPorCicloReturn = {
  id_ciclo: number;
  id_modulo: number;
  modulo: string;
  codigo_modulo: string;
  mejor_nota: NotaEnum | null;
  mejor_ano_inicio: number | null;
  mejor_ano_fin: number | null;
  convocatoria: number | null;
};

// FETCH NOTAS MAS ALTAS DEL CICLO DE UN ESTUDIANTE
async function getNotasAltasEstudiantePorCiclo(
  id_estudiante: number,
  id_ciclo: number
): Promise<NotasMasAltasPorCicloReturn[]> {
  const response = await api.enrollments.notasAltasAprobadas[":id_estudiante"][":id_ciclo"].$get({
    param: { id_estudiante: String(id_estudiante), id_ciclo: String(id_ciclo) },
  });
  if (!response.ok) throw new Error("Error obteniendo las notas más altas del estudiante.");
  const data = await response.json();
  return data.result as NotasMasAltasPorCicloReturn[];
}

// POST DE EXPEDIENTE (PARA CREAR EXPEDIENTE DE ESTUDIANTES EN EXTRAORDINARIA)
async function createRecord(recordData: PostRecord) {
  const response = await api.records.$post({ json: recordData });
  if (!response.ok) throw new Error('Error al crear el expediente');
  return response.json();
}

// POST DE MATRICULAS
async function createMatriculas(enrollmentData: PostEnrollment) {
  const response = await api.enrollments.$post({ json: enrollmentData });
  if (!response.ok) throw new Error('Error al crear las matrículas');
  return response.json();
}

// FETCH ENROLLMENTS BY RECORD
async function enrollmentsByRecord(id_expediente: number, id_estudiante: number) {
  const response = await api.enrollments.matriculasPorExpediente[":id_expediente"][":id_estudiante"].$get({
    param: { id_expediente: String(id_expediente), id_estudiante: String(id_estudiante) },
  });
  if (!response.ok) throw new Error("Error obteniendo las matrículas por expediente.");
  const data = await response.json();
  return data.expedientes as Enrollment[];
};

// FETCH CONVOCATORIAS POR ESTUDIANTE Y MODULO
async function countConvocatorias(id_modulo: number, id_estudiante: number) {
  const response = await api.modules.convocatorias[":module_id"][":student_id"].$get({
    param: { module_id: String(id_modulo), student_id: String(id_estudiante) },
  });
  if (!response.ok) throw new Error("Error obteniendo las convocatorias");
  const data = await response.json();
  return data.convocatorias;
}

// ==================== UTILS ====================

// GENERA LAS OPCIONES DE AÑO ESCOLAR (EJ: 2024-2025)
const generateSchoolYearOptions = (): { value: string; label: string }[] => {
  const currentYear = new Date().getFullYear(); // AÑO ACTUAL
  const startYear = 2014; // AÑO DE INICIO
  const options: { value: string; label: string }[] = [];

  for (let year = currentYear; year >= startYear; year--) {
    const schoolYear = `${year}-${year + 1}`;
    options.push({ value: schoolYear, label: schoolYear });
  }

  return options;
};

// → convierte una nota (string/number) a número (para medias). Devuelve null si no es numérica.
const notaToNumber = (v: unknown): number | null => {
  if (v == null || v === "") return null;
  if (typeof v === "number") return isFinite(v) ? v : null;
  if (typeof v === "string") {
    const mh = v.match(/^(\d{1,2})(?:-MH)?$/);
    if (mh) {
      const n = Number(mh[1]);
      return isFinite(n) ? n : null;
    }
    const cv = v.match(/^CV-(\d{1,2})$/);
    if (cv) {
      const n = Number(cv[1]);
      return isFinite(n) ? n : null;
    }
    return null;
  }
  return null;
};

const isPassingNota = (v: unknown): boolean => {
  if (v === "APTO") return true;               // treat APTO as passed
  const n = notaToNumber(v);
  return n != null && n >= 5;                  // 5–10, 10-MH, CV-5..CV-10
};

// ==================== VALIDATION SCHEMAS (ZOD) ====================
// NOTAS OPCIONES
const NOTA_OPTIONS = [
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "10-MH", "10-Matr. Honor",
  "CV", "CV-5", "CV-6", "CV-7", "CV-8", "CV-9", "CV-10", "CV-10-MH",
  "TRAS-5", "TRAS-6", "TRAS-7", "TRAS-8", "TRAS-9", "TRAS-10", "TRAS-10-MH",
  "RC", "NE", "APTO", "NO APTO", "EX"
] as const;

type Nota = typeof NOTA_OPTIONS[number];

const actaNotaSchema = z.union([
  z.literal(""),
  z.enum(NOTA_OPTIONS),
  z.number().min(0).max(10),
]);

const actaEstudianteSchema = z.object({
  id_estudiante: z.number().optional(),
  id_expediente: z.number().optional(),
  apellido1: z.string().max(100),
  apellido2: z.string().max(100),
  nombre: z.string().max(100),
  notas: z.array(actaNotaSchema),
  nota_final: z.number().optional(),
});

const tablaSchema = z.object({
  students: z.array(actaEstudianteSchema),
});

type tablaForm = z.infer<typeof tablaSchema>;
type CellRefMatrix = (HTMLButtonElement | null)[][];

const NOTA_SET = new Set<string>(NOTA_OPTIONS as readonly string[]);

const toDisplayNota = (v: unknown): string => {
  if (v === "-" || v === "—" || v === "…") return v as string;
  if (typeof v === "string" && NOTA_SET.has(v)) return v;
  // cualquier otra cosa (incluidos números sueltos) -> "NE"
  return "NE";
};

// ==================== COMPONENTE PRINCIPAL ====================
const IntroduceActa: React.FC = () => {
  // ---------- STATE HOOKS ----------
  const [selectedLey, setSelectedLey] = useState<string>("");
  const [selectedCiclo, setSelectedCiclo] = useState<string>("");
  const [selectedCurso, setSelectedCurso] = useState<string>("");
  const [selectedAnioEscolar, setSelectedAnioEscolar] = useState<string>("");
  const [selectedTurno, setSelectedTurno] = useState<string>("");
  const [selectedModuleCodes, setSelectedModuleCodes] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedConvocatoria, setSelectedConvocatoria] = useState<"Ordinaria" | "Extraordinaria">("Ordinaria");
  const [overrideLocked, setOverrideLocked] = useState(false);

  // MULTI: columnas extra de 1º en acta de 2º
  const [extraOtherCourseModuleCodes, setExtraOtherCourseModuleCodes] = useState<string[]>([]);

  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [overrideConfirmText, setOverrideConfirmText] = useState("");

  const queryClient = useQueryClient();

  // Column codes in order: base (curso actual) + extras (1º)
  const columnCodes = useMemo(
    () => [...selectedModuleCodes, ...extraOtherCourseModuleCodes],
    [selectedModuleCodes, extraOtherCourseModuleCodes]
  );
  const nCols = columnCodes.length;
  const baseLen = selectedModuleCodes.length;

  // ---------- REACT-QUERY ----------
  const { data: leyesData = [] } = useQuery<Law[]>({
    queryKey: ['leyes'],
    queryFn: getAllLeyes,
    staleTime: 5 * 60 * 1000,
  });

  const { data: ciclosData = [] } = useQuery({
    queryKey: ['ciclos-by-ley', selectedLey],
    queryFn: () => getCiclosByLey(selectedLey),
    enabled: !!selectedLey,
    staleTime: 5 * 60 * 1000,
  });

  // módulos del curso seleccionado
  const { data: modulesData = [] } = useQuery({
    queryKey: ['modules-by-cycle-curso', selectedCiclo, selectedCurso],
    queryFn: () => getModulosByCicloAndCurso(selectedCiclo, selectedCurso),
    enabled: !!selectedCurso && !!selectedCiclo,
    staleTime: 5 * 60 * 1000,
  });

  // curso "opuesto": si estás en 1º se usa 2º, y viceversa
  const otherCourse = useMemo(
    () => (selectedCurso === '1' ? '2' : selectedCurso === '2' ? '1' : null),
    [selectedCurso]
  );

  // módulos del otro curso (para columnas extra)
  const { data: modulesOtherYear = [] } = useQuery({
    queryKey: ['modules-by-cycle-curso-other', selectedCiclo, otherCourse],
    queryFn: () => getModulosByCicloAndCurso(selectedCiclo, otherCourse!),
    enabled: !!selectedCiclo && !!otherCourse,
    staleTime: 5 * 60 * 1000,
  });

  // map ids for both sets
  const modIdByCode = useMemo(() => {
    const m = new Map<string, number>();
    [...(modulesData ?? []), ...(modulesOtherYear ?? [])].forEach((mo: any) => {
      if (mo?.codigo_modulo && mo?.id_modulo != null) {
        m.set(mo.codigo_modulo, Number(mo.id_modulo));
      }
    });
    return m;
  }, [modulesData, modulesOtherYear]);

  const codeByModId = useMemo(() => {
    const m = new Map<number, string>();
    [...(modulesData ?? []), ...(modulesOtherYear ?? [])].forEach((mo: any) => {
      if (mo?.id_modulo != null && mo?.codigo_modulo) {
        m.set(Number(mo.id_modulo), mo.codigo_modulo);
      }
    });
    return m;
  }, [modulesData, modulesOtherYear]);


  const cicloIdFromModules = modulesData?.[0]?.id_ciclo ?? null;

  const { data: studentsData = [], isFetching: isFetchingStudents } = useQuery<StudentWithExpediente[]>({
    queryKey: [
      "students-by-filter",
      selectedCiclo,
      selectedCurso,
      selectedAnioEscolar,
      selectedTurno,
      selectedConvocatoria
    ],
    queryFn: async () => {
      const parsed = parseSchoolYear(selectedAnioEscolar);
      if (!parsed) throw new Error("Año escolar inválido");
      return getAllStudentsFromCycleYearCursoTurnoConvocatoria(
        selectedCiclo,
        parsed.inicio,
        parsed.fin,
        selectedCurso,
        selectedTurno,
        selectedConvocatoria
      );
    },
    enabled:
      !!selectedCiclo &&
      !!selectedCurso &&
      !!selectedAnioEscolar &&
      !!selectedTurno &&
      !!selectedConvocatoria,
    staleTime: 5 * 60 * 1000,
  });

  const studentIds = useMemo(
    () => (Array.isArray(studentsData) ? studentsData.map((s: any) => s.id_estudiante).filter(Boolean) : []),
    [studentsData]
  );

  const studentRecords = useMemo(
    () =>
    (Array.isArray(studentsData)
      ? studentsData
        .map((s: any) => ({
          sid: s.id_estudiante,
          rid: s.id_expediente ?? s.expediente_id,
        }))
        .filter(({ sid, rid }) => Boolean(sid && rid))
      : []),
    [studentsData]
  );

  const enrollmentsQueries = useQueries({
    queries: studentRecords.map(({ sid, rid }) => ({
      queryKey: ["enrollments-by-record", rid, sid, selectedConvocatoria] as const,
      queryFn: () => enrollmentsByRecord(rid!, sid!),
      enabled: Boolean(rid && sid),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const enrolledCodesByStudent = useMemo(() => {
    const map = new Map<number, Set<string>>();
    enrollmentsQueries.forEach((q, idx) => {
      const sid = studentRecords[idx]?.sid;
      if (!sid) return;
      if (q.status !== "success" || !Array.isArray(q.data)) return;
      const set = new Set<string>();
      q.data.forEach((row) => {
        const code = codeByModId.get(row.id_modulo);
        if (code) set.add(code);
      });
      map.set(sid, set);
    });
    return map;
  }, [enrollmentsQueries, studentRecords, codeByModId]);

  const gradeByStudentCode = useMemo(() => {
    const map = new Map<number, Record<string, Nota>>();
    enrollmentsQueries.forEach((q, idx) => {
      const sid = studentRecords[idx]?.sid;
      if (!sid || q.status !== "success" || !Array.isArray(q.data)) return;
      const rec: Record<string, Nota> = {};
      q.data.forEach((row) => {
        const code = codeByModId.get(row.id_modulo);
        const nota = row.nota as Nota | null | undefined;
        if (code && nota) rec[code] = nota as Nota;
      });
      map.set(sid, rec);
    });
    return map;
  }, [enrollmentsQueries, studentRecords, codeByModId]);

  const notasQueries = useQueries({
    queries: (studentIds ?? []).map((sid: number) => ({
      queryKey: ["notas-altas", sid, cicloIdFromModules],
      queryFn: () => getNotasAltasEstudiantePorCiclo(sid, cicloIdFromModules as number),
      enabled: Boolean(cicloIdFromModules) && Boolean(sid),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const notasByStudent = useMemo(() => {
    const map = new Map<number, Record<string, NotaEnum>>();
    if (!notasQueries?.length) return map;
    notasQueries.forEach((q, idx) => {
      const sid = studentIds[idx];
      if (q.status === "success" && Array.isArray(q.data)) {
        const per: Record<string, NotaEnum> = {};
        q.data.forEach((r: NotasMasAltasPorCicloReturn) => {
          if (r?.codigo_modulo && r?.mejor_nota) per[r.codigo_modulo] = r.mejor_nota;
        });
        map.set(sid, per);
      }
    });
    return map;
  }, [notasQueries, studentIds]);

  const lockedByStudent = useMemo(() => {
    const map = new Map<number, Set<string>>();
    notasByStudent.forEach((per, sid) => {
      const set = new Set<string>();
      Object.entries(per).forEach(([codigo, nota]) => {
        if (isPassingNota(nota)) set.add(codigo);
      });
      map.set(sid, set);
    });
    return map;
  }, [notasByStudent]);

  // ---------- CONVOCATORIAS POR (ESTUDIANTE, MÓDULO) ----------
  const convCells = useMemo(() => {
    const arr: Array<{ sid: number; code: string; modId: number }> = [];
    if (!studentIds?.length || !columnCodes?.length) return arr;
    for (const sid of studentIds) {
      for (const code of columnCodes) {
        const modId = modIdByCode.get(code);
        if (!modId) continue;
        arr.push({ sid, code, modId });
      }
    }
    return arr;
  }, [studentIds, columnCodes, modIdByCode]);

  const convocatoriasQueries = useQueries({
    queries: convCells.map(({ sid, modId }) => ({
      queryKey: ["convocatorias", sid, modId] as const,
      queryFn: () => countConvocatorias(modId, sid),
      enabled: Boolean(sid && modId),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const convCountByStudentCode = useMemo(() => {
    const map = new Map<number, Record<string, number>>();
    convCells.forEach((cell, idx) => {
      const q = convocatoriasQueries[idx];
      if (q?.status !== "success") return;
      const count = Number(q.data ?? 0);
      const rec = map.get(cell.sid) ?? {};
      rec[cell.code] = count;
      map.set(cell.sid, rec);
    });
    return map;
  }, [convCells, convocatoriasQueries]);

  const hasOrdinaria = useMemo(() => {
    if (!Array.isArray(studentsData)) return false;
    return studentsData.some((s: any) => {
      const c = s?.convocatoria ?? s?.record_convocatoria ?? s?.convocatoria_actual ?? null;
      if (typeof c === "string") return c.toLowerCase() === "ordinaria" || c === "1";
      if (typeof c === "number") return c === 1;
      return false;
    });
  }, [studentsData]);

  // ---------- FORM ----------
  const form = useForm<tablaForm>({
    resolver: zodResolver(tablaSchema),
    defaultValues: { students: [] },
  });
  const { fields, replace } = useFieldArray({ control: form.control, name: "students" });

  // ---------- UTILITIES ----------
  const calculateAverage = useCallback((grades: (string | number | null | undefined)[]) => {
    let total = 0;
    let sum = 0;
    for (const g of grades) {
      if (g == null || g === "") { total += 1; continue; }
      if (typeof g === "number" && isFinite(g)) { sum += g; total += 1; continue; }
      if (typeof g === "string") {
        if (g === "NE") { total += 1; continue; }
        const mh = g.match(/^(\d{1,2})(?:-MH)?$/);
        if (mh) { sum += Number(mh[1]); total += 1; continue; }
        const cv = g.match(/^CV-(\d{1,2})$/);
        if (cv) { sum += Number(cv[1]); total += 1; continue; }
      }
    }
    return total > 0 ? Number((sum / total).toFixed(2)) : 0;
  }, []);

  // ---------- EFFECTS ----------
  // Autoselect columns for current course
  useEffect(() => {
    if (modulesData && modulesData.length) {
      setSelectedModuleCodes(modulesData.map((m: any) => m.codigo_modulo));
    } else {
      setSelectedModuleCodes([]);
    }
  }, [modulesData]);

  // Force Ordinaria on main filters change
  useEffect(() => {
    if (selectedConvocatoria !== "Ordinaria") {
      setSelectedConvocatoria("Ordinaria");
    }
  }, [selectedAnioEscolar, selectedCurso, selectedCiclo]);

  // Reset all when ley changes
  useEffect(() => {
    if (!selectedLey) return;
    setSelectedConvocatoria("Ordinaria");
    setSelectedCiclo("");
    setSelectedCurso("");
    setSelectedAnioEscolar("");
    setSelectedTurno("");
    setSelectedModuleCodes([]);
    setExtraOtherCourseModuleCodes([]);
    replace([]);
  }, [selectedLey, replace]);

  // Mantén las columnas; solo vacía las filas para evitar parpadeos de datos
  useEffect(() => {
    replace([]);
  }, [selectedCiclo, selectedCurso, replace]);

  // Cuando cambiamos de curso, eliminamos las columnas extra del otro curso y recortamos notas
  useEffect(() => {
    if (!extraOtherCourseModuleCodes.length) return;

    const nExtra = extraOtherCourseModuleCodes.length;
    const rows = form.getValues("students");
    if (rows?.length) {
      const next = rows.map((st: any) => {
        const notas = Array.isArray(st.notas)
          ? st.notas.slice(0, Math.max(0, st.notas.length - nExtra))
          : [];
        return { ...st, notas, nota_final: calculateAverage(notas) };
      });
      form.setValue("students", next, { shouldDirty: true });
    }

    setExtraOtherCourseModuleCodes([]);
  }, [selectedCurso, form, calculateAverage]); // 👈 quitamos extraOtherCourseModuleCodes.length


  // Populate students on fetch
  useEffect(() => {
    if (!studentsData || !Array.isArray(studentsData)) return;
    const moduloCount = (modulesData?.length ?? 0);
    const mapped = studentsData.map((s: any) => {
      const notas = Array(Math.max(moduloCount, 0)).fill("NE");
      const apellido1 = s.apellido_1 ?? s.apellido1 ?? "";
      const apellido2 = s.apellido_2 ?? s.apellido2 ?? "";
      const nombre = s.nombre ?? "";
      return {
        id_estudiante: s.id_estudiante,
        id_expediente: s.id_expediente ?? s.expediente_id,
        apellido1, apellido2, nombre,
        notas,
        nota_final: calculateAverage(notas),
      };
    });
    replace(mapped);
  }, [studentsData, modulesData, replace, calculateAverage]);

  // Adjust rows length when nCols changes (append/truncate with NE)
  useEffect(() => {
    const rows = form.getValues("students");
    if (!rows?.length) return;
    const cols = nCols;
    let changed = false;
    const next = rows.map((st: any) => {
      const notas = Array.isArray(st.notas) ? [...st.notas] : [];
      if (notas.length < cols) {
        while (notas.length < cols) notas.push("NE");
      } else if (notas.length > cols) {
        notas.length = cols;
      }
      const nf = calculateAverage(notas);
      if (notas.length !== (st.notas?.length ?? 0) || nf !== st.nota_final) changed = true;
      return { ...st, notas, nota_final: nf };
    });
    if (changed) form.setValue("students", next, { shouldDirty: true });
  }, [nCols, form, calculateAverage]);

  // Autofill (prefer actual current record, then historical pass)
  useEffect(() => {
    if (!columnCodes?.length) return;
    const rows = form.getValues("students");
    if (!rows?.length) return;
    let changed = false;
    const next = rows.map((st: any) => {
      const sid = st?.id_estudiante as number | undefined;
      const historicas = sid ? notasByStudent.get(sid) : undefined;
      const actuales = sid ? gradeByStudentCode.get(sid) : undefined;
      const notas = (st.notas ?? []).map((cell: any, colIdx: number) => {
        const code = columnCodes[colIdx];
        if (!code) return "NE"; // sin módulo seleccionado
        const isEmptyOrNE = cell == null || cell === "" || cell === "NE";
        if (!isEmptyOrNE) return cell;
        const nActual = actuales?.[code] as Nota | undefined;
        if (nActual) return nActual;
        const nHist = historicas?.[code] as Nota | undefined;
        if (nHist && isPassingNota(nHist)) return nHist;
        return "NE";
      });
      const nf = calculateAverage(notas);
      if (JSON.stringify(notas) !== JSON.stringify(st.notas) || nf !== st.nota_final) changed = true;
      return { ...st, notas, nota_final: nf };
    });
    if (changed) form.setValue("students", next, { shouldDirty: true });
  }, [columnCodes, notasByStudent, gradeByStudentCode, form, calculateAverage]);

  // ---------- EXTRA COL HANDLERS ----------
  const addExtraColumn = useCallback(() => {
    if (selectedCurso !== '1' && selectedCurso !== '2') {
      toast.error("Solo puedes añadir columnas de otro curso en 1º o 2º.");
      return;
    }

    setExtraOtherCourseModuleCodes((prev) => [...prev, ""]);

    const rows = form.getValues("students");
    if (rows?.length) {
      const next = rows.map((st: any) => {
        const notas = Array.isArray(st.notas) ? [...st.notas, "NE"] : ["NE"];
        return { ...st, notas, nota_final: calculateAverage(notas) };
      });
      form.setValue("students", next, { shouldDirty: true });
    }
  }, [selectedCurso, form, calculateAverage]);

  const removeExtraColumn = useCallback((idx: number) => {
    setExtraOtherCourseModuleCodes((prev) => prev.filter((_, i) => i !== idx));
    // splice the corresponding column from all rows (baseLen + idx)
    const colToRemove = baseLen + idx;
    const rows = form.getValues("students");
    if (rows?.length) {
      const next = rows.map((st: any) => {
        const notas = Array.isArray(st.notas) ? [...st.notas] : [];
        if (colToRemove >= 0 && colToRemove < notas.length) {
          notas.splice(colToRemove, 1);
        }
        return { ...st, notas, nota_final: calculateAverage(notas) };
      });
      form.setValue("students", next, { shouldDirty: true });
    }
  }, [baseLen, form, calculateAverage]);

  const handleExtraModuleSelect = useCallback((idx: number, newCode: string) => {
    // prevent duplicates across base + other extras
    const used = new Set<string>([
      ...selectedModuleCodes.filter(Boolean),
      ...extraOtherCourseModuleCodes.filter((c, i) => i !== idx && !!c),
    ]);
    if (newCode && used.has(newCode)) {
      toast.error("Ese módulo ya está seleccionado en otra columna.");
      return;
    }
    setExtraOtherCourseModuleCodes((prev) => {
      const next = [...prev];
      next[idx] = newCode;
      return next;
    });
  }, [selectedModuleCodes, extraOtherCourseModuleCodes]);

  // ---------- BASE COL HANDLER ----------
  const handleModuleSelect = useCallback(
    (colIndex: number, newCode: string) => {
      setSelectedModuleCodes(prev => {
        const currentCode = prev[colIndex] ?? "";
        if (newCode === currentCode) return prev;

        const otherCol = prev.findIndex(c => c === newCode);
        const next = [...prev];

        if (otherCol !== -1) {
          // swap base columns (and notas indices)
          [next[colIndex], next[otherCol]] = [next[otherCol], next[colIndex]];
          const rows = form.getValues("students");
          const updated = rows.map((st: any) => {
            const notas = [...(st.notas ?? [])];
            [notas[colIndex], notas[otherCol]] = [notas[otherCol], notas[colIndex]];
            return { ...st, notas, nota_final: calculateAverage(notas) };
          });
          form.setValue("students", updated, { shouldDirty: true });
        } else {
          next[colIndex] = newCode;
        }

        return next;
      });
    },
    [form, calculateAverage]
  );


  // ---------- SUBMIT ----------
  async function runBatches<T>(jobs: (() => Promise<T>)[], batchSize = 8) {
    let ok = 0, fail = 0;
    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize).map(fn =>
        fn().then(() => ok++).catch(() => fail++)
      );
      await Promise.allSettled(batch);
    }
    return { ok, fail };
  }

  const onSubmitSave = async (values: tablaForm) => {
    const jobRunner = async () => {
      setIsSaving(true);
      try {
        // 1) PATCH en expediente actual
        const patchJobs: Array<() => Promise<any>> = [];
        const missingExpedientes: number[] = [];

        values.students.forEach((st, rowIdx) => {
          const expedienteId = (st as any).id_expediente;
          const sid = (st as any).id_estudiante ?? studentsData?.[rowIdx]?.id_estudiante;
          const enrolledSet = sid ? enrolledCodesByStudent.get(sid) : undefined;

          if (!expedienteId) {
            missingExpedientes.push(rowIdx + 1);
            return;
          }

          columnCodes.forEach((code, colIdx) => {
            if (!code) return; // columna sin módulo
            const modId = modIdByCode.get(code);
            if (!modId) return;

            const isHistoricalPass = !!sid && !!lockedByStudent.get(sid)?.has(code);
            if (isHistoricalPass) return;

            if (!enrolledSet || !enrolledSet.has(code)) return;

            const raw = (st.notas?.[colIdx]) as any;
            const nota: Nota | null = raw == null || raw === "" ? "NE" : (raw as Nota);
            patchJobs.push(() => patchNota(expedienteId, modId, nota));
          });
        });

        const patchRes = await runBatches(patchJobs, 10);

        // 2) Crear Extraordinaria si hay suspensas (en Ordinaria)
        let extraPlanned = 0;
        let extraEnrollmentsPlanned = 0;

        const parsedYear = parseSchoolYear(selectedAnioEscolar);
        if (!parsedYear) throw new Error("Año escolar inválido");

        const extraJobs: Array<() => Promise<any>> = [];

        if (selectedConvocatoria === "Ordinaria") {
          values.students.forEach((st, rowIdx) => {
            const sid = (st as any).id_estudiante ?? studentsData?.[rowIdx]?.id_estudiante;
            if (!sid) return;

            const enrolledSet = enrolledCodesByStudent.get(sid);
            const failedModIds: number[] = [];

            columnCodes.forEach((code, colIdx) => {
              if (!code) return;
              if (!enrolledSet || !enrolledSet.has(code)) return;

              const modId = modIdByCode.get(code);
              if (!modId) return;

              const raw = (st.notas?.[colIdx]) ?? "NE";
              if (!isPassingNota(raw)) {
                failedModIds.push(modId);
              }
            });

            if (failedModIds.length === 0) return;

            extraPlanned += 1;
            extraEnrollmentsPlanned += failedModIds.length;

            extraJobs.push(async () => {
              if (!cicloIdFromModules) throw new Error("No se pudo resolver id_ciclo");
              const recordData: PostRecord = {
                id_estudiante: sid,
                ano_inicio: parsedYear.inicio,
                ano_fin: parsedYear.fin,
                turno: selectedTurno,
                id_ciclo: Number(cicloIdFromModules),
                convocatoria: "Extraordinaria",
                vino_traslado: false,
                dado_baja: false,
              };
              const rec = await createRecord(recordData);
              const extraExpId: number = rec.expediente.id_expediente;
              for (const modId of failedModIds) {
                const enroll: PostEnrollment = {
                  id_estudiante: sid,
                  id_modulo: modId,
                  id_expediente: extraExpId,
                  nota: "NE",
                };
                await createMatriculas(enroll);
              }
            });
          });
        }

        const extraRes = await runBatches(extraJobs, 3);

        // Refetch
        await Promise.allSettled([
          queryClient.invalidateQueries({
            queryKey: [
              "students-by-filter",
              selectedCiclo,
              selectedCurso,
              selectedAnioEscolar,
              selectedTurno,
              selectedConvocatoria,
            ],
            refetchType: "active",
          }),
          selectedConvocatoria === "Ordinaria"
            ? queryClient.invalidateQueries({
              queryKey: [
                "students-by-filter",
                selectedCiclo,
                selectedCurso,
                selectedAnioEscolar,
                selectedTurno,
                "Extraordinaria",
              ],
              refetchType: "active",
            })
            : Promise.resolve(),
          queryClient.invalidateQueries({ queryKey: ["enrollments-by-record"], refetchType: "active" }),
          queryClient.invalidateQueries({ queryKey: ["notas-altas"], refetchType: "active" }),
        ]);

        return {
          ok: patchRes.ok,
          fail: patchRes.fail,
          missingExpedientes,
          extraStudents: extraPlanned,
          extraCreated: extraRes.ok,
          extraFailed: extraRes.fail,
          extraEnrollmentsPlanned,
        };
      } finally {
        setIsSaving(false);
      }
    };

    toast.promise(jobRunner(), {
      loading: "Guardando notas…",
      success: (r) => {
        const lines: string[] = [];
        lines.push(`Notas guardadas: ${r.ok} OK${r.fail ? `, ${r.fail} fallidas` : ""}.`);
        if (r.missingExpedientes?.length) {
          setTimeout(() => { toast.message(`Filas sin expediente: ${r.missingExpedientes.join(", ")}`); }, 0);
        }
        if (selectedConvocatoria === "Ordinaria") {
          if (r.extraStudents > 0) {
            lines.push(
              `Extraordinaria: planificados ${r.extraStudents} estudiantes / ${r.extraEnrollmentsPlanned} matrículas.`
            );
            lines.push(
              `Creaciones OK: ${r.extraCreated}${r.extraFailed ? `, fallidas: ${r.extraFailed}` : ""}.`
            );
          } else {
            lines.push("Todos los estudiantes están aprobados. No se creó Extraordinaria.");
          }
        }
        return lines.join("\n");
      },
      error: (err) => `No se pudieron guardar: ${err?.message ?? "Error desconocido"}`,
    });
  };

  // ---------- CELDAS DE INSERCIÓN DE NOTAS (navegación tab) ------------

  const cellRefs = React.useRef<CellRefMatrix>([]);

  const registerCellRef = useCallback(
    (rowIndex: number, colIndex: number) =>
      (el: HTMLButtonElement | null) => {
        if (!cellRefs.current[rowIndex]) {
          cellRefs.current[rowIndex] = [];
        }
        cellRefs.current[rowIndex][colIndex] = el;
      },
    []
  );

  const focusCell = useCallback((rowIndex: number, colIndex: number) => {
    const el = cellRefs.current[rowIndex]?.[colIndex];
    if (el) {
      el.focus();
    }
  }, []);

  const goToNextCell = useCallback(
    (rowIndex: number, colIndex: number) => {
      const totalRows = fields.length;   // nº de alumnos
      const totalCols = nCols;          // nº de módulos (base + extra)
      if (!totalRows || !totalCols) return;

      const flatIndex = rowIndex * totalCols + colIndex;
      const nextFlat = flatIndex + 1;

      if (nextFlat >= totalRows * totalCols) {
        // estamos en la última celda -> puedes dejarlo aquí o volver al principio
        // focusCell(0, 0);
        return;
      }

      const nextRow = Math.floor(nextFlat / totalCols);
      const nextCol = nextFlat % totalCols;
      focusCell(nextRow, nextCol);
    },
    [fields.length, nCols, focusCell]
  );

  // ---------- TABLE LAYOUT ----------
  const COL_W = { hash: 64, ape1: 160, ape2: 160, nombre: 180, modulo: 120 } as const;
  const baseWidth = COL_W.hash + COL_W.ape1 + COL_W.ape2 + COL_W.nombre;
  const LEFT = { hash: 0, ape1: COL_W.hash, ape2: COL_W.hash + COL_W.ape1, nombre: COL_W.hash + COL_W.ape1 + COL_W.ape2 } as const;

  // ---------- RENDER ----------
  return (
    <div className='min-w-0'>
      {/* FILTROS DE CABECERA */}
      <div className="mt-5 px-5">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="w-[260px] shrink-0">
            <SelectField
              label="Ley Educativa"
              name="ley_educativa"
              value={selectedLey}
              onValueChange={setSelectedLey}
              placeholder="Seleccionar ley"
              options={leyesData.map((ley) => ({ value: `${ley.id_ley}`, label: `${ley.nombre_ley}` }))}
              width={260}
            />
          </div>

          <div className="w-[260px] shrink-0">
            <SelectField
              label="Ciclo Formativo"
              name="ciclo_formativo"
              value={selectedCiclo || ""}
              onValueChange={setSelectedCiclo}
              placeholder="Seleccionar ciclo"
              options={(ciclosData ?? []).map((c) => ({ value: `${c.codigo}`, label: `${c.nombre} (${c.codigo})` }))}
              width={260}
            />
          </div>

          <div className="w-[260px] shrink-0">
            <SelectField
              label="Curso"
              name="curso"
              value={selectedCurso || ""}
              onValueChange={setSelectedCurso}
              placeholder="Curso"
              options={[{ value: '1', label: '1°' }, { value: '2', label: '2°' }]}
              width={260}
            />
          </div>

          <div className="w-[10vw] shrink-0">
            <SelectField
              label="Año escolar"
              name="anio_escolar"
              value={selectedAnioEscolar || ""}
              onValueChange={setSelectedAnioEscolar}
              placeholder="Año escolar"
              options={generateSchoolYearOptions()}
              width={260}
            />
          </div>

          {/* TURNO */}
          <div className="w-[260px] shrink-0">
            <SelectField
              label="Turno"
              name="turno"
              value={selectedTurno}
              onValueChange={setSelectedTurno}
              placeholder="Seleccionar turno"
              options={[
                { value: "Diurno", label: "Diurno" },
                { value: "Vespertino", label: "Vespertino" },
                { value: "Nocturno", label: "Nocturno" },
                { value: "A distancia", label: "A distancia" },
              ]}
              width={260}
            />
          </div>

          {/* CONVOCATORIA */}
          <div className="space-y-2">
            <Select value={selectedConvocatoria} onValueChange={(v) => setSelectedConvocatoria(v as Convocatoria)}>
              <SelectTrigger id="convocatoria" className="w-full">
                <SelectValue placeholder="Convocatoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ordinaria">Ordinaria</SelectItem>
                {(hasOrdinaria || selectedConvocatoria === "Extraordinaria") && (
                  <SelectItem value="Extraordinaria">Extraordinaria</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* CONTROL: Añadir columnas de 1º cuando estamos en 2º */}
          {(selectedCurso === '1' || selectedCurso === '2') && (
            <div className="ml-auto flex items-end gap-2">
              <Button type="button" variant="outline" onClick={addExtraColumn}>
                {selectedCurso === '1'
                  ? "Añadir columna de 2º"
                  : "Añadir columna de 1º"}
              </Button>
              {extraOtherCourseModuleCodes.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {extraOtherCourseModuleCodes.length} añadida(s)
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* TARJETA PRINCIPAL CON LA TABLA Y CONTROLES */}
      <div className='min-w-0'>
        <div className='px-5 mt-2 min-w-0'>
          <Card>
            <CardHeader>
              <CardTitle>
                Evaluación de Estudiantes
              </CardTitle>
              <CardDescription>Introduce manualmente los datos de evaluación de los alumnos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 min-w-0">
              {/* TABLA COMPLETA */}
              <form onSubmit={form.handleSubmit(onSubmitSave)}>
                {/* WRAPPER con scroll interno y header sticky */}
                <div
                  className="relative isolate w-full overflow-x-auto overflow-y-auto overscroll-contain rounded-lg border"
                  style={{ maxHeight: "55vh" }}
                >
                  <Table
                    className="table-fixed"
                    style={{ minWidth: `${baseWidth + nCols * COL_W.modulo}px` }}
                  >
                    {/* HEADER */}
                    <TableHeader className="sticky top-0 z-40 bg-background/95 border-b">
                      <TableRow>
                        {/* # */}
                        <TableHead
                          className="sticky left-0 z-50 bg-background border-r"
                          style={{
                            width: COL_W.hash,
                            minWidth: COL_W.hash,
                            maxWidth: COL_W.hash,
                          }}
                        >
                          #
                        </TableHead>

                        {/* Apellido 1 */}
                        <TableHead
                          className="sticky z-50 bg-background border-r"
                          style={{
                            left: LEFT.ape1,
                            width: COL_W.ape1,
                            minWidth: COL_W.ape1,
                            maxWidth: COL_W.ape1,
                          }}
                        >
                          Apellido 1
                        </TableHead>

                        {/* Apellido 2 */}
                        <TableHead
                          className="sticky z-50 bg-background border-r"
                          style={{
                            left: LEFT.ape2,
                            width: COL_W.ape2,
                            minWidth: COL_W.ape2,
                            maxWidth: COL_W.ape2,
                          }}
                        >
                          Apellido 2
                        </TableHead>

                        {/* Nombre */}
                        <TableHead
                          className="sticky z-50 bg-background border-r"
                          style={{
                            left: LEFT.nombre,
                            width: COL_W.nombre,
                            minWidth: COL_W.nombre,
                            maxWidth: COL_W.nombre,
                          }}
                        >
                          Nombre
                        </TableHead>

                        {/* Columnas base (curso seleccionado) */}
                        {Array.from({ length: selectedModuleCodes.length }, (_, i) => (
                          <TableHead
                            key={`base-${i}`}
                            className="text-center"
                            style={{
                              width: COL_W.modulo,
                              minWidth: COL_W.modulo,
                              maxWidth: COL_W.modulo,
                            }}
                          >
                            <div className="flex flex-col items-center justify-center gap-1">
                              <div className="text-xs font-medium opacity-70">{i + 1}</div>
                              <SelectField
                                label=""
                                name={`module_col_${i}`}
                                value={selectedModuleCodes[i] || ""}
                                onValueChange={(value) => handleModuleSelect(i, value)}
                                placeholder="Seleccionar módulo"
                                width={COL_W.modulo}
                                options={modulesData.map((m: any) => ({
                                  value: m.codigo_modulo,
                                  label: m.nombre,
                                }))}
                              />
                            </div>
                          </TableHead>
                        ))}

                        {/* Columnas extra (1º) */}
                        {extraOtherCourseModuleCodes.map((code, ei) => {
                          const colNum = baseLen + ei + 1;
                          return (
                            <TableHead
                              key={`extra-${ei}`}
                              className="text-center"
                              style={{
                                width: COL_W.modulo,
                                minWidth: COL_W.modulo,
                                maxWidth: COL_W.modulo,
                              }}
                            >
                              <div className="flex flex-col items-center justify-center gap-1">
                                <div className="text-xs font-medium opacity-70">{colNum}</div>

                                <SelectField
                                  label=""
                                  name={`module_col_extra_other_${ei}`}
                                  value={code || ""}
                                  onValueChange={(v) => handleExtraModuleSelect(ei, v)}
                                  placeholder={
                                    selectedCurso === "1" ? "Módulo de 2º" : "Módulo de 1º"
                                  }
                                  width={COL_W.modulo}
                                  options={(modulesOtherYear ?? []).map((m: any) => ({
                                    value: m.codigo_modulo,
                                    label: m.nombre,
                                  }))}
                                />

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  title="Quitar columna"
                                  onClick={() => removeExtraColumn(ei)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableHead>
                          );
                        })}
                      </TableRow>
                    </TableHeader>

                    {/* BODY */}
                    <TableBody>
                      {fields.map((field, studentIndex) => (
                        <TableRow key={field.id}>
                          {/* # */}
                          <TableCell
                            className="sticky left-0 z-30 bg-background border-r text-center font-medium"
                            style={{
                              width: COL_W.hash,
                              minWidth: COL_W.hash,
                              maxWidth: COL_W.hash,
                            }}
                          >
                            {studentIndex + 1}
                          </TableCell>

                          {/* Apellido 1 */}
                          <TableCell
                            className="sticky z-30 bg-background border-r"
                            style={{
                              left: LEFT.ape1,
                              width: COL_W.ape1,
                              minWidth: COL_W.ape1,
                              maxWidth: COL_W.ape1,
                            }}
                          >
                            <Input
                              {...form.register(`students.${studentIndex}.apellido1`)}
                              readOnly
                              tabIndex={-1}
                              title="Campo bloqueado"
                              className={`${form.formState.errors.students?.[studentIndex]?.apellido1
                                ? "border-red-500"
                                : ""
                                } bg-muted/50 cursor-not-allowed focus-visible:ring-0 focus-visible:ring-offset-0`}
                            />
                          </TableCell>

                          {/* Apellido 2 */}
                          <TableCell
                            className="sticky z-30 bg-background border-r"
                            style={{
                              left: LEFT.ape2,
                              width: COL_W.ape2,
                              minWidth: COL_W.ape2,
                              maxWidth: COL_W.ape2,
                            }}
                          >
                            <Input
                              {...form.register(`students.${studentIndex}.apellido2`)}
                              readOnly
                              tabIndex={-1}
                              title="Campo bloqueado"
                              className={`${form.formState.errors.students?.[studentIndex]?.apellido2
                                ? "border-red-500"
                                : ""
                                } bg-muted/50 cursor-not-allowed focus-visible:ring-0 focus-visible:ring-offset-0`}
                            />
                          </TableCell>

                          {/* Nombre */}
                          <TableCell
                            className="sticky z-30 bg-background border-r border-gray-200"
                            style={{
                              left: LEFT.nombre,
                              width: COL_W.nombre,
                              minWidth: COL_W.nombre,
                              maxWidth: COL_W.nombre,
                            }}
                          >
                            <Input
                              {...form.register(`students.${studentIndex}.nombre`)}
                              readOnly
                              tabIndex={-1}
                              title="Campo bloqueado"
                              className={`${form.formState.errors.students?.[studentIndex]?.nombre
                                ? "border-red-500"
                                : ""
                                } bg-muted/50 cursor-not-allowed focus-visible:ring-0 focus-visible:ring-offset-0`}
                            />
                          </TableCell>

                          {/* Notas (todas las columnas = base + extra) */}
                          {Array.from({ length: nCols }, (_, gradeIndex) => (
                            <TableCell
                              key={gradeIndex}
                              style={{
                                width: COL_W.modulo,
                                minWidth: COL_W.modulo,
                                maxWidth: COL_W.modulo,
                              }}
                            >
                              <Controller
                                control={form.control}
                                name={`students.${studentIndex}.notas.${gradeIndex}`}
                                render={({ field }) => {
                                  const sid =
                                    (form.getValues(
                                      `students.${studentIndex}.id_estudiante`
                                    ) as number | undefined) ??
                                    (fields[studentIndex] as any)?.id_estudiante;

                                  const code = columnCodes[gradeIndex];

                                  const enrolledSet = sid
                                    ? enrolledCodesByStudent.get(sid)
                                    : undefined;

                                  const passedHistorically =
                                    !!sid && !!code && lockedByStudent.get(sid)?.has(code);

                                  const fetchedNotaRaw =
                                    sid && code
                                      ? gradeByStudentCode.get(sid)?.[code]
                                      : undefined;

                                  const fetchedNota =
                                    typeof fetchedNotaRaw === "string" &&
                                      NOTA_SET.has(fetchedNotaRaw)
                                      ? fetchedNotaRaw
                                      : "NE";

                                  const candidate =
                                    field.value == null || field.value === ""
                                      ? fetchedNota
                                      : field.value;

                                  const disabledBecauseNoCode = !code;
                                  const isEnrolled =
                                    !!code && enrolledSet?.has(code) === true;
                                  const hasFetchedReal = fetchedNota !== "NE";

                                  const isLocked = Boolean(
                                    disabledBecauseNoCode ||
                                    !isEnrolled ||
                                    passedHistorically ||
                                    (!overrideLocked && hasFetchedReal)
                                  );

                                  const convCountRaw =
                                    sid && code
                                      ? convCountByStudentCode.get(sid)?.[code]
                                      : undefined;
                                  const convCount =
                                    typeof convCountRaw === "number"
                                      ? convCountRaw
                                      : undefined;
                                  const convIncl =
                                    convCount != null ? convCount : undefined;

                                  const isEditableNow =
                                    !isLocked && isEnrolled && !passedHistorically;

                                  let baseLockReason: string | undefined;

                                  if (disabledBecauseNoCode) {
                                    baseLockReason =
                                      "Selecciona un módulo para esta columna";
                                  } else if (!isEnrolled) {
                                    baseLockReason = passedHistorically
                                      ? "Módulo aprobado en un expediente anterior"
                                      : "Módulo no aprobado y sin matrícula en el expediente actual";
                                  } else if (hasFetchedReal) {
                                    baseLockReason = isPassingNota(fetchedNota)
                                      ? "Módulo ya aprobado en el expediente actual"
                                      : "Módulo ya suspenso en el expediente actual";
                                  } else if (passedHistorically) {
                                    baseLockReason =
                                      "Módulo aprobado en un expediente anterior";
                                  }

                                  const disabledTitleText = baseLockReason;

                                  const overrideWarning =
                                    overrideLocked &&
                                      !isLocked &&
                                      (hasFetchedReal || passedHistorically)
                                      ? "⚠️ Nota desbloqueada manualmente. Asegúrate de tener autorización."
                                      : undefined;

                                  let convPart: string | undefined;
                                  if (convCount == null) {
                                    convPart = "Convocatorias: cargando…";
                                  } else if (convCount > 0) {
                                    if (isEditableNow && convIncl != null) {
                                      convPart = `Convocatorias (incluida esta): ${convIncl}`;
                                    } else {
                                      convPart = `Convocatorias: ${convCount}`;
                                    }
                                  }

                                  const needsResolution =
                                    isEditableNow && convIncl != null && convIncl >= 5;

                                  const resolutionPart = needsResolution
                                    ? "⚠️ 5ª convocatoria o más: revisar"
                                    : undefined;

                                  const hoverTitle =
                                    [
                                      baseLockReason,
                                      overrideWarning,
                                      convPart,
                                      resolutionPart,
                                    ]
                                      .filter(Boolean)
                                      .join(" · ") || undefined;

                                  const displayValue = disabledBecauseNoCode
                                    ? "-"
                                    : !isEnrolled
                                      ? passedHistorically
                                        ? "…"
                                        : "—"
                                      : toDisplayNota(candidate);

                                  const highlightFetchedFail =
                                    !!code &&
                                    hasFetchedReal &&
                                    !isPassingNota(fetchedNota);

                                  return (
                                    <NotaCell
                                      value={displayValue}
                                      options={NOTA_OPTIONS}
                                      disabled={isLocked}
                                      disabledTitle={disabledTitleText}
                                      hoverTitle={hoverTitle}
                                      warn={needsResolution}
                                      highlight={highlightFetchedFail}
                                      onChange={(val) => {
                                        if (isLocked) return;
                                        field.onChange(val);
                                        const grades = form.getValues(
                                          `students.${studentIndex}.notas`
                                        );
                                        const avg = calculateAverage(grades);
                                        form.setValue(
                                          `students.${studentIndex}.nota_final`,
                                          avg,
                                          {
                                            shouldDirty: true,
                                          }
                                        );
                                      }}
                                    />
                                  );
                                }}
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {/* ACCIONES */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between pt-5">
                  <div className="flex gap-2">
                    <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
                      <Save />
                      <span className="ml-1">Guardar Evaluación</span>
                    </Button>
                  </div>

                  <div className="flex gap-2 items-center justify-end">
                    {overrideLocked ? (
                      <>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => {
                            setOverrideLocked(false);
                            toast.success(
                              "Modo edición avanzada DESACTIVADO: las notas vuelven a estar bloqueadas."
                            );
                          }}
                          className="w-full sm:w-auto"
                        >
                          Bloquear de nuevo acta
                        </Button>
                        <span className="text-xs text-destructive">
                          Modo edición avanzada activo
                        </span>
                      </>
                    ) : (
                      <AlertDialog
                        open={overrideDialogOpen}
                        onOpenChange={(open) => {
                          setOverrideDialogOpen(open);
                          if (!open) setOverrideConfirmText("");
                        }}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full sm:w-auto"
                          >
                            Desbloquear acta
                          </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Desbloquear edición de acta</AlertDialogTitle>
                            <AlertDialogDescription className="space-y-2">
                              <p>
                                Vas a habilitar la edición de notas ya cerradas para este acta.
                                Esto debería hacerse solo para corregir errores detectados
                                después del cierre.
                              </p>
                              <ul className="list-disc pl-5 text-xs">
                                <li className='mb-2'>
                                  Los cambios pueden requerir justificación o autorización
                                  formal.
                                </li>
                                <li>
                                  Cambiar una calificación suspensa a aprobada
                                  puede requerir comprobar que no exista otra acta posterior en la que
                                  esta misma asignatura figure ya como aprobada.
                                </li>
                              </ul>
                              <div className="pt-3 space-y-1">
                                <p className="text-xs font-medium">
                                  Escribe{" "}
                                  <span className="font-mono font-semibold">DESBLOQUEAR</span>{" "}
                                  para confirmar:
                                </p>
                                <Input
                                  autoFocus
                                  value={overrideConfirmText}
                                  onChange={(e) =>
                                    setOverrideConfirmText(e.target.value.toUpperCase())
                                  }
                                  placeholder="DESBLOQUEAR"
                                  className="h-8 text-xs"
                                />
                              </div>
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          <AlertDialogFooter>
                            <AlertDialogCancel
                              onClick={() => {
                                setOverrideConfirmText("");
                              }}
                            >
                              Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction
                              disabled={overrideConfirmText !== "DESBLOQUEAR"}
                              onClick={() => {
                                setOverrideLocked(true);
                                setOverrideDialogOpen(false);
                                setOverrideConfirmText("");
                                toast.warning(
                                  "Modo edición avanzada ACTIVADO: puedes modificar notas que estaban bloqueadas en este acta."
                                );
                              }}
                            >
                              Confirmar desbloqueo
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default IntroduceActa;

// ==================== CELDA DE NOTAS (SELECT con búsqueda) ====================
const NotaCell = React.memo(function NotaCell({
  value,
  onChange,
  options,
  disabled = false,
  disabledTitle,
  hoverTitle,         // <- NUEVO
  warn = false,       // <- NUEVO
  highlight = false,
}: {
  value: string | number | null | undefined;
  onChange: (val: string) => void;
  options: readonly Nota[];
  disabled?: boolean;
  disabledTitle?: string;
  hoverTitle?: string;    // <- NUEVO
  warn?: boolean;         // <- NUEVO
  highlight?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const v = value == null || value === "" ? "" : String(value);

  const setOpenSafe = (next: boolean) => {
    if (disabled) return;
    setOpen(next);
  };

  return (
    <div className="flex items-center justify-center">
      <Popover open={!disabled && open} onOpenChange={setOpenSafe}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            title={hoverTitle || (disabled ? disabledTitle : undefined)}   // <- siempre mostramos el hover enriquecido
            onClick={() => setOpenSafe(!open)}
            className={[
              "h-9 w-28 rounded-md border bg-background text-sm shadow-sm",
              "px-2 inline-flex items-center justify-between",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
              highlight ? "text-red-600 bg-red-50 border-red-300" : "",
              warn ? "animate-pulse ring-2 ring-red-500" : "",  // <- alerta roja y parpadeando
            ].join(" ")}
          >
            <span className="truncate w-full text-center">{v || "-"}</span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>

        {!disabled && (
          <PopoverContent className="p-0 w-48" align="start">
            <Command shouldFilter>
              <CommandInput placeholder="Buscar nota..." />
              <CommandEmpty>No hay resultados.</CommandEmpty>
              <CommandList className="max-h-64">
                <CommandGroup>
                  {options.map((opt) => (
                    <CommandItem className='cursor-pointer' key={opt} value={opt} onSelect={() => { onChange(opt); setOpenSafe(false); }}>
                      <Check className={["mr-2 h-4 w-4", v === opt ? "opacity-100" : "opacity-0"].join(" ")} />
                      {opt}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        )}
      </Popover>
    </div>
  );
});

// ---------------- Helpers ----------------
// '2021-2022' -> {inicio: 2021, fin: 2022}
const parseSchoolYear = (s: string) => {
  const m = s?.match?.(/^(\d{4})-(\d{4})$/);
  if (!m) return null;
  return { inicio: Number(m[1]), fin: Number(m[2]) };
};