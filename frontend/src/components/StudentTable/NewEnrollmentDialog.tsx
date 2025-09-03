// ===============================================================
// =========================== IMPORTS ===========================
// ===============================================================
import React, { useState, useMemo } from "react";
import { RecordExtended, FullStudentData } from "@/types"
import { api } from "@/lib/api"
import { useQuery, useQueries, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

import SelectField from "@/components/StudentTable/SelectField";
import { toast } from "sonner";

import { PostStudent, PostRecord, PostEnrollment } from "@/types";
import { useRowState } from "react-table";
import { AirVent } from "lucide-react";


// ===============================================================
// ========== FUNCIONES AUXILIARES / LLAMADAS A LA API ===========
// ===============================================================

// -- Obtiene la información completa de un estudiante -----------
async function getFullStudentData(id: number): Promise<FullStudentData> {
  const response = await api.students.fullInfo[':id'].$get({ param: { id: id.toString() } });
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

  return { student, records };
}

// -- Lista de ciclos únicos por ley --------------------------------
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

// -- Ciclo formativo por código ---------------------------------
async function getCiclosByCodigo({ codigo }: { codigo: string }) {
  const response = await api.cycles.code[':codigo'].$get({
    param: { codigo }
  });

  if (!response) {
    throw new Error("server error");
  }

  const data = await response.json();      // { ciclo: … }
  return data.ciclo;
}

async function createRecord(recordData: PostRecord) {
  const response = await api.records.$post({
    json: recordData,
  });
  if (!response.ok) {
    throw new Error('Error al crear el expediente')
  }
  return response.json();
}

async function createMatriculas(enrollmentData: PostEnrollment) {
  const response = await api.enrollments.$post({
    json: enrollmentData,
  });
  if (!response.ok) {
    throw new Error('Error al crear las matrículas');
  }
  return response.json();
}

// -- Módulos por id de ciclo ------------------------------------
async function getModulosByCycleId({ ciclo_id }: { ciclo_id: number }) {
  const response = await api.modules.cycle_id[':cycle_id'].$get({
    param: { cycle_id: String(ciclo_id) }
  });

  if (!response.ok) {
    throw new Error("Error al obtener los módulos");
  }

  const data = await response.json();
  return data.modulos;
}

// -- Saber si la asignatura se puede aprobar o no
async function checkModuloAprobable(id_estudiante: number, id_modulo: number) {
  const response = await api.enrollments.puedeAprobar[':id_estudiante'][':id_modulo'].$get({
    param: { id_estudiante: String(id_estudiante), id_modulo: String(id_modulo) }
  });

  if (!response.ok) {
    throw new Error("Error al tratar de saber si el módulo se podía aprobar.")
  }
  const data = await response.json();
  return data.result;
}

// -- Saber si un alumno puede matricularse a un ciclo en un año determinado o no
// (por si ya lo está cursando ese año) [ el parámetro periodo es por ejemplo el string "2024-2025" ]
async function checkCicloCursableEnPeriodo(id_estudiante: number, id_ciclo: number, periodo: string) {
  const response = await api.records.puedeMatricularse[":id_estudiante"][":id_ciclo"][":periodo"].$get({
    param: { id_estudiante: String(id_estudiante), id_ciclo: String(id_ciclo), periodo: String(periodo) }
  });

  if (!response.ok) {
    throw new Error("Error al tratar de saber si el ciclo es cursable en el periodo determinado.")
  }
  const data = await response.json();
  return data.result;
}

// ===============================================================
// ============ GENERADOR DE OPCIONES DE AÑO ESCOLAR =============
// ===============================================================
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


// ===============================================================
// ====================== TIPOS / PROPS ==========================
// ===============================================================

import type { CheckedState } from "@radix-ui/react-checkbox";

interface NewEnrollmentButtonProps {
  student_id: number;
  isOpen: boolean;
  onClose: () => void;
}

// ===============================================================
// ============= COMPONENTE <NewEnrollmentDialog /> ==============
// ===============================================================
const NewEnrollmentDialog: React.FC<NewEnrollmentButtonProps> = ({ student_id, isOpen, onClose }) => {

  // -------------------- ESTADO LOCAL ---------------------------
  const [selectedLey, setSelectedLey] = useState<string>("");
  const [selectedCiclo, setSelectedCiclo] = useState<string>("");
  const [selectedAnioEscolar, setSelectedAnioEscolar] = useState<string>("");
  const [modulesFilter, setModulesFilter] = useState<string>("");
  const [selectedModules, setSelectedModules] = useState<Record<number, [string, number | null]>>({});
  const [selectedTurno, setSelectedTurno] = useState<string>("");
  const [vinoTraslado, setVinoTraslado] = useState<boolean>(false);

  const queryClient = useQueryClient();

  // Calcula si mostramos la lista de módulos
  const showModules = Boolean(selectedCiclo && selectedAnioEscolar && selectedTurno);

  const mutationExpediente = useMutation({
    mutationFn: createRecord,
  });

  const mutationMatriculas = useMutation({
    mutationFn: createMatriculas,
  });

  // --------------------- QUERIES REACT-QUERY -------------------
  // --- 1. Datos completos del estudiante -----------------------
  const { data: fullStudentData } = useQuery({
    queryKey: ['full-student-data', student_id],
    queryFn: ({ queryKey }) => {
      const [_key, studentId] = queryKey;
      return getFullStudentData(studentId as number);
    }
  });

  // --- 2. Ciclos únicos por ley (para el select) -----------------------
  const {
    isPending: ciclosLoading,
    error: ciclosError,
    data: ciclosByLeyData = []
  } = useQuery({
    queryKey: ['ciclos-by-ley', selectedLey],
    queryFn: () => getCiclosByLey(selectedLey),
    enabled: !!selectedLey,
    staleTime: 5 * 60 * 1000, // Cacheamos los ciclos cada 5 minutos para evitar overloadear la API
  });

  // --- 3. Ciclos según código seleccionado ---------------------
  const {
    data: ciclosData,
  } = useQuery({
    queryKey: ['ciclo', selectedCiclo],
    queryFn: () => getCiclosByCodigo({ codigo: selectedCiclo! }),
    enabled: Boolean(selectedCiclo),
    staleTime: 5 * 60 * 1000,
  });

  // --- 4. Mapear curso → id_ciclo ------------------------------
  const cursoIds = useMemo(
    () =>
      ciclosData?.reduce((acc, ciclo) => {
        acc[ciclo.curso] = ciclo.id_ciclo;
        return acc;
      }, {} as Record<string, number>) ?? {},
    [ciclosData],
  );

  // id del ciclo de 1º (el que usas para crear el expediente)
  const cicloIDPrimero = cursoIds['1'];

  // Opciones de año escolar, memorizadas
  const schoolYearOptions = useMemo(() => generateSchoolYearOptions(), []);

  // Pide si puede matricularse en cada periodo (true/false)
  const canEnrollQueries = useQueries({
    queries: schoolYearOptions.map((opt) => ({
      queryKey: ['can-enroll-period', student_id, cicloIDPrimero, opt.value] as const,
      queryFn: () =>
        checkCicloCursableEnPeriodo(student_id, Number(cicloIDPrimero), opt.value),
      enabled: Boolean(selectedCiclo && cicloIDPrimero), // solo cuando ya hay ciclo seleccionado
      staleTime: 5 * 60 * 1000,
    })),
  });

  // Set con años deshabilitados (NO puede cursar => disabled)
  const disabledYearSet = useMemo(() => {
    const s = new Set<string>();
    canEnrollQueries.forEach((q, idx) => {
      const period = schoolYearOptions[idx]?.value;
      if (period && q.data === false) s.add(period);
    });
    return s;
  }, [canEnrollQueries, schoolYearOptions]);


  // --- 5. Carga de módulos por cada curso ----------------------
  const modulosQueries = useQueries({
    queries: Object.entries(cursoIds).map(([curso, id]) => ({
      queryKey: ['modulos', id],
      queryFn: () => getModulosByCycleId({ ciclo_id: id }),
      enabled: Boolean(id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  // --- 6. Reestructura módulos { '1º': [...], '2º': [...] } ----
  const modulosByCurso = useMemo(() => {
    const out: Record<string, any[]> = {};
    modulosQueries.forEach((q, idx) => {
      const curso = Object.keys(cursoIds)[idx];
      out[curso] = q.data ?? [];
    });
    return out;
  }, [modulosQueries, cursoIds]);

  // ------------------ FILTROS DE MÓDULOS -----------------------
  const modulosPrimerCurso = modulosByCurso['1'] ?? [];
  const modulosSegundoCurso = modulosByCurso['2'] ?? [];

  const filteredPrimer = useMemo(
    () =>
      modulosPrimerCurso.filter(m =>
        m.nombre.toLowerCase().includes(modulesFilter.toLowerCase())
      ),
    [modulosPrimerCurso, modulesFilter],
  );

  const filteredSegundo = useMemo(
    () =>
      modulosSegundoCurso.filter(m =>
        m.nombre.toLowerCase().includes(modulesFilter.toLowerCase())
      ),
    [modulosSegundoCurso, modulesFilter],
  );

  // IDs de todos los módulos visibles (1º y 2º)
  const allModuleIds = useMemo(() => {
    const ids1 = (modulosPrimerCurso ?? []).map((m: any) => m.id_modulo);
    const ids2 = (modulosSegundoCurso ?? []).map((m: any) => m.id_modulo);
    return Array.from(new Set([...ids1, ...ids2]));
  }, [modulosPrimerCurso, modulosSegundoCurso]);

  // Pide si se puede aprobar cada módulo (true/false)
  const approveChecks = useQueries({
    queries: allModuleIds.map((id) => ({
      queryKey: ['can-approve', student_id, id] as const,   // <- QueryKey
      queryFn: () => checkModuloAprobable(student_id, id),   // Promise<boolean>
      enabled: showModules && allModuleIds.length > 0,       // <- boolean puro
      staleTime: 5 * 60 * 1000,
    })),
  });

  // Set con módulos deshabilitados (ya aprobados => no se pueden aprobar)
  const disabledSet = useMemo(() => {
    const s = new Set<number>();
    approveChecks.forEach((q, idx) => {
      const id = allModuleIds[idx];
      if (q.data === false) s.add(id); // false => NO se puede aprobar => deshabilitar
    });
    return s;
  }, [approveChecks, allModuleIds]);

  // =============================================================
  // ============== MANEJADORES DE EVENTOS =======================
  // =============================================================
  const handleLeyChange = (ley: string) => {
    setSelectedLey(ley);
    setSelectedCiclo("");
    setSelectedAnioEscolar("");
    setSelectedTurno("");
    setSelectedModules({});
    setModulesFilter("");
  };

  const handleCicloChange = (value: string) => {
    setSelectedCiclo(value);
    setSelectedAnioEscolar("");
    setSelectedTurno("");
    setSelectedModules({});
    setModulesFilter("");
  };

  const handleModuleToggle = (moduleId: number) => {
    if (disabledSet.has(moduleId)) {
      toast("Este módulo ya está aprobado; no se puede seleccionar.");
      return;
    }
    setSelectedModules(prev => {
      const newState = { ...prev };
      if (moduleId in newState) {
        delete newState[moduleId];
      } else {
        newState[moduleId] = ["Matricula", 0];
      }
      return newState;
    });
  };

  // --- Helpers para "Seleccionar todos" por curso ---
  const getSelectableIds = (mods: any[]) =>
    mods.filter(m => !disabledSet.has(m.id_modulo)).map(m => m.id_modulo);

  const getCourseCheckedState = (mods: any[]): CheckedState => {
    const ids = getSelectableIds(mods);
    if (ids.length === 0) return false;
    const selectedCount = ids.filter(id => id in selectedModules).length;
    if (selectedCount === 0) return false;
    if (selectedCount === ids.length) return true;
    return "indeterminate";
  };

  // Toggle: si ya están todos → deselecciona; si no → selecciona todos
  const handleToggleAllForCourse = (mods: any[]) => {
    const selectable = getSelectableIds(mods);
    setSelectedModules(prev => {
      const next = { ...prev };
      const allSelected = selectable.every(id => id in next);
      if (allSelected) {
        selectable.forEach(id => { delete next[id]; });
      } else {
        selectable.forEach(id => { next[id] = ["Matricula", 0]; });
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Evita el comportamiento por defecto del formulario

    if (!selectedCiclo || !selectedAnioEscolar || Object.keys(selectedModules).length === 0) {
      toast("Complete todos los campos.")
      return;
    }

    const [anoInicio, anoFin] = selectedAnioEscolar.split('-').map(Number);

    const cicloIDPrimero = cursoIds['1'];

    const recordData: PostRecord = {
      id_estudiante: student_id,
      ano_inicio: anoInicio,
      ano_fin: anoFin,
      convocatoria: "Ordinaria" as "Ordinaria" | "Extraordinaria",
      turno: selectedTurno,
      id_ciclo: Number(cicloIDPrimero),
      fecha_pago_titulo: null,
      vino_traslado: vinoTraslado,
    };

    const recordResponse = await mutationExpediente.mutateAsync(recordData);
    const recordId = recordResponse.expediente.id_expediente;

    const matriculas: PostEnrollment[] = Object.entries(selectedModules).map(([id]) => ({
      id_modulo: Number(id),
      nota: 'NE',
      id_estudiante: student_id,
      id_expediente: Number(recordId)
    }))

    await Promise.all(
      matriculas.map(matricula => mutationMatriculas.mutateAsync(matricula))
    );
    queryClient.invalidateQueries({ queryKey: ['full-student-data', student_id] });
    // volver a calcular los años no cursables
    queryClient.invalidateQueries({ queryKey: ['can-enroll-period', student_id] });
    queryClient.refetchQueries({ queryKey: ['can-enroll-period', student_id], type: 'active' });
    onClose();
    setTimeout(() => { // reset 500 ms después
      setSelectedLey("");
      setSelectedCiclo("");
      setSelectedAnioEscolar("");
      setModulesFilter("");
      setSelectedTurno("");
      setSelectedModules({});
    }, 500);
  }

  const canPickYear = Boolean(selectedLey && selectedCiclo && cicloIDPrimero);
  const canPickCiclo = Boolean(selectedLey)

  // =============================================================
  // ======================= RENDER UI ===========================
  // =============================================================
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          setTimeout(() => { // reset 500 ms después
            setSelectedLey("");
            setSelectedCiclo("");
            setSelectedAnioEscolar("");
            setModulesFilter("");
            setSelectedTurno("");
            setVinoTraslado(false);
            setSelectedModules({});
          }, 500);
        }
      }}
    >
      <DialogContent className="min-w-[700px] max-w-[700px]">
        <form onSubmit={handleSubmit} className="space-y-2">
          {/* ---------- CABECERA DEL DIALOG ----------- */}
          <DialogHeader>
            <div className="flex items-center justify-between mb-4">
              <DialogTitle className="text-xl font-semibold m-0">
                Añadir nuevo curso escolar
              </DialogTitle>
              <DialogDescription className="mr-10 text-gray-600 text-sm">
                {fullStudentData?.student.id_estudiante} | {fullStudentData?.student.id_legal} | {fullStudentData?.student.apellido_1} {fullStudentData?.student.apellido_2}, {fullStudentData?.student.nombre}
              </DialogDescription>
            </div>
          </DialogHeader>

          {/* ---------- SELECT LEY FORM. ----------- */}
          <div>
            <SelectField
              label="Ley Educativa"
              name="ley_educativa"
              value={selectedLey}
              onValueChange={handleLeyChange}
              placeholder="Seleccionar ley"
              options={[
                { label: "LOGSE", value: "LOGSE" },
                { label: "LOE", value: "LOE" },
                { label: "LFP", value: "LFP" },
              ]}
              width={1000}
            />
          </div>

          {/* ---------- SELECT CICLO FORM. ----------- */}
          <div className={!canPickCiclo ? "pointer-events-none opacity-60" : ""}>
            <SelectField
              label="Ciclo Formativo"
              name="ciclo_formativo"
              value={selectedCiclo ? `${selectedCiclo}` : ""}
              onValueChange={handleCicloChange}
              placeholder={canPickCiclo ? "Seleccionar ciclo" : "Selecciona ciclo primero"}
              options={
                canPickCiclo
                  ? (ciclosByLeyData ?? []).map((ciclo) => ({
                    value: `${ciclo.codigo}`,
                    label: `${ciclo.nombre} (${ciclo.codigo})`,
                  }))
                  : [] // sin opciones hasta que haya ley (o lo que controle canPickCiclo)
              }
              width={1000}
            />
          </div>

          {/* ---------- SELECT AÑO ESCOLAR ----------- */}
          <div className={!canPickYear ? "pointer-events-none opacity-60" : ""}>
            <SelectField
              label="Año escolar"
              name="anio_escolar"
              value={selectedAnioEscolar}
              onValueChange={setSelectedAnioEscolar}
              placeholder={canPickYear ? "Año escolar" : "Selecciona ley y ciclo primero"}
              options={
                canPickYear
                  ? schoolYearOptions.map(o => {
                    const isDisabled = disabledYearSet.has(o.value);
                    return {
                      value: o.value,
                      label: isDisabled ? `${o.label} (ya existe)` : o.label,
                      disabled: isDisabled,
                    };
                  })
                  : [] // sin opciones hasta que haya ley + ciclo
              }
              width={1000}
            />
          </div>


          {/* ---------- SELECT TURNO ----------- */}
          <div>
            <SelectField
              label="Turno"
              name="turno"
              value={selectedTurno}
              onValueChange={(value) => setSelectedTurno(value)}
              placeholder="Turno"
              options={[
                { value: "Diurno", label: "Diurno" },
                { value: "Vespertino", label: "Vespertino" },
                { value: "Nocturno", label: "Nocturno" },
                { value: "A distancia", label: "A distancia" }
              ]}
              width={1000}
            />
          </div>

          {/* ---------- VINO DE TRASLADO CHECKBOX ------------- */}
          <div className="flex items-center ml-2">
            <Label htmlFor="ciclo_formativo" className="text-right font-medium mr-2">Traslado</Label>
            <Checkbox
              id="vino_traslado"
              checked={vinoTraslado}
              onCheckedChange={(value) => setVinoTraslado(value === true)}
            />
          </div>

          {/* ---------- LISTA DE MÓDULOS (condicional) ----------- */}
          <div
            className={`overflow-hidden transition-[max-height] duration-500 ease-in-out ${showModules ? "max-h-[600px]" : "max-h-0"
              }`}
          >
            {showModules && (
              <>
                {/* ---- Input filtro de módulos ---- */}
                <input
                  type="text"
                  value={modulesFilter}
                  onChange={(e) => setModulesFilter(e.target.value)}
                  placeholder="Filtrar módulos"
                  className="p-1 border text-sm border-gray-300 rounded mt-3 mb-1 mr-5 w-full pl-3"
                />

                {/* ---- Primer curso ---- */}
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Primer curso</h4>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="select-all-1"
                      checked={getCourseCheckedState(filteredPrimer)}
                      disabled={getSelectableIds(filteredPrimer).length === 0}
                      onCheckedChange={() => handleToggleAllForCourse(filteredPrimer)}
                    />
                    <Label htmlFor="select-all-1" className="text-sm cursor-pointer">
                      Seleccionar todos
                      <span className="ml-2 opacity-70">
                        (
                        {
                          getSelectableIds(filteredPrimer)
                            .filter(id => id in selectedModules).length
                        }
                        /
                        {getSelectableIds(filteredPrimer).length}
                        )
                      </span>
                    </Label>
                  </div>
                </div>
                <ModuleList
                  modules={filteredPrimer}
                  selectedModules={selectedModules}
                  onModuleToggle={handleModuleToggle}
                  disabledSet={disabledSet}
                />

                <Separator className="mt-5 mb-5" />

                {/* ---- Segundo curso ---- */}
                {filteredSegundo.length > 0 && (
                  <>
                    <div className="flex items-center justify-between mb-2 mt-2 sticky top-0 bg-white/90 backdrop-blur py-1">
                      <h4 className="font-medium">Segundo curso</h4>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="select-all-2"
                          checked={getCourseCheckedState(filteredSegundo)}
                          disabled={getSelectableIds(filteredSegundo).length === 0}
                          onCheckedChange={() => handleToggleAllForCourse(filteredSegundo)}
                        />
                        <Label htmlFor="select-all-2" className="text-sm cursor-pointer">
                          Seleccionar todos
                          <span className="ml-2 opacity-70">
                            (
                            {
                              getSelectableIds(filteredSegundo)
                                .filter(id => id in selectedModules).length
                            }
                            /
                            {getSelectableIds(filteredSegundo).length}
                            )
                          </span>
                        </Label>
                      </div>
                    </div>
                    <ModuleList
                      modules={filteredSegundo}
                      selectedModules={selectedModules}
                      onModuleToggle={handleModuleToggle}
                      disabledSet={disabledSet}
                    />
                  </>
                )}
              </>
            )}
          </div>

          {/* ---------- BOTÓN GUARDAR ----------- */}
          <DialogFooter>
            <Button type="submit" className="px-5 mr-4">Guardar curso escolar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog >
  )
}

export default NewEnrollmentDialog;


// ===============================================================
// ================ SUBCOMPONENTE <ModuleList /> =================
// ===============================================================
const ModuleList = React.memo(({ modules, selectedModules, onModuleToggle, disabledSet }: {
  modules: any[],
  selectedModules: Record<number, [string, number | null]>,
  onModuleToggle: (moduleId: number) => void,
  disabledSet: Set<number>,
}) => (
  <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
    {modules.map((module) => {
      const disabled = disabledSet.has(module.id_modulo);
      const checked = module.id_modulo in selectedModules;

      return (
        <div key={module.id_modulo} className="flex items-center">
          <Checkbox
            id={`module-${module.id_modulo}`}
            checked={checked}
            disabled={disabled}
            onCheckedChange={() => onModuleToggle(module.id_modulo)}
          />
          <span
            className={`text-sm font-medium leading-none w-auto inline-block ml-3 ${disabled ? "text-muted-foreground" : ""
              }`}
            title={disabled ? "Ya aprobado; no se puede volver a aprobar" : ""}
          >
            <span className={disabled ? "line-through" : ""}>{module.nombre}</span>
            {disabled && <small className="ml-2 opacity-70">(ya aprobado)</small>}
          </span>
        </div>
      );
    })}
  </div>
));