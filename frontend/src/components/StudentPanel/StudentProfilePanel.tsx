// ===============================================================
// =========================== IMPORTS ===========================
// ===============================================================
import React, { useState, useMemo, useEffect } from "react" // CHANGED: +useEffect
import { useTransition } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import SelectField from "../StudentTable/SelectField"
import PdfCertificateGeneratorButton from "@/components/StudentPanel/PdfGeneratorButton"
import AddExtraordinariaButton from "@/components/StudentPanel/AddExtraordinariaButton";
import { DeleteRecordCascadeButton } from "./deleteRecordCascade";
import { DeleteModuleCascadeButton } from "./deleteModuleCascade";
import TextareaForm from "./ObservacionesArea"

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

import { Badge } from "@/components/ui/badge"
import DatePicker from "@/components/StudentTable/DatePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Pencil, X, Plus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

import { api } from "@/lib/api"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { RecordExtended, FullStudentData } from "@/types"
import { toast } from "sonner"

// ===============================================================
// ========== FUNCIONES AUXILIARES / LLAMADAS A LA API ===========
// ===============================================================
async function getFullStudentData(id: number): Promise<FullStudentData> {
  const response = await api.students.fullInfo[':id'].$get({ param: { id: id.toString() } });

  const data = await response.json();
  const raw = data.fullInfo;

  const student = {
    ...raw.student,
    fecha_nac: new Date(raw.student.fecha_nac)
  }

  const records = raw.records.map((r: any) => ({
    ...r,
    fecha_pago_titulo: r.fecha_pago_titulo ? new Date(r.fecha_pago_titulo) : undefined
  }))

  return { student, records };
}

async function patchFechaPagoTitulo(expediente_id: number, fecha_pago_titulo: Date | undefined) {
  const response = await api.records[":id"].fecha_pago_titulo.$patch({
    param: { id: String(expediente_id) },
    json: { fecha_pago_titulo }
  });

  if (!response.ok) {
    throw new Error("No se puedo actualizar la fecha de pago del título");
  }

  return response.json();
}

async function patchDarBajaEstudianteCiclo(id_estudiante: number, id_ciclo: number, dado_baja: boolean) {
  const response = await api.records.darBaja[":id_estudiante"][":id_ciclo"].$patch({
    param: { id_estudiante: String(id_estudiante), id_ciclo: String(id_ciclo) },
    json: { dado_baja }
  });

  if (!response.ok) {
    throw new Error("No se pudo actualizar el campo dado_baja del expediente");
  }

  return response.json();
}

export async function deleteRecordCascade(expedienteId: number) {
  const res = await api.records.deleteComplete[":id_record"].$delete({
    param: { id_record: String(expedienteId) }
  });

  if (!res.ok) throw new Error("No se pudo borrar el expediente.");

  return res.json() as Promise<{
    deleted: Array<import("@/types").Record>;
    count: number;
  }>;
}

const patchStudentPersonal = async (studentId: number, body: any) => {
  const res = await api.students[":id"].$patch({
    param: { id: String(studentId) },
    json: body,
  });
  if (!res.ok) {
    if (res.status === 409) throw new Error("El identificador legal ya existe.");
    else throw new Error("No se pudo actualizar el estudiante. (puede ser que el ID legal ya exista en la bd)");
  }
  return res.json();
};

