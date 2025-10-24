// ==================== IMPORTS ====================
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from "react-hook-form";

import { api } from "@/lib/api";
import { useQuery, useQueries } from "@tanstack/react-query";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import SelectField from "@/components/StudentTable/SelectField";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// react-hook-form
import { Controller } from "react-hook-form";

import { toast } from "sonner";

// shadcn/ui select used inside NotaCell
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { useQueryClient } from "@tanstack/react-query";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Save, RefreshCw } from "lucide-react";

import { PostRecord, PostEnrollment, Enrollment, Student, Law } from '@/types';

// ==================== API HELPERS ====================

// Fetch Leyes data from API
async function getAllLeyes(): Promise<Law[]> {
  const response = await api.laws.$get();

  if (!response) {
    throw new Error("Error fetching laws")
  }

  const data = await response.json();
  return data.leyes as Law[];
}

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

  // si tu API usa otro nombre (ej. expediente_dado_baja), lo cubrimos aquí
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
      // siempre false aquí porque hemos filtrado los de baja, pero lo dejamos por tipado
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
  | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10"
  | "10-MH"
  | "CV" | "CV-5" | "CV-6" | "CV-7" | "CV-8" | "CV-9" | "CV-10"
  | "AM" | "RC" | "NE" | "APTO" | "NO APTO";

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
  const response = await api.records.$post({
    json: recordData,
  });
  if (!response.ok) {
    throw new Error('Error al crear el expediente')
  }
  return response.json();
}

// POST DE MATRICULAS
async function createMatriculas(enrollmentData: PostEnrollment) {
  const response = await api.enrollments.$post({
    json: enrollmentData,
  });
  if (!response.ok) {
    throw new Error('Error al crear las matrículas');
  }
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

// → convierte una nota (string/number) a número (para medias). Devuelve null si no es numérica.
const notaToNumber = (v: unknown): number | null => {
  if (v == null || v === "") return null;
  if (typeof v === "number") return isFinite(v) ? v : null;
  if (typeof v === "string") {
    // "10-MH" -> 10 ; "CV-8" -> 8 ; "CV" / "AM" / "RC" / "NE" / "APTO" / "NO APTO" -> null
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
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "10-MH",
  "CV", "CV-5", "CV-6", "CV-7", "CV-8", "CV-9", "CV-10",
  "AM", "RC", "NE", "APTO", "NO APTO"
] as const;

type Nota = typeof NOTA_OPTIONS[number];

const NOTA_OPTIONS_NO_CV = NOTA_OPTIONS.filter(o => !o.startsWith("CV")) as Nota[];

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
  const [selectedTurno, setSelectedTurno] = useState<string>("");
  const [numEstudiantes, setNumEstudiantes] = useState<number | ''>(0);
  const [numAsignaturas, setNumAsignaturas] = useState<number | ''>('');
  const [selectedModuleCodes, setSelectedModuleCodes] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedConvocatoria, setSelectedConvocatoria] = useState<"Ordinaria" | "Extraordinaria">("Ordinaria");

  const queryClient = useQueryClient();


  // ---------- REACT-QUERY: OBTENER LEYES -----------
  const {
    error: leyesError,
    data: leyesData = [],
    isLoading: leyesLoading,
  } = useQuery<Law[]>({
    queryKey: ['leyes'],
    queryFn: getAllLeyes,
    staleTime: 5 * 60 * 1000,
  })

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

  // id_modulo by codigo_modulo (needed for patch)
  const modIdByCode = useMemo(() => {
    const m = new Map<string, number>();
    (modulesData ?? []).forEach((mo: any) => {
      if (mo?.codigo_modulo && mo?.id_modulo != null) m.set(mo.codigo_modulo, Number(mo.id_modulo));
    });
    return m;
  }, [modulesData]);

  // inverse map: id_modulo -> codigo_modulo
  const codeByModId = useMemo(() => {
    const m = new Map<number, string>();
    (modulesData ?? []).forEach((mo: any) => {
      if (mo?.id_modulo != null && mo?.codigo_modulo) m.set(Number(mo.id_modulo), mo.codigo_modulo);
    });
    return m;
  }, [modulesData]);

  const cicloIdFromModules = modulesData?.[0]?.id_ciclo ?? null;

  // ---------- REACT-QUERY: OBTENER ESTUDIANTES FILTRADOS -------
  const {
    data: studentsData = [],
    isFetching: isFetchingStudents,
  } = useQuery<StudentWithExpediente[]>({
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

  // All student IDs (if present in the payload)
  const studentIds = useMemo(
    () => (Array.isArray(studentsData) ? studentsData.map((s: any) => s.id_estudiante).filter(Boolean) : []),
    [studentsData]
  );

  // (sid, rid) pairs for students that have an expediente
  const studentRecords = useMemo(
    () =>
    (Array.isArray(studentsData)
      ? studentsData
        .map((s: any) => ({
          sid: s.id_estudiante,
          rid: s.id_expediente ?? s.expediente_id, // ← por si acaso
        }))
        .filter(({ sid, rid }) => Boolean(sid && rid))
      : []),
    [studentsData]
  );

  // parallel queries: enrollments by record for each student
  const enrollmentsQueries = useQueries({
    queries: studentRecords.map(({ sid, rid }) => ({
      queryKey: ["enrollments-by-record", rid, sid, selectedConvocatoria] as const,
      queryFn: () => enrollmentsByRecord(rid!, sid!),
      enabled: Boolean(rid && sid),
      staleTime: 5 * 60 * 1000,
    })),
  });

  // Map: studentId -> Set<codigo_modulo> en los que SÍ está matriculado
  // studentId -> Set<codigo_modulo> con matrícula
  // Map: studentId -> Set<codigo_modulo> (SOLO si la query terminó OK)
  const enrolledCodesByStudent = useMemo(() => {
    const map = new Map<number, Set<string>>();
    enrollmentsQueries.forEach((q, idx) => {
      const sid = studentRecords[idx]?.sid;
      if (!sid) return;

      if (q.status !== "success" || !Array.isArray(q.data)) return; // ← no metas nada todavía

      const set = new Set<string>();
      q.data.forEach((row) => {
        const code = codeByModId.get(row.id_modulo);
        if (code) set.add(code);
      });
      map.set(sid, set);
    });
    return map;
  }, [enrollmentsQueries, studentRecords, codeByModId]);

  // Map: studentId -> { [codigo_modulo]: notaDelExpedienteActual }
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


  // Fire parallel queries for best marks per student for this ciclo
  const notasQueries = useQueries({
    queries: (studentIds ?? []).map((sid: number) => ({
      queryKey: ["notas-altas", sid, cicloIdFromModules],
      queryFn: () => getNotasAltasEstudiantePorCiclo(sid, cicloIdFromModules as number),
      enabled: Boolean(cicloIdFromModules) && Boolean(sid),
      staleTime: 5 * 60 * 1000,
    })),
  });

  // Build a map: studentId -> { [codigo_modulo]: mejor_nota }
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

  // saber que notas bloquear
  const lockedByStudent = useMemo(() => {
    const map = new Map<number, Set<string>>();  // studentId → Set(codigo_modulo)
    notasByStudent.forEach((per, sid) => {
      const set = new Set<string>();
      Object.entries(per).forEach(([codigo, nota]) => {
        if (isPassingNota(nota)) set.add(codigo);
      });
      map.set(sid, set);
    });
    return map;
  }, [notasByStudent]);

  // ¿Hay ya una convocatoria "Ordinaria" para el conjunto filtrado?
  // Intenta leerla de studentsData (ajusta las claves si tu API usa otros nombres)
  const hasOrdinaria = useMemo(() => {
    if (!Array.isArray(studentsData)) return false;
    return studentsData.some((s: any) => {
      const c =
        s?.convocatoria ??           // string "Ordinaria"/"Extraordinaria"
        s?.record_convocatoria ??    // alternativa
        s?.convocatoria_actual ??    // alternativa
        null;
      if (typeof c === "string") return c.toLowerCase() === "ordinaria" || c === "1";
      if (typeof c === "number") return c === 1;
      return false;
    });
  }, [studentsData]);

  // ---------- FORM CONFIG (REACT-HOOK-FORM) ----------
  const form = useForm<tablaForm>({
    resolver: zodResolver(tablaSchema),
    defaultValues: {
      students: [],
      numSubjects: 5,
    },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "students",
  });

  // ---------- UTILIDADES ----------
  const nAsign = typeof numAsignaturas === "number" ? numAsignaturas : 0;
  // CALCULA LA MEDIA DE UN ESTUDIANTE (solo con notas numéricas)
  // CALCULA LA MEDIA CONTANDO "NE" (y vacío) COMO 0, INCLUIDOS EN EL DENOMINADOR
  const calculateAverage = useCallback((grades: (string | number | null | undefined)[]) => {
    let total = 0;
    let sum = 0;

    for (const g of grades) {
      if (g == null || g === "") { // vacío -> cuenta como 0
        total += 1;
        continue;
      }
      if (typeof g === "number" && isFinite(g)) {
        sum += g; total += 1; continue;
      }
      if (typeof g === "string") {
        if (g === "NE") { // NE -> 0
          total += 1; continue;
        }
        // "10" | "10-MH"
        const mh = g.match(/^(\d{1,2})(?:-MH)?$/);
        if (mh) { sum += Number(mh[1]); total += 1; continue; }

        // "CV-7" etc. (numérica, cuenta)
        const cv = g.match(/^CV-(\d{1,2})$/);
        if (cv) { sum += Number(cv[1]); total += 1; continue; }

        // "APTO", "NO APTO", "AM", "RC", "CV" (sin número) -> NO cuentan en el denominador
      }
    }

    return total > 0 ? Number((sum / total).toFixed(2)) : 0;
  }, []);


  // GENERAR O ACTUALIZAR LA TABLA
  const generateTable = useCallback(() => {
    const currentStudents = form.getValues("students");
    const newStudents: any[] = [];

    const nEstud = typeof numEstudiantes === 'number' ? numEstudiantes : 0;

    for (let i = 0; i < nEstud; i++) {
      const existingStudent = currentStudents[i];
      const newGrades = Array(modulesData.length).fill("").map((_, gradeIndex) => {
        const prev = existingStudent?.notas?.[gradeIndex];
        return (typeof prev === "string" || typeof prev === "number")
          ? prev
          : "NE";
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

  // '2021-2022' -> {inicio: 2021, fin: 2022}
  const parseSchoolYear = (s: string) => {
    const m = s?.match?.(/^(\d{4})-(\d{4})$/);
    if (!m) return null;
    return { inicio: Number(m[1]), fin: Number(m[2]) };
  };


  // ---------- HANDLERS ----------

  const handleNumEstudiantesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setNumEstudiantes(value === '' ? '' : Number(value));
  };

  // --- arriba del componente (antes del return) ---
  const COL_W = {
    hash: 64,       // # -> w-16 (4rem = 64px)
    ape1: 160,      // Apellido 1
    ape2: 160,      // Apellido 2
    nombre: 180,    // Nombre
    modulo: 120,    // cada columna de módulo
    media: 100,     // columna "Media"
  };

  const LEFT = {
    hash: 0,
    ape1: COL_W.hash,
    ape2: COL_W.hash + COL_W.ape1,
    nombre: COL_W.hash + COL_W.ape1 + COL_W.ape2,
  };

  // Si usas el minWidth dinámico de la tabla, actualízalo:
  const baseWidth = COL_W.hash + COL_W.ape1 + COL_W.ape2 + COL_W.nombre + COL_W.media;

  // ---------- EFFECTS: SINCRONIZAR DATOS DE MÓDULOS Y ASIGNATURAS ----------
  // Cuando llega modulesData ⇒ selecciona por defecto
  useEffect(() => {
    if (modulesData && modulesData.length) {
      setNumAsignaturas(modulesData.length);          // mismo nº de columnas que módulos
      setSelectedModuleCodes(modulesData.map(m => m.codigo_modulo)); // autoselección inicial
    }
  }, [modulesData]);

  // Cuando el usuario cambie el nº de asignaturas ⇒ NO autoselecciones nada nuevo
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

  // Cuando los estudiante
  useEffect(() => {
    if (!studentsData || !Array.isArray(studentsData)) return;

    const moduloCount =
      (modulesData?.length ?? 0) ||
      (typeof numAsignaturas === "number" ? numAsignaturas : 0) ||
      0;

    const mapped = studentsData.map((s: any) => {
      const notas = Array(Math.max(moduloCount, 0)).fill("NE");
      const apellido1 = s.apellido_1 ?? s.apellido1 ?? "";
      const apellido2 = s.apellido_2 ?? s.apellido2 ?? "";
      const nombre = s.nombre ?? "";

      return {
        id_estudiante: s.id_estudiante,
        id_expediente: s.id_expediente ?? s.expediente_id,
        apellido1,
        apellido2,
        nombre,
        notas,
        nota_final: calculateAverage(notas),
      };
    });

    replace(mapped);
    setNumEstudiantes(mapped.length);
  }, [studentsData, modulesData, numAsignaturas, replace, calculateAverage]);

  // autofill marks
  useEffect(() => {
    if (!selectedModuleCodes?.length) return;
    const rows = form.getValues("students");
    if (!rows?.length) return;

    let changed = false;

    const next = rows.map((st: any) => {
      const sid = st?.id_estudiante as number | undefined;
      const historicas = sid ? notasByStudent.get(sid) : undefined;         // mejores aprobadas históricas
      const actuales = sid ? gradeByStudentCode.get(sid) : undefined;      // notas del expediente (aprobadas o no)

      const notas = st.notas.map((cell: any, colIdx: number) => {
        const code = selectedModuleCodes[colIdx];
        if (!code) return cell;

        // si ya hay algo escrito por el usuario, respétalo
        const isEmptyOrNE = cell == null || cell === "" || cell === "NE";
        if (!isEmptyOrNE) return cell;

        // 1) prefiero la nota REAL del expediente actual (puede ser suspensa)
        const nActual = actuales?.[code] as Nota | undefined;
        if (nActual) return nActual;

        // 2) si no hay actual, usa la mejor aprobada histórica
        const nHist = historicas?.[code] as Nota | undefined;
        if (nHist && isPassingNota(nHist)) return nHist;

        // 3) si no hay nada: NE
        return "NE";
      });

      const nf = calculateAverage(notas);
      if (JSON.stringify(notas) !== JSON.stringify(st.notas) || nf !== st.nota_final) changed = true;
      return { ...st, notas, nota_final: nf };
    });

    if (changed) {
      form.setValue("students", next, { shouldDirty: true });
    }
  }, [selectedModuleCodes, notasByStudent, gradeByStudentCode, form, calculateAverage]);

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
        // 1) PATCH de notas en el expediente actual
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

          selectedModuleCodes.forEach((code, colIdx) => {
            if (!code) return;
            const modId = modIdByCode.get(code);
            if (!modId) return;

            if (enrolledSet && !enrolledSet.has(code)) return;

            const raw = st.notas[colIdx];
            const nota: Nota | null = raw == null || raw === "" ? "NE" : (raw as Nota);

            patchJobs.push(() => patchNota(expedienteId, modId, nota));
          });
        });

        const patchRes = await runBatches(patchJobs, 10);

        // 2) Crear expediente Extraordinario + matrículas de suspendidas (solo si estamos en Ordinaria)
        let extraPlanned = 0;          // nº de estudiantes con suspensas (a los que intentaremos crear Extraordinaria)
        let extraEnrollmentsPlanned = 0; // nº total de matrículas extra a crear

        const parsedYear = parseSchoolYear(selectedAnioEscolar);
        if (!parsedYear) throw new Error("Año escolar inválido");

        const extraJobs: Array<() => Promise<any>> = [];

        if (selectedConvocatoria === "Ordinaria") {
          values.students.forEach((st, rowIdx) => {
            const sid =
              (st as any).id_estudiante ?? studentsData?.[rowIdx]?.id_estudiante;
            if (!sid) return;

            // ← set de códigos en los que SÍ está matriculado el alumno (solo si la query terminó OK)
            const enrolledSet = enrolledCodesByStudent.get(sid);

            // módulos suspensos EN LOS QUE ESTABA MATRICULADO
            const failedModIds: number[] = [];

            selectedModuleCodes.forEach((code, colIdx) => {
              if (!code) return;

              // 🔒 Solo considerar módulos con matrícula confirmada
              // (si la info de matrículas aún no llegó, no movemos nada a Extra para ese módulo)
              if (!enrolledSet || !enrolledSet.has(code)) return;

              const modId = modIdByCode.get(code);
              if (!modId) return;

              const raw = st.notas[colIdx] ?? "NE";
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

        // 🔄 Invalidate/refetch everything relevant that’s active on screen
        await Promise.allSettled([
          // Current students list
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

          // If you created Extraordinaria records, nudge that list too
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

          // Enrollments (all rid/sid variants)
          queryClient.invalidateQueries({
            queryKey: ["enrollments-by-record"],
            refetchType: "active",
          }),

          // Best grades per student/cycle
          queryClient.invalidateQueries({
            queryKey: ["notas-altas"],
            refetchType: "active",
          }),
        ]);

        return {
          ok: patchRes.ok,
          fail: patchRes.fail,
          missingExpedientes,
          extraStudents: extraPlanned,
          extraCreated: extraRes.ok,         // estudiantes para los que se creó Extraordinaria correctamente
          extraFailed: extraRes.fail,
          extraEnrollmentsPlanned,
        };
      } finally {
        setIsSaving(false);
      }
    };

    // Toast con estado de carga y resultado
    toast.promise(jobRunner(), {
      loading: "Guardando notas…",
      success: (r) => {
        const lines: string[] = [];
        lines.push(`Notas guardadas: ${r.ok} OK${r.fail ? `, ${r.fail} fallidas` : ""}.`);
        if (r.missingExpedientes?.length) {
          setTimeout(() => {
            toast.message(`Filas sin expediente: ${r.missingExpedientes.join(", ")}`);
          }, 0);
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

  // Swap or assign module to a column; if newCode already exists in another column → swap both columns
  const handleModuleSelect = React.useCallback(
    (colIndex: number, newCode: string) => {
      setSelectedModuleCodes(prev => {
        const currentCode = prev[colIndex] ?? "";
        if (newCode === currentCode) return prev;

        const otherCol = prev.findIndex(c => c === newCode);

        // We'll build the next codes array either swapping or assigning
        let next = [...prev];

        if (otherCol !== -1) {
          // --- SWAP COLUMNS (codes + notas) ---
          [next[colIndex], next[otherCol]] = [next[otherCol], next[colIndex]];

          const rows = form.getValues("students");
          const updated = rows.map((st: any) => {
            const notas = [...st.notas];
            [notas[colIndex], notas[otherCol]] = [notas[otherCol], notas[colIndex]];
            return { ...st, notas, nota_final: calculateAverage(notas) };
          });
          form.setValue("students", updated, { shouldDirty: true });
        } else {
          // --- JUST REASSIGN THIS COLUMN TO A NEW MODULE ---
          next[colIndex] = newCode;

          // OPTIONAL: clear this column to "NE" when you change to a brand-new módulo
          // to avoid grades lingering from the previous mapping.
          // Uncomment if you prefer this behavior:
          // const rows = form.getValues("students");
          // const updated = rows.map((st: any) => {
          //   const notas = [...st.notas];
          //   notas[colIndex] = "NE";
          //   return { ...st, notas, nota_final: calculateAverage(notas) };
          // });
          // form.setValue("students", updated, { shouldDirty: true });
        }

        return next;
      });
    },
    [form, calculateAverage, setSelectedModuleCodes]
  );

  // ==================== RENDER ====================
  return (
    <div className='min-w-0'>
      {/* FILTROS DE CABECERA */}
      <div className="mt-5 px-5">
        <div className="flex">
          <div className="w-[260px] shrink-0">
            <SelectField
              label="Ley Educativa"
              name="ley_educativa"
              value={selectedLey}
              onValueChange={setSelectedLey}
              placeholder="Seleccionar ley"
              options={
                leyesData.map((ley) => ({
                  value: `${ley.id_ley}`,
                  label: `${ley.nombre_ley}`
                }))
              }
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
              options={(ciclosData ?? []).map((c) => ({
                value: `${c.codigo}`,
                label: `${c.nombre} (${c.codigo})`,
              }))}
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
            <Select
              value={selectedConvocatoria}
              onValueChange={(v) => setSelectedConvocatoria(v as Convocatoria)}
            >
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
        </div>
      </div>

      {/* TARJETA PRINCIPAL CON LA TABLA Y CONTROLES */}
      <div className='min-w-0'>
        <div className='px-5 mt-2 min-w-0'>
          <Card>
            <CardHeader>
              <CardTitle>
                Evaluación de Estudiantes {isFetchingStudents ? "· Cargando…" : ""}
              </CardTitle>
              <CardDescription>Introduce manualmente los datos de evaluación de los alumnos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 min-w-0">
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
              <form onSubmit={form.handleSubmit(onSubmitSave)}>
                {/* WRAPPER: scroll interno en X e Y */}
                {/* WRAPPER con scroll interno y header sticky */}
                <div
                  className="relative isolate w-full overflow-x-auto overflow-y-auto overscroll-contain rounded-lg border"
                  style={{ maxHeight: '55vh' }}
                >
                  <Table
                    className="table-fixed" // importante: fija los anchos de columna
                    style={{ minWidth: `${baseWidth + nAsign * COL_W.modulo}px` }}
                  >
                    {/* HEADER */}
                    <TableHeader className="sticky top-0 z-40 bg-background/95 border-b">
                      <TableRow>
                        {/* # */}
                        <TableHead
                          className="sticky left-0 z-50 bg-background border-r"
                          style={{ width: COL_W.hash, minWidth: COL_W.hash, maxWidth: COL_W.hash }}
                        >
                          #
                        </TableHead>

                        {/* Apellido 1 */}
                        <TableHead
                          className="sticky z-50 bg-background border-r"
                          style={{ left: LEFT.ape1, width: COL_W.ape1, minWidth: COL_W.ape1, maxWidth: COL_W.ape1 }}
                        >
                          Apellido 1
                        </TableHead>

                        {/* Apellido 2 */}
                        <TableHead
                          className="sticky z-50 bg-background border-r"
                          style={{ left: LEFT.ape2, width: COL_W.ape2, minWidth: COL_W.ape2, maxWidth: COL_W.ape2 }}
                        >
                          Apellido 2
                        </TableHead>

                        {/* Nombre*/}
                        <TableHead
                          className="sticky z-50 bg-background border-r"
                          style={{ left: LEFT.nombre, width: COL_W.nombre, minWidth: COL_W.nombre, maxWidth: COL_W.nombre }}
                        >
                          Nombre
                        </TableHead>

                        {/* Módulos dinámicos */}
                        {Array.from({ length: nAsign }, (_, i) => (
                          <TableHead key={i} className="text-center"
                            style={{ width: COL_W.modulo, minWidth: COL_W.modulo, maxWidth: COL_W.modulo }}
                          >
                            <div>{i + 1}</div>
                            <SelectField
                              label=""
                              name={`module_col_${i}`}
                              value={selectedModuleCodes[i] || ""}
                              onValueChange={(value) => handleModuleSelect(i, value)}
                              placeholder="Seleccionar módulo"
                              width={COL_W.modulo}
                              options={modulesData.map((m) => ({ value: m.codigo_modulo, label: m.nombre }))}
                            />
                          </TableHead>
                        ))}

                        {/* Media */}
                        <TableHead className="text-center bg-muted"
                          style={{ width: COL_W.media, minWidth: COL_W.media, maxWidth: COL_W.media }}
                        >
                          Media
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    {/* BODY */}
                    <TableBody>
                      {fields.map((field, studentIndex) => (
                        <TableRow key={field.id}>
                          {/* # */}
                          <TableCell
                            className="sticky left-0 z-30 bg-background border-r text-center font-medium"
                            style={{ width: COL_W.hash, minWidth: COL_W.hash, maxWidth: COL_W.hash }}
                          >
                            {studentIndex + 1}
                          </TableCell>

                          {/* Apellido 1 */}
                          <TableCell
                            className="sticky z-30 bg-background border-r"
                            style={{ left: LEFT.ape1, width: COL_W.ape1, minWidth: COL_W.ape1, maxWidth: COL_W.ape1 }}
                          >
                            <Input
                              {...form.register(`students.${studentIndex}.apellido1`)}
                              readOnly
                              tabIndex={-1}
                              title="Campo bloqueado"
                              className={`${form.formState.errors.students?.[studentIndex]?.apellido1 ? "border-red-500" : ""} bg-muted/50 cursor-not-allowed focus-visible:ring-0 focus-visible:ring-offset-0`}
                            />
                          </TableCell>

                          {/* Apellido 2 */}
                          <TableCell
                            className="sticky z-30 bg-background border-r"
                            style={{ left: LEFT.ape2, width: COL_W.ape2, minWidth: COL_W.ape2, maxWidth: COL_W.ape2 }}
                          >
                            <Input
                              {...form.register(`students.${studentIndex}.apellido2`)}
                              readOnly
                              tabIndex={-1}
                              title="Campo bloqueado"
                              className={`${form.formState.errors.students?.[studentIndex]?.apellido2 ? "border-red-500" : ""} bg-muted/50 cursor-not-allowed focus-visible:ring-0 focus-visible:ring-offset-0`}
                            />
                          </TableCell>

                          {/* Nombre */}
                          <TableCell
                            className="sticky z-30 bg-background border-r border-gray-200"
                            style={{ left: LEFT.nombre, width: COL_W.nombre, minWidth: COL_W.nombre, maxWidth: COL_W.nombre }}
                          >
                            <Input
                              {...form.register(`students.${studentIndex}.nombre`)}
                              readOnly
                              tabIndex={-1}
                              title="Campo bloqueado"
                              className={`${form.formState.errors.students?.[studentIndex]?.nombre ? "border-red-500" : ""} bg-muted/50 cursor-not-allowed focus-visible:ring-0 focus-visible:ring-offset-0`}
                            />
                          </TableCell>

                          {/* Notas (no sticky) */}
                          {Array.from({ length: nAsign }, (_, gradeIndex) => (
                            <TableCell
                              key={gradeIndex}
                              style={{ width: COL_W.modulo, minWidth: COL_W.modulo, maxWidth: COL_W.modulo }}
                            >
                              <Controller
                                control={form.control}
                                name={`students.${studentIndex}.notas.${gradeIndex}`}
                                render={({ field }) => {
                                  const sid =
                                    (form.getValues(`students.${studentIndex}.id_estudiante`) as number | undefined) ??
                                    (fields[studentIndex] as any)?.id_estudiante;

                                  const code = selectedModuleCodes[gradeIndex];

                                  const passedLocked = !!sid && !!code && lockedByStudent.get(sid)?.has(code);
                                  const enrolledSet = sid ? enrolledCodesByStudent.get(sid) : undefined;
                                  const isEnrolled = enrolledSet ? enrolledSet.has(code) : true;
                                  const isLocked = Boolean(passedLocked || !isEnrolled);

                                  // nota “fetchada” del expediente actual (puede ser suspensa)
                                  const fetchedNota = (sid && code) ? gradeByStudentCode.get(sid)?.[code] : undefined;

                                  // valor que se muestra (escribimos en el form si difiere)
                                  const current = (field.value == null || field.value === "") ? (fetchedNota ?? "NE") : field.value;
                                  if (current !== field.value) {
                                    queueMicrotask(() => field.onChange(current));
                                  }

                                  const opts =
                                    (typeof current === "string" && current.startsWith("CV"))
                                      ? NOTA_OPTIONS
                                      : NOTA_OPTIONS_NO_CV;

                                  const highlightFetchedFail =
                                    fetchedNota != null &&
                                    fetchedNota !== "NE" &&
                                    !isPassingNota(fetchedNota);

                                  return (
                                    <NotaCell
                                      value={current}
                                      options={opts}
                                      disabled={isLocked}
                                      disabledTitle={
                                        passedLocked
                                          ? "Módulo ya aprobado"
                                          : (enrolledSet ? "Sin matrícula en este módulo" : undefined)
                                      }
                                      highlight={highlightFetchedFail}
                                      onChange={(val) => {
                                        if (isLocked) return;
                                        field.onChange(val);
                                        const grades = form.getValues(`students.${studentIndex}.notas`);
                                        const avg = calculateAverage(grades);
                                        form.setValue(`students.${studentIndex}.nota_final`, avg, { shouldDirty: true });
                                      }}
                                    />
                                  );
                                }}
                              />
                            </TableCell>
                          ))}

                          {/* Media */}
                          <TableCell className="bg-muted text-center font-medium"
                            style={{ width: COL_W.media, minWidth: COL_W.media, maxWidth: COL_W.media }}
                          >
                            {form.watch(`students.${studentIndex}.nota_final`)?.toFixed(2) || "0.00"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* ACCIONES: AÑADIR + GUARDAR */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between pt-5">
                  <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
                    <Save />{"Guardar Evaluación"}
                  </Button>
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

// ==================== CELDA DE NOTAS (SELECT) ====================
const NotaCell = React.memo(function NotaCell({
  value,
  onChange,
  options,
  disabled = false,
  disabledTitle,
  highlight = false, // << NUEVO
}: {
  value: string | number | null | undefined;
  onChange: (val: string) => void;
  options: readonly Nota[];
  disabled?: boolean;
  disabledTitle?: string;
  highlight?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const v = value == null || value === "" ? "" : String(value);
  return (
    <div className="h-4 flex items-center justify-center">
      <Select
        open={disabled ? false : open}
        onOpenChange={disabled ? () => { } : setOpen}
        value={v}
        onValueChange={(val) => { if (!disabled) onChange(val); }}
      >
        <SelectTrigger
          className={`h-9 w-28 text-center ${disabled ? "opacity-60 cursor-not-allowed" : ""} ${highlight ? "text-red-600 bg-red-50 border-red-300" : ""
            }`}
          disabled={disabled}
          title={disabled ? disabledTitle : undefined}
        >
          <SelectValue placeholder="-">{v ? v : undefined}</SelectValue>
        </SelectTrigger>
        {!disabled && open && (
          <SelectContent className="max-h-64">
            {options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        )}
      </Select>
    </div>
  );
});