async function addModuleToRecord(expedienteId: number, moduloId: number) {
  const res = await api.enrollments.addModule[":id_expediente"][":id_modulo"].$post({
    param: {
      id_expediente: String(expedienteId),
      id_modulo: String(moduloId),
    },
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // por si viene sin body
  }

  if (!res.ok) {
    const msg = data?.error || "No se pudo añadir el módulo al expediente.";
    throw new Error(msg);
  }

  return data;
}

type ModuleSummary = {
  id_modulo: number;
  codigo_modulo: string;
  nombre: string;
  curso: string;
};

async function getModulesByCycle(cycleCode: string): Promise<ModuleSummary[]> {
  if (!cycleCode) return [];

  // Ajusta "1º" y "2º" si en tu BD son "1", "2" o similar
  const [res1, res2] = await Promise.all([
    api.modules.cycle[":cycle_code"].curso[":curso"].$get({
      param: { cycle_code: cycleCode, curso: "1" },
    }),
    api.modules.cycle[":cycle_code"].curso[":curso"].$get({
      param: { cycle_code: cycleCode, curso: "2" },
    }),
  ]);

  const data1 = await res1.json();
  const data2 = await res2.json();

  return [
    ...(data1.modulos ?? []),
    ...(data2.modulos ?? []),
  ] as ModuleSummary[];
}

// ========================================================================

const PASS_NOTAS = new Set([
  '5', '6', '7', '8', '9', '10', '10-MH', '10-Matr. Honor',
  'APTO', 'CV', 'CV-5', 'CV-6', 'CV-7', 'CV-8', 'CV-9', 'CV-10', 'CV-10-MH',
  'TRAS-5', 'TRAS-6', 'TRAS-7', 'TRAS-8', 'TRAS-9', 'TRAS-10', 'TRAS-10-MH',
  'EX'
]);

// PARA EL ENDPOINT DE LAS NOTAS

const NOTA_OPTIONS = [
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "10-MH", "10-Matr. Honor",
  "CV", "CV-5", "CV-6", "CV-7", "CV-8", "CV-9", "CV-10", "CV-10-MH",
  "TRAS-5", "TRAS-6", "TRAS-7", "TRAS-8", "TRAS-9", "TRAS-10", "TRAS-10-MH",
  "RC", "NE", "APTO", "NO APTO", "EX"
] as const;

const NOTA_OPTIONS_NO_CV = NOTA_OPTIONS.filter(o => !o.startsWith("CV")) as Nota[];

type Nota = typeof NOTA_OPTIONS[number];

// ===== ID helpers (DNI/NIE) =====
const DNI_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE" as const;

function calculateDNILetter(digits8: string): string {
  // digits8: exactamente 8 dígitos
  const n = Number(digits8);
  if (!/^\d{8}$/.test(digits8) || !Number.isFinite(n)) return "";
  return DNI_LETTERS[n % 23];
}

function validateDNI(value: string): string | null {
  const v = value.toUpperCase().replace(/\s+/g, "");
  const dniRegex = /^[0-9]{8}[A-Z]$/;
  if (!dniRegex.test(v)) return "El DNI debe tener 8 dígitos y una letra mayúscula.";
  const digits = v.slice(0, 8);
  const letter = v[8];
  const expected = calculateDNILetter(digits);
  return letter === expected ? null : "DNI incorrecto (letra de control no coincide).";
}

function validateNIE(value: string): string | null {
  const v = value.toUpperCase().replace(/\s+/g, "");
  const nieRegex = /^[XYZ][0-9]{7}[A-Z]$/;
  if (!nieRegex.test(v)) return "El NIE debe empezar por X, Y o Z, seguido de 7 dígitos y una letra mayúscula.";
  const map: Record<string, string> = { X: "0", Y: "1", Z: "2" };
  const prefix = map[v[0]];
  const digits8 = prefix + v.slice(1, 8); // 8 dígitos
  const letter = v[8];
  const expected = calculateDNILetter(digits8);
  return letter === expected ? null : "NIE incorrecto (lógica numérica/letra de control).";
}

function validatePassport(_value: string): string | null {
  // España no tiene un formato único público para pasaporte -> no validamos formato estricto
  return null;
}

function validateLegalId(kind: "dni" | "nie" | "pasaporte" | "", value: string): string | null {
  if (!kind) return "Seleccione un tipo de ID.";
  if (!value) return "Introduzca un identificador.";
  switch (kind) {
    case "dni": return validateDNI(value);
    case "nie": return validateNIE(value);
    case "pasaporte": return validatePassport(value);
    default: return "Tipo de ID no reconocido.";
  }
}

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

// ===============================================================
// ====================== TIPOS / PROPS ==========================
// ===============================================================
interface StudentProfilePanelProps {
  id: number;
  isOpen: boolean;
  onClose: () => void;
}

// ===============================================================
// ============ COMPONENTE <StudentProfilePanel /> ===============
// ===============================================================
const StudentProfilePanel: React.FC<StudentProfilePanelProps> = ({ id, isOpen, onClose }) => {

  // -------------------- ESTADO LOCAL ---------------------------
  const [selectedCycle, setSelectedCycle] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedConvocatoria, setSelectedConvocatoria] = useState("");
  const [selectedFechaPagoTitulo, setSelectedFechaPagoTitulo] = useState<Date | null>(null);
  // para las celdas de las notas
  const [isPendingEdit, startTransition] = useTransition();

  // NEW: edición de notas
  const [isEditingNotas, setIsEditingNotas] = useState(false);
  const [editedNotas, setEditedNotas] = useState<Record<string, string | number | null>>({});
  const [justCreatedExtra, setJustCreatedExtra] = useState(false);
  const [confirmingBaja, setConfirmingBaja] = useState(false);

  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [formPersonal, setFormPersonal] = useState({
    nombre: "",
    apellido_1: "",
    apellido_2: "",
    sexo: "Indefinido" as "Masculino" | "Femenino" | "Indefinido",
    tipo_id_legal: "" as "dni" | "nie" | "pasaporte" | "",
    id_legal: "",
    fecha_nac: null as Date | null,
    num_tfno: "",
  });

  // NEW: error de ID legal + valor normalizado
  const [idError, setIdError] = useState<string | null>(null);

  const [newModuleCode, setNewModuleCode] = useState("");

  const [selectedModuleIdToAdd, setSelectedModuleIdToAdd] = useState<string>("");

  // -------------------- MUTATIONS ------------------------------

  const queryClient = useQueryClient();

  type PatchVars = {
    expedienteId: number;
    selectedFechaPagoTitulo: Date | null;
    notasUpdates: { module_id: number; nota: Nota | null }[];
  };

  const mutation = useMutation<any, Error, PatchVars>({
    mutationFn: async ({ expedienteId, selectedFechaPagoTitulo, notasUpdates }) => {
      const ops: Promise<any>[] = [];

      // Solo si cambió la fecha
      if (fechaChanged) {
        ops.push(patchFechaPagoTitulo(expedienteId, selectedFechaPagoTitulo ?? undefined));
      }

      // Varias notas en paralelo
      if (notasUpdates.length) {
        ops.push(...notasUpdates.map(u => patchNota(expedienteId, u.module_id, u.nota)));
      }

      if (!ops.length) return true; // nada que hacer
      await Promise.all(ops);
      return true;
    },
    onSuccess: () => {
      toast.success("Convocatoria modificada correctamente.");
      setIsEditingNotas(false);

      queryClient.invalidateQueries({ queryKey: ['full-student-data', fullData?.student.id_estudiante] });
      // volver a calcular los "can-approve" de este alumno
      queryClient.invalidateQueries({ queryKey: ['can-approve', id] });
      // Opcional: si quieres que se disparen inmediatamente incluso si no están “stale”
      // (y aunque tengan staleTime grande):
      queryClient.refetchQueries({ queryKey: ['can-approve', id], type: 'active' });
      // volver a calcular los años no cursables
      queryClient.invalidateQueries({ queryKey: ['can-enroll-period', id] });
      queryClient.refetchQueries({ queryKey: ['can-enroll-period', id], type: 'active' });
      queryClient.invalidateQueries({ queryKey: ["students-by-filter"] });
      queryClient.refetchQueries({ queryKey: ["students-by-filter"], type: "active" });

      // forzar refresco de "notas-altas"
      const cicloId = currentRecord?.id_ciclo ?? baseRecordCore?.id_ciclo;
      if (cicloId != null) {
        // invalida solo las queries del alumno + ciclo afectado
        queryClient.invalidateQueries({ queryKey: ['notas-altas', id, cicloId] });
        queryClient.refetchQueries({ queryKey: ['notas-altas', id, cicloId], type: 'active' });
      } else {
        // si no tienes el ciclo a mano, invalida por prefijo (todas las de ese alumno)
        queryClient.invalidateQueries({ queryKey: ['notas-altas', id] });
        queryClient.refetchQueries({ queryKey: ['notas-altas', id], type: 'active' });
      }
    },
    onError: (err: any) =>
      toast.error(err.message ?? 'No ha sido posible modificar la convocatoria.')
  });

  // --- mutación para dar de baja/alta en ciclo
  const bajaMutation = useMutation({
    mutationFn: async (desired: boolean) => {
      const studentId = fullData?.student.id_estudiante ?? id;
      if (!studentId || !cicloIdForAction) throw new Error("Selecciona ciclo válido.");
      return patchDarBajaEstudianteCiclo(studentId, cicloIdForAction, desired);
    },
    onSuccess: (_res, desired) => {
      toast.success(desired ? "Estudiante dado de baja en el ciclo." : "Estudiante dado de alta en el ciclo.");
      setConfirmingBaja(false);
      // refrescos típicos
      const sid = fullData?.student.id_estudiante ?? id;
      queryClient.invalidateQueries({ queryKey: ["full-student-data", sid] });
      queryClient.refetchQueries({ queryKey: ["full-student-data", sid], type: "active" });

      const cicloId = currentRecord?.id_ciclo ?? baseRecordCore?.id_ciclo ?? cicloIdForAction ?? undefined;
      if (cicloId != null) {
        queryClient.invalidateQueries({ queryKey: ["notas-altas", id, cicloId] });
        queryClient.refetchQueries({ queryKey: ["notas-altas", id, cicloId], type: "active" });
      } else {
        queryClient.invalidateQueries({ queryKey: ["notas-altas", id] });
        queryClient.refetchQueries({ queryKey: ["notas-altas", id], type: "active" });
      }
      queryClient.invalidateQueries({ queryKey: ["can-approve", id] });
      queryClient.refetchQueries({ queryKey: ["can-approve", id], type: "active" });
      queryClient.invalidateQueries({ queryKey: ["can-enroll-period", id] });
      queryClient.refetchQueries({ queryKey: ["can-enroll-period", id], type: "active" });
    },
    onError: (err: any) => toast.error(err?.message ?? "No se pudo cambiar el estado del ciclo.")
  });

  type PersonalChanges =
    Omit<Partial<FullStudentData["student"]>, "fecha_nac"> & {
      fecha_nac?: Date | null;
    };

  // what you send to the API
  type ApiPersonalChanges =
    Omit<Partial<FullStudentData["student"]>, "fecha_nac"> & { fecha_nac?: Date | null };

  // what you apply in cache (no nulls for fecha_nac)
  type CachePersonalPatch =
    Omit<Partial<FullStudentData["student"]>, "fecha_nac"> & { fecha_nac?: Date };

  const computePersonalChanges = (s: FullStudentData["student"], f = formPersonal): PersonalChanges => {
    const changes: PersonalChanges = {};
    const cmp = (a: any, b: any) => (a ?? null) === (b ?? null);

    if (!cmp(f.nombre, s.nombre)) changes.nombre = f.nombre;
    if (!cmp(f.apellido_1, s.apellido_1)) changes.apellido_1 = f.apellido_1;
    if (!cmp(f.apellido_2 || null, s.apellido_2 || null)) changes.apellido_2 = f.apellido_2 || null;
    if (!cmp(f.sexo, s.sexo)) changes.sexo = f.sexo;

    const tipoNormalized = (f.tipo_id_legal || "") as any;
    const tipoCurrent = String(s.tipo_id_legal || "").toLowerCase();
    if (!cmp(tipoNormalized, tipoCurrent)) changes.tipo_id_legal = tipoNormalized;

    if (!cmp(f.id_legal, s.id_legal)) changes.id_legal = f.id_legal;

    const fNew = formPersonal.fecha_nac ? new Date(formPersonal.fecha_nac) : null;
    const fOld = fullData!.student.fecha_nac ? new Date(fullData!.student.fecha_nac) : null;
    if ((fNew?.getTime() ?? null) !== (fOld?.getTime() ?? null)) {
      changes.fecha_nac = fNew; // Date | null (API shape)
    }

    return changes;
  };

  // ------- mutación para cambiar los datos personales -------
  const personalMutation = useMutation({
    mutationFn: async (changes: ApiPersonalChanges) => {
      if (!fullData?.student || Object.keys(changes).length === 0) return true;
      return patchStudentPersonal(fullData.student.id_estudiante, changes); // API accepts null
    },
    onMutate: async (changes) => {
      await queryClient.cancelQueries({ queryKey: ["full-student-data", id] });
      const prev = queryClient.getQueryData<FullStudentData>(["full-student-data", id]);

      if (prev) {
        // derive the cache patch without nulls
        const cachePatch: CachePersonalPatch = { ...changes } as any;
        if ("fecha_nac" in changes && changes.fecha_nac === null) {
          delete (cachePatch as any).fecha_nac; // don’t apply null into a non-null field
        }
        const next: FullStudentData = {
          ...prev,
          student: { ...prev.student, ...cachePatch },
        };
        queryClient.setQueryData(["full-student-data", id], next);
      }
      return { prev };
    },
    onError: (err, _changes, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["full-student-data", id], ctx.prev);
      toast.error(err?.message ?? "No se pudo actualizar el estudiante.");
    },
    onSuccess: () => {
      toast.success("Datos personales actualizados.");
      setIsEditingPersonal(false);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["full-student-data", id], refetchType: "inactive" });
    },
  });

  const addModuleMutation = useMutation({
    mutationFn: async (vars: { expedienteId: number; moduloId: number }) => {
      return addModuleToRecord(vars.expedienteId, vars.moduloId);
    },
    onSuccess: (_data, _vars) => {
      toast.success("Módulo añadido al expediente.");
      setSelectedModuleIdToAdd("");

      const sid = fullData?.student.id_estudiante ?? id;

      // refrescamos datos del alumno
      queryClient.invalidateQueries({ queryKey: ["full-student-data", sid] });
      queryClient.refetchQueries({ queryKey: ["full-student-data", sid], type: "active" });

      // refrescamos notas-altas
      const cicloId = currentRecord?.id_ciclo ?? baseRecordCore?.id_ciclo ?? null;
      if (cicloId != null) {
        queryClient.invalidateQueries({ queryKey: ["notas-altas", id, cicloId] });
        queryClient.refetchQueries({ queryKey: ["notas-altas", id, cicloId], type: "active" });
      } else {
        queryClient.invalidateQueries({ queryKey: ["notas-altas", id] });
        queryClient.refetchQueries({ queryKey: ["notas-altas", id], type: "active" });
      }

      queryClient.invalidateQueries({ queryKey: ["can-approve", id] });
      queryClient.refetchQueries({ queryKey: ["can-approve", id], type: "active" });
      queryClient.invalidateQueries({ queryKey: ["can-enroll-period", id] });
      queryClient.refetchQueries({ queryKey: ["can-enroll-period", id], type: "active" });
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "No se puede añadir el módulo al expediente.");
    },
  });

  // -------------------- QUERY PRINCIPAL ------------------------
  const { data: fullData } = useQuery({
    queryKey: ['full-student-data', id],
    queryFn: ({ queryKey }) => {
      const [_key, studentId] = queryKey;
      return getFullStudentData(studentId as number);
    }
  });

  const { data: modulesForCycle = [], isLoading: isLoadingModules } = useQuery<ModuleSummary[]>({
    queryKey: ["modules-by-cycle", selectedCycle],
    queryFn: async () => {
      if (!selectedCycle) return [];
      return getModulesByCycle(selectedCycle);
    },
    enabled: !!selectedCycle,
  });

  // ------------------ DERIVAR OPCIONES -------------------------
  // -- 1. Ciclos disponibles ------------------------------------
  const seen = new Set();
  const cycleOptions = (fullData?.records ?? [])
    .filter(rec => !seen.has(rec.ciclo_codigo) && seen.add(rec.ciclo_codigo))
    .map(rec => ({
      value: String(rec.ciclo_codigo),
      label: String(rec.ciclo_codigo),
      record: rec
    }))

  // -- 2. Años escolares disponibles ----------------------------
  const yearOptions = useMemo(() => {
    if (!selectedCycle) {
      return [{ value: "invalido", label: "Selecciona antes un ciclo." }];
    }

    const seen = new Set<string>();
    const years: { start: number; end: number }[] = [];

    (fullData?.records ?? [])
      .filter((r) => r.ciclo_codigo === selectedCycle)
      .forEach((r) => {
        const key = `${r.ano_inicio}-${r.ano_fin}`;
        if (!seen.has(key)) {
          seen.add(key);
          years.push({ start: r.ano_inicio, end: r.ano_fin });
        }
      });

    // ⬅️ aquí los ordenas ascendentemente
    years.sort((a, b) => (a.start - b.start) || (a.end - b.end));

    return years.map(({ start, end }) => {
      const v = `${start}-${end}`;
      return { value: v, label: v };
    });
  }, [fullData, selectedCycle]);

  // ================== LÓGICA DE LA CONVOCATORIA EXTRAORDINARIA ===================
  // --- 2.bis) Encontrar el expediente ORDINARIA del ciclo+año seleccionados
  const ordinariaRecord = useMemo(() => {
    if (!fullData || !selectedCycle || !selectedYear) return null;
    const [ini, fin] = selectedYear.split("-").map(Number);
    return (
      fullData.records
        .filter(
          (r) =>
            r.ciclo_codigo === selectedCycle &&
            r.ano_inicio === ini &&
            r.ano_fin === fin &&
            r.convocatoria === "Ordinaria"
        )
        .sort((a, b) => b.id_expediente - a.id_expediente)[0] ?? null
    );
  }, [fullData, selectedCycle, selectedYear]);

  // COMPRUBEA QUE NINGÚN MÓDULO NO TENA NE o AM
  const hasAM = useMemo(() => {
    if (!ordinariaRecord) return false;
    return (ordinariaRecord.enrollments ?? []).some((m: any) => {
      const nota = (m?.nota ?? "").toString().trim();
      return nota === "AM";
    });
  }, [ordinariaRecord]);


  // --- ¿Ya existe Extraordinaria para ese ciclo+año?
  const extraordinariaExists = useMemo(() => {
    if (!fullData || !selectedCycle || !selectedYear) return false;
    const [ini, fin] = selectedYear.split("-").map(Number);
    return fullData.records.some(
      (r) =>
        r.ciclo_codigo === selectedCycle &&
        r.ano_inicio === ini &&
        r.ano_fin === fin &&
        r.convocatoria === "Extraordinaria"
    );
  }, [fullData, selectedCycle, selectedYear]);

  // --- IDs de módulos suspendidos en la ORDINARIA
  const failingModuleIds = useMemo(() => {
    if (!ordinariaRecord) return [];
    const out: number[] = [];
    (ordinariaRecord.enrollments ?? []).forEach((m: any) => {
      const raw = m?.nota ?? "";
      const nota = raw === null || raw === undefined ? "" : String(raw).trim();
      const aprobado = nota
        ? PASS_NOTAS.has(nota)
        : false;
      // por si alguna nota numérica llegara como número en tu backend (defensivo)
      // if (!aprobado && /^\d+$/.test(nota) && parseInt(nota, 10) >= 5) aprobado = true;

      const moduleId: number | undefined = m.modulo_id ?? m.id_modulo ?? m.id;
      if (moduleId != null && !aprobado) out.push(moduleId);
    });
    return out;
  }, [ordinariaRecord]);

  // --- Datos mínimos del record base para crear la Extraordinaria
  const baseRecordCore = useMemo(() => {
    if (!ordinariaRecord) return null;
    // Asegúrate de que tu record trae id_ciclo
    if (ordinariaRecord.id_ciclo == null) return null;
    return {
      ano_inicio: ordinariaRecord.ano_inicio,
      ano_fin: ordinariaRecord.ano_fin,
      turno: ordinariaRecord.turno,
      id_ciclo: ordinariaRecord.id_ciclo,
    };
  }, [ordinariaRecord]);

  // ====================================================================

  // -- 3. Convocatorias disponibles -----------------------------
  const convocatoriaOptions = useMemo(() => {
    if (!selectedCycle || !selectedYear) return [{ value: "invalido", label: "Selecciona antes ciclo y curso." }];
    const seen = new Set<string>();
    return (fullData?.records ?? [])
      .filter((r) => r.ciclo_codigo === selectedCycle && `${r.ano_inicio}-${r.ano_fin}` === selectedYear)
      .filter((r) => {
        if (seen.has(r.convocatoria)) return false;
        seen.add(r.convocatoria);
        return true;
      })
      .map((r) => ({
        value: r.convocatoria,
        label: r.convocatoria,
      }));
  }, [fullData, selectedCycle, selectedYear]);

  // -- 4. Registros filtrados para mostrar ----------------------
  const filteredRecords = useMemo(() => {
    if (!fullData ||
      !selectedCycle ||
      !selectedYear ||
      !selectedConvocatoria) return [];

    return fullData.records.filter(r =>
      r.ciclo_codigo === selectedCycle &&
      `${r.ano_inicio}-${r.ano_fin}` === selectedYear &&
      r.convocatoria === selectedConvocatoria
    );
  }, [fullData, selectedCycle, selectedYear, selectedConvocatoria]);

  // -- 5. Sacar el ID del expediente ------------------------
  const selectedExpedienteId = useMemo(() => {
    if (!fullData || !selectedCycle || !selectedYear || !selectedConvocatoria) return null;

    const [ini, fin] = selectedYear.split("-").map(Number);

    const record = fullData.records
      .filter(r =>
        r.ciclo_codigo === selectedCycle &&
        r.ano_inicio === ini &&
        r.ano_fin === fin &&
        r.convocatoria === selectedConvocatoria
      )
      // Por si hubiera duplicados, coge el de id más alto
      .sort((a, b) => b.id_expediente - a.id_expediente)[0];

    return record?.id_expediente ?? null;
  }, [fullData, selectedCycle, selectedYear, selectedConvocatoria]);

  // NEW: record actual (para comparar cambios y precargar fecha)
  const currentRecord = useMemo(
    () => filteredRecords.find(r => r.id_expediente === selectedExpedienteId) ?? null,
    [filteredRecords, selectedExpedienteId]
  );

  // --- escoger cualquier id_ciclo del ciclo seleccionado (1º/2º da igual)
  const cicloIdForAction = useMemo(() => {
    if (currentRecord?.id_ciclo) return currentRecord.id_ciclo;
    if (baseRecordCore?.id_ciclo) return baseRecordCore.id_ciclo;
    return fullData?.records.find(r => r.ciclo_codigo === selectedCycle)?.id_ciclo ?? null;
  }, [currentRecord, baseRecordCore, fullData, selectedCycle]);

  // Si se cambia de ciclo/curso, resetea el flag local
  useEffect(() => { setJustCreatedExtra(false); }, [selectedCycle, selectedYear]);

  // NEW: cuando cambia la convocatoria seleccionada, precarga fecha y notas
  useEffect(() => {
    if (!currentRecord) {
      setSelectedFechaPagoTitulo(null);
      setEditedNotas({});
      setIsEditingNotas(false);
      return;
    }
    setSelectedFechaPagoTitulo(currentRecord.fecha_pago_titulo ?? null);

    const map: Record<string, string | number | null> = {};
    (currentRecord.enrollments ?? []).forEach((m: any) => {
      map[m.codigo_modulo] = m.nota ?? "";
    });
    setEditedNotas(map);
    setIsEditingNotas(false);
  }, [currentRecord]);

  useEffect(() => {
    if (!confirmingBaja) return;
    const t = setTimeout(() => setConfirmingBaja(false), 6000); // auto-cancel en 6s
    return () => clearTimeout(t);
  }, [confirmingBaja]);

  // detectar cambios en notas
  const isNota = (v: string): v is Nota =>
    (NOTA_OPTIONS as readonly string[]).includes(v as any);

  const notasUpdates = useMemo(() => {
    if (!currentRecord) return [];
    const out: { module_id: number; nota: Nota | null }[] = [];

    (currentRecord.enrollments ?? []).forEach((m: any) => {
      const nuevoRaw = editedNotas[m.codigo_modulo];
      const originalRaw = m.nota ?? "";

      const nuevo = (nuevoRaw == null ? "" : String(nuevoRaw)).trim();
      const original = String(originalRaw).trim();

      if (nuevo !== original) {
        // intenta resolver el id del módulo
        const moduleId: number | undefined = m.modulo_id ?? m.id_modulo ?? m.id;
        if (moduleId == null) return; // si no hay id, no intentamos parchear

        if (nuevo === "") {
          out.push({ module_id: moduleId, nota: null }); // limpiar nota
        } else if (isNota(nuevo)) {
          out.push({ module_id: moduleId, nota: nuevo }); // set Nota válida
        }
        // valores inválidos se ignoran silenciosamente
      }
    });

    return out;
  }, [currentRecord, editedNotas]);

  useEffect(() => {
    if (!fullData?.student) return;
    if (!isEditingPersonal) return;
    const s = fullData.student;
    setFormPersonal({
      nombre: s.nombre ?? "",
      apellido_1: s.apellido_1 ?? "",
      apellido_2: s.apellido_2 ?? "",
      sexo: (s.sexo as any) ?? "Indefinido",
      // normaliza a minúscula si tu backend lo guarda en mayúsculas
      tipo_id_legal: (String(s.tipo_id_legal || "").toLowerCase() as any) || "",
      id_legal: s.id_legal ?? "",
      fecha_nac: s.fecha_nac ? new Date(s.fecha_nac) : null,
      num_tfno: s.num_tfno ?? "",
    });
    const currentKind = (String(s.tipo_id_legal || "").toLowerCase() as "dni" | "nie" | "pasaporte" | "");
    setIdError(validateLegalId(currentKind, s.id_legal || ""));
  }, [fullData, isEditingPersonal]);

  // NEW: detectar cambio de fecha
  const fechaChanged = useMemo(() => {
    const a = currentRecord?.fecha_pago_titulo ?? null;
    const b = selectedFechaPagoTitulo ?? null;
    const ta = a instanceof Date ? a.getTime() : (a ? new Date(a as any).getTime() : null);
    const tb = b instanceof Date ? b.getTime() : null;
    return ta !== tb;
  }, [currentRecord, selectedFechaPagoTitulo]);

  // Ocultar botón si ya existe o si acabamos de crearla (optimista)
  const hideAddExtraBtn = useMemo(
    () => extraordinariaExists || justCreatedExtra,
    [extraordinariaExists, justCreatedExtra]
  );

  // --- ¿está de baja en el ciclo seleccionado?
  const isBajaCycle = useMemo(() => {
    if (!selectedCycle) return false;
    const recs = (fullData?.records ?? []).filter(r => r.ciclo_codigo === selectedCycle);
    return recs.some(r => r.dado_baja === true);
  }, [fullData, selectedCycle]);

  const isDirty = (notasUpdates.length > 0) || fechaChanged;

  // =============================================================
  // ============== MANEJADORES DE EVENTOS =======================
  // =============================================================
  const handleCycleChange = (value: string) => {
    setSelectedCycle(value);
    setSelectedYear(""); // reset year when cycle changes
    setSelectedConvocatoria("");
  };

  const handleYearChange = (value: string) => {
    setSelectedYear(value);
    setSelectedConvocatoria("Ordinaria");
  };

  const handleConvocatoriaChange = (value: string) => {
    setSelectedConvocatoria(value);
  };

  const handleFechaPagoTitulo = (fecha: Date | undefined) => {
    setSelectedFechaPagoTitulo(fecha ?? null);
  };

  // Year helpers
  const yearStr = (r: RecordExtended) => `${r.ano_inicio}-${r.ano_fin}`;
  const parseYearStr = (s: string) => s.split("-").map(Number) as [number, number];

  const getOrdinariaYearsAsc = React.useCallback((cycleCode: string) => {
    if (!fullData) return [] as string[];
    const seen = new Set<string>();
    const ord = fullData.records
      .filter(r => r.ciclo_codigo === cycleCode && r.convocatoria === "Ordinaria")
      .sort((a, b) => (a.ano_inicio - b.ano_inicio) || (a.ano_fin - b.ano_fin));

    const years = [] as string[];
    for (const r of ord) {
      const y = yearStr(r);
      if (!seen.has(y)) { seen.add(y); years.push(y); }
    }
    return years;
  }, [fullData]);

  const findPreviousOrdinariaYear = React.useCallback((cycleCode: string, currentYear: string) => {
    const years = getOrdinariaYearsAsc(cycleCode);
    const idx = years.indexOf(currentYear);
    if (idx > 0) return years[idx - 1];             // immediate previous
    if (years.length) return years[years.length - 1]; // fallback: latest remaining
    return null;
  }, [getOrdinariaYearsAsc]);

  const findModuleIdByCode = React.useCallback(
    (code: string): number | null => {
      if (!fullData || !selectedCycle) return null;

      const normalized = code.trim().toUpperCase();

      for (const rec of fullData.records) {
        if (rec.ciclo_codigo !== selectedCycle) continue;

        for (const m of rec.enrollments ?? []) {
          const cod = String(m.codigo_modulo ?? "").trim().toUpperCase();
          if (cod === normalized) {
            const moduleId: number | undefined = m.id_modulo;
            if (moduleId != null) return moduleId;
          }
        }
      }
      return null;
    },
    [fullData, selectedCycle]
  );


  const handleAfterDelete = React.useCallback((deleted: RecordExtended | null) => {
    if (!deleted) return;

    const cycleCode = deleted.ciclo_codigo;
    const deletedYear = `${deleted.ano_inicio}-${deleted.ano_fin}`;

    if (deleted.convocatoria === "Extraordinaria") {
      // Go to Ordinaria of the *same year* if exists; otherwise previous Ordinaria year.
      const ordExistsSameYear = !!fullData?.records.find(r =>
        r.ciclo_codigo === cycleCode &&
        r.convocatoria === "Ordinaria" &&
        r.ano_inicio === deleted.ano_inicio &&
        r.ano_fin === deleted.ano_fin
      );

      setSelectedCycle(cycleCode);

      if (ordExistsSameYear) {
        setSelectedYear(deletedYear);
        setSelectedConvocatoria("Ordinaria");
      } else {
        const prev = findPreviousOrdinariaYear(cycleCode, deletedYear);
        if (prev) {
          setSelectedYear(prev);
          setSelectedConvocatoria("Ordinaria");
        } else {
          // nothing left: clear
          setSelectedYear("");
          setSelectedConvocatoria("");
        }
      }
      setJustCreatedExtra(false); // ensure the Extra btn can reappear if needed
      return;
    }

    // Deleted was "Ordinaria" → go to previous Ordinaria year
    setSelectedCycle(cycleCode);
    const prev = findPreviousOrdinariaYear(cycleCode, deletedYear);
    if (prev) {
      setSelectedYear(prev);
      setSelectedConvocatoria("Ordinaria");
    } else {
      // If there is no other Ordinaria in this cycle, fallback to clear
      setSelectedYear("");
      setSelectedConvocatoria("");
    }
  }, [fullData, findPreviousOrdinariaYear]);

  const setField = <K extends keyof typeof formPersonal>(k: K, v: (typeof formPersonal)[K]) =>
    setFormPersonal(prev => ({ ...prev, [k]: v }));

  const TIPO_ID_OPTIONS = [
    { value: "dni", label: "DNI" },
    { value: "nie", label: "NIE" },
    { value: "pasaporte", label: "Pasaporte" },
  ] as const;

  const SEXO_OPTIONS = [
    { value: "Masculino", label: "Masculino" },
    { value: "Femenino", label: "Femenino" },
    { value: "Indefinido", label: "Indefinido" },
  ] as const;

  // =============================================================
  // ======================= RENDER UI ===========================
  // =============================================================
  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          setTimeout(() => {
            setSelectedCycle("");
            setSelectedYear("");
            setSelectedConvocatoria("");
            setIsEditingNotas(false);
            setEditedNotas({});
          }, 500);
        }
      }}
    >
      <SheetContent
        forceMount
        // stops “outside” closing (including portalled tooltips/popovers)
        onInteractOutside={(e) => e.preventDefault()}
        // optional: stop ESC from closing if that also bites you
        // onEscapeKeyDown={(e) => e.preventDefault()}
        className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl"
      >
        {/* ---------- CABECERA DEL PANEL ----------- */}
        <SheetHeader className="flex flex-row items-center justify-between pb-4 border-b-[1px]">
          <SheetTitle className="text-xl font-bold">Perfil del estudiante</SheetTitle>
          {/* Si no quieres texto visible, usa sr-only */}
          <SheetDescription className="sr-only">
            Panel para consultar y editar notas, fecha de pago del título y descargar certificados.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)] pr-4">
          <div className="space-y-6 pt-2">
            {/* =====================================================
                ============== TARJETA INFORMACIÓN PERSONAL =========
                ===================================================== */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Información personal</CardTitle>

                {!isEditingPersonal ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingPersonal(true)}
                    className="gap-1"
                  >
                    <Pencil className="h-3 w-3" />
                    Editar
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingPersonal(false)}
                      disabled={personalMutation.isPending}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        // NEW: validación dura antes de mutar
                        const kind = formPersonal.tipo_id_legal || "";
                        const err = validateLegalId(kind as any, formPersonal.id_legal);
                        setIdError(err);
                        if (err) {
                          toast.error(err);
                          return;
                        }

                        const s = fullData!.student;
                        const changes = computePersonalChanges(s);
                        if (Object.keys(changes).length === 0) {
                          toast("No hay cambios.");
                          return;
                        }
                        personalMutation.mutate(changes);
                      }}
                      disabled={personalMutation.isPending || !!idError}
                    >
                      Guardar
                    </Button>
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-3">
                {!isEditingPersonal ? (
                  // --- MODO LECTURA ---
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm font-medium text-muted-foreground">Nombre:</div>
                      <div>{fullData?.student.nombre}</div>

                      <div className="text-sm font-medium text-muted-foreground">Apellido 1:</div>
                      <div>{fullData?.student.apellido_1}</div>

                      <div className="text-sm font-medium text-muted-foreground">Apellido 2:</div>
                      <div>{fullData?.student.apellido_2 || "-"}</div>

                      <div className="text-sm font-medium text-muted-foreground">Sexo:</div>
                      <div>{fullData?.student.sexo}</div>

                      <div className="text-sm font-medium text-muted-foreground">Tipo de ID legal:</div>
                      <div>{String(fullData?.student.tipo_id_legal || "").toUpperCase()}</div>

                      <div className="text-sm font-medium text-muted-foreground">ID legal:</div>
                      <div>{fullData?.student.id_legal}</div>

                      <div className="text-sm font-medium text-muted-foreground">Fecha de nacimiento:</div>
                      <div>{
                        fullData?.student.fecha_nac
                          ? new Date(fullData.student.fecha_nac).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
                          : ""
                      }</div>

                      <div className="text-sm font-medium text-muted-foreground">Número de expediente:</div>
                      <div>{fullData?.student.id_estudiante}</div>

                      <div className="text-sm font-medium text-muted-foreground">Número de teléfono:</div>
                      <div>{fullData?.student.num_tfno || "-"}</div>
                    </div>

                    <TextareaForm observaciones={fullData?.student.observaciones ?? ""} id_estudiante={id} />
                  </>
                ) : (
                  // --- MODO EDICIÓN ---
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 items-center">
                      <label className="text-sm text-muted-foreground">Nombre</label>
                      <Input
                        value={formPersonal.nombre}
                        onChange={(e) => setField("nombre", e.target.value)}
                      />

                      <label className="text-sm text-muted-foreground">Apellido 1</label>
                      <Input
                        value={formPersonal.apellido_1}
                        onChange={(e) => setField("apellido_1", e.target.value)}
                      />

                      <label className="text-sm text-muted-foreground">Apellido 2</label>
                      <Input
                        value={formPersonal.apellido_2}
                        onChange={(e) => setField("apellido_2", e.target.value)}
                      />

                      <label className="text-sm text-muted-foreground">Sexo</label>
                      <Select
                        value={formPersonal.sexo}
                        onValueChange={(v) => setField("sexo", v as any)}
                      >
                        <SelectTrigger><SelectValue placeholder="Selecciona sexo" /></SelectTrigger>
                        <SelectContent>
                          {SEXO_OPTIONS.map(o => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <label className="text-sm text-muted-foreground">Tipo de ID legal</label>
                      <Select
                        value={formPersonal.tipo_id_legal}
                        onValueChange={(v) => {
                          const kind = v as "dni" | "nie" | "pasaporte";
                          setField("tipo_id_legal", kind);
                          // NEW: re-validar con el valor actual del ID
                          setIdError(validateLegalId(kind, formPersonal.id_legal));
                        }}
                      >
                        <SelectTrigger><SelectValue placeholder="Selecciona tipo" /></SelectTrigger>
                        <SelectContent>
                          {TIPO_ID_OPTIONS.map(o => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <label className="text-sm text-muted-foreground">ID legal</label>
                      <div className="space-y-1">
                        <Input
                          value={formPersonal.id_legal}
                          onChange={(e) => {
                            // NEW: normaliza a mayúsculas y sin espacios interiores
                            const raw = e.target.value.toUpperCase();
                            const normalized = raw.replace(/\s+/g, "");
                            setField("id_legal", normalized);

                            // valida con el tipo actual
                            const kind = formPersonal.tipo_id_legal || "";
                            setIdError(validateLegalId(kind as any, normalized));
                          }}
                          autoComplete="off"
                          spellCheck={false}
                          aria-invalid={!!idError}
                          className={idError ? "border-destructive focus-visible:ring-destructive" : undefined}
                          placeholder={
                            formPersonal.tipo_id_legal === "dni" ? "00000000X" :
                              formPersonal.tipo_id_legal === "nie" ? "X0000000X" :
                                "Introduce tu documento"
                          }
                        />
                        {idError && <p className="text-xs text-destructive">{idError}</p>}
                      </div>

                      <label className="text-sm text-muted-foreground">Fecha de nacimiento</label>
                      <DatePicker
                        label=""
                        name="fecha_nac"
                        value={formPersonal.fecha_nac}
                        onChange={(d) => setField("fecha_nac", d ?? null)}
                      />

                      <label className="text-sm text-muted-foreground">Teléfono</label>
                      <Input
                        value={formPersonal.num_tfno}
                        onChange={(e) => setField("num_tfno", e.target.value)}
                      />
                    </div>

                    {/* observaciones: lo mantengo en su propio TextareaForm (ya gestiona PATCH aparte) */}
                    <TextareaForm observaciones={fullData?.student.observaciones ?? ""} id_estudiante={id} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* =====================================================
                ============== TARJETA REGISTROS ACADÉMICOS =========
                ===================================================== */}
            <Card>
              <CardHeader>
                <CardTitle>Registros académicos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    {/* -------- Selector de ciclo -------- */}
                    <SelectField
                      label="cycle"
                      name="cycle"
                      value={selectedCycle}
                      onValueChange={handleCycleChange}
                      placeholder="Ciclo"
                      options={cycleOptions}
                      width={300}
                    />

                    {/* -------- Selector de curso -------- */}
                    <SelectField
                      label="year"
                      name="year"
                      value={selectedYear}
                      onValueChange={handleYearChange}
                      placeholder="Curso"
                      options={yearOptions}
                    />

                    {/* -------- Selector de convocatoria -------- */}
                    <SelectField
                      label="convocatoria"
                      name="convocatoria"
                      value={selectedConvocatoria}
                      onValueChange={handleConvocatoriaChange}
                      placeholder="Convocatoria"
                      options={convocatoriaOptions}
                    />

                    {/* -------- Botón Crear Extraordinaria (a la derecha) -------- */}
                    {!hideAddExtraBtn && (
                      <AddExtraordinariaButton
                        className=""
                        studentId={fullData?.student.id_estudiante ?? id}
                        baseRecord={baseRecordCore}
                        failingModuleIds={failingModuleIds}
                        disabled={
                          !selectedCycle ||
                          !selectedYear ||
                          !selectedConvocatoria ||
                          !baseRecordCore ||
                          hasAM ||
                          isBajaCycle ||
                          failingModuleIds.length === 0
                        } // OJO: quitamos "extraordinariaExists" del disabled porque ya no se renderiza
                        onCreated={() => {
                          setJustCreatedExtra(true);               // oculta inmediatamente
                          handleConvocatoriaChange("Extraordinaria");
                          // opcional: fuerza refresco por si tu botón no invalida por sí mismo
                          queryClient.invalidateQueries({ queryKey: ['full-student-data', fullData?.student.id_estudiante] });
                          queryClient.refetchQueries({ queryKey: ['full-student-data', fullData?.student.id_estudiante], type: 'active' });
                        }}
                      />
                    )}
                  </div>

                  {/* -------- Acciones / Botón PDF + Editar -------- */}
                  <BlurredSection
                    active={Boolean(selectedCycle && selectedYear && selectedConvocatoria && isBajaCycle)}
                    onAlta={() => bajaMutation.mutate(false)}
                    disabled={bajaMutation.isPending}
                  >
                    < div className="flex items-center gap-2">
                      {(selectedCycle && selectedYear && selectedConvocatoria)
                        ? (
                          <PdfCertificateGeneratorButton
                            cycle_code={selectedCycle}
                            student_id={id}
                          />
                        ) : null
                      }
                    </div>

                    {/* -------- Tabla de módulos ---------- */}
                    {filteredRecords.map((anio_escolar) => {

                      return (
                        <div key={anio_escolar.id_expediente} className="mt-6">
                          <div className="mb-4 flex w-full items-center">
                            <pre className="text-sm text-muted-foreground">
                              {anio_escolar.ano_inicio}-{anio_escolar.ano_fin} | {anio_escolar.turno}
                              {anio_escolar.vino_traslado && (
                                <>
                                  {' | '}
                                  <Badge variant="outline">Trasladado</Badge>
                                </>
                              )}
                            </pre>
                            {/* alternar edición de notas */}
                            <Button
                              variant={"outline"}
                              onClick={() =>
                                startTransition(() => setIsEditingNotas((v) => !v))
                              }
                              disabled={!selectedExpedienteId}
                              className="ml-auto mr-2"
                            >
                              {isEditingNotas ? <X className="h-2 w-2" /> : <Pencil className="h-2 w-2" />}
                            </Button>
                            <DeleteRecordCascadeButton
                              expedienteId={selectedExpedienteId!}
                              studentId={fullData!.student.id_estudiante}
                              cicloId={currentRecord?.id_ciclo ?? null}
                              onDeleted={() => handleAfterDelete(currentRecord)}
                            />
                          </div>

                          <div className="rounded-md border">
                            <table className="w-full table-fixed">
                              <colgroup>
                                <col className="w-[25%]" />
                                <col className="w-[40%]" />
                                <col className="w-[35%]" />
                              </colgroup>
                              <thead>
                                <tr className="border-b bg-muted/50">
                                  <th className="p-3 text-left text-sm font-medium">Código</th>
                                  <th className="p-3 text-left text-sm font-medium">Nombre</th>
                                  <th className="p-3 text-left text-sm font-medium">Calificación</th>
                                </tr>
                              </thead>

                              <tbody>
                                {(anio_escolar.enrollments ?? []).map((modulo: any) => {
                                  const notaOptions = NOTA_OPTIONS;

                                  return (
                                    <tr key={modulo.codigo_modulo} className="border-b last:border-0">
                                      <td className="py-4 px-3 text-sm">{modulo.codigo_modulo}</td>
                                      <td className="py-4 px-3 text-sm">{modulo.nombre_modulo}</td>
                                      <td className="py-4 px-2 text-center text-sm">
                                        {isEditingNotas ? (
                                          <div className="flex items-center justify-center gap-2">
                                            <NotaCell
                                              value={editedNotas[modulo.codigo_modulo]}
                                              options={notaOptions}
                                              onChange={(val) =>
                                                setEditedNotas((prev) => ({
                                                  ...prev,
                                                  [modulo.codigo_modulo]: val,
                                                }))
                                              }
                                            />

                                            {/* === Botón borrar módulo en cascada (si tenemos id_matricula) === */}
                                            {(() => {
                                              const enrollmentId: number | undefined =
                                                modulo.id_matricula ?? modulo.matricula_id ?? modulo.id_matricula_pk ?? undefined;

                                              return typeof enrollmentId === "number" ? (
                                                <DeleteModuleCascadeButton
                                                  enrollmentId={enrollmentId}
                                                  studentId={fullData!.student.id_estudiante}
                                                  onDeleted={() => {
                                                    // refresca datos visibles tras la eliminación
                                                    queryClient.invalidateQueries({ queryKey: ["full-student-data", fullData!.student.id_estudiante] });
                                                    queryClient.refetchQueries({ queryKey: ["full-student-data", fullData!.student.id_estudiante], type: "active" });
                                                  }}
                                                />
                                              ) : null;
                                            })()}
                                          </div>
                                        ) : (
                                          <span className="leading-none">{modulo.nota ?? "-"}</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          {/* -------- Añadir módulo + Fecha + Guardar ---------- */}
                          <div className="mt-2 flex flex-col gap-2">
                            {isEditingNotas && (
                              <div className="flex items-center gap-2 flex-nowrap">
                                <Select
                                  value={selectedModuleIdToAdd}
                                  onValueChange={setSelectedModuleIdToAdd}
                                  disabled={
                                    !selectedCycle ||
                                    isLoadingModules ||
                                    addModuleMutation.isPending
                                  }
                                >
                                  <SelectTrigger className="h-9 w-[420px] text-xs">
                                    <SelectValue
                                      placeholder={
                                        isLoadingModules
                                          ? "Cargando..."
                                          : "Módulo"
                                      }
                                    />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-64 w-[375px]">
                                    {modulesForCycle.length ? (
                                      modulesForCycle.map((m) => (
                                        <SelectItem
                                          key={m.id_modulo}
                                          value={String(m.id_modulo)}
                                          className="cursor-pointer"
                                        >
                                          {/* En la lista seguimos dando contexto completo */}
                                          {m.codigo_modulo} | {m.nombre}
                                        </SelectItem>
                                      ))
                                    ) : (
                                      <div className="px-3 py-2 text-sm text-muted-foreground">
                                        No hay módulos disponibles para este ciclo.
                                      </div>
                                    )}
                                  </SelectContent>
                                </Select>

                                {/* Botón solo icono + tooltip */}
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        type="button"
                                        onClick={() => {
                                          if (selectedExpedienteId == null) {
                                            toast("Selecciona ciclo, año y convocatoria antes de añadir.");
                                            return;
                                          }
                                          if (!selectedModuleIdToAdd) {
                                            toast("Selecciona un módulo.");
                                            return;
                                          }

                                          const moduloId = Number(selectedModuleIdToAdd);
                                          if (!Number.isFinite(moduloId)) {
                                            toast("Selecciona un módulo válido.");
                                            return;
                                          }

                                          addModuleMutation.mutate({
                                            expedienteId: selectedExpedienteId,
                                            moduloId,
                                          });
                                        }}
                                        disabled={
                                          addModuleMutation.isPending ||
                                          selectedExpedienteId == null ||
                                          !modulesForCycle.length
                                        }
                                      >
                                        <Plus className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      <p>Añadir módulo</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <DatePicker
                                label="Fecha de pago del título"
                                name="pago_titulo"
                                value={selectedFechaPagoTitulo}
                                onChange={handleFechaPagoTitulo}
                              />
                              <Button
                                variant="outline"
                                type="button"
                                onClick={() => {
                                  if (selectedExpedienteId == null) {
                                    toast("Selecciona ciclo, año y convocatoria antes de guardar.");
                                    return;
                                  }
                                  mutation.mutate({
                                    expedienteId: selectedExpedienteId,
                                    selectedFechaPagoTitulo,
                                    notasUpdates,
                                  });
                                }}
                                disabled={
                                  selectedExpedienteId == null ||
                                  mutation.isPending ||
                                  !isDirty
                                }
                                className="min-w-[80px]"
                              >
                                {mutation.isPending ? "..." : "Guardar"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </BlurredSection>
                  {selectedCycle && selectedYear && selectedConvocatoria && (
                    <div className="mt-8 pt-4 border-t">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
                        <div className="text-sm text-muted-foreground">
                          Estado en <span className="font-medium">{selectedCycle}</span>:
                          {" "}
                          <span className={isBajaCycle ? "text-destructive font-medium" : "text-emerald-600 font-medium"}>
                            {isBajaCycle ? "De baja" : "Activo"}
                          </span>
                        </div>

                        {/* Si está de baja, aquí no mostramos acción (la acción está en el overlay central) */}
                        {!isBajaCycle ? (
                          <div className="flex items-center gap-2">
                            {!confirmingBaja ? (
                              <Button
                                variant="destructive"
                                onClick={() => setConfirmingBaja(true)}
                                disabled={!cicloIdForAction || bajaMutation.isPending}
                              >
                                {bajaMutation.isPending ? "…" : "Dar de baja"}
                              </Button>
                            ) : (
                              <>
                                <Button
                                  variant="destructive"
                                  onClick={() => bajaMutation.mutate(true)}
                                  disabled={bajaMutation.isPending}
                                >
                                  {bajaMutation.isPending ? "…" : "Confirmar baja"}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => setConfirmingBaja(false)}
                                  disabled={bajaMutation.isPending}
                                >
                                  Cancelar
                                </Button>
                                <span className="text-xs text-muted-foreground ml-1">Se cancela en 6 s</span>
                              </>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea >
      </SheetContent >
    </Sheet >
  )
};

export default StudentProfilePanel;

// CELDA DE NOTAS
const NotaCell = React.memo(function NotaCell({
  value,
  onChange,
  options, // ⬅️ nuevas opciones dinámicas
}: {
  value: string | number | null | undefined;
  onChange: (val: string) => void;
  options: readonly Nota[];
}) {
  const [open, setOpen] = useState(false);
  const v = value == null || value === "" ? "" : String(value);

  return (
    <div className="h-4 flex items-center justify-center">
      <Select open={open} onOpenChange={setOpen} value={v} onValueChange={(val) => onChange(val)}>
        <SelectTrigger className="h-9 w-28 text-center">
          <SelectValue placeholder="-">{v ? v : undefined}</SelectValue>
        </SelectTrigger>

        {open && (
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

function BlurredSection({
  active,
  onAlta,
  disabled,
  children,
}: {
  active: boolean;
  onAlta: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div className={active ? "pointer-events-none select-none blur-[2px] opacity-70 transition" : "transition"}>
        {children}
      </div>

      {active && (
        <div className="absolute inset-0 z-10 grid place-items-center">
          <div className="rounded-xl border bg-background/85 backdrop-blur px-4 py-3 shadow flex flex-col items-center text-center gap-2">
            <p className="text-sm text-muted-foreground">
              Estudiante <span className="font-medium">dado de baja</span> en este ciclo.
            </p>
            <Button variant="default" onClick={onAlta} disabled={disabled}>
              {"Dar de alta"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}