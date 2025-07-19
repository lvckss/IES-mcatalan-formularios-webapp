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
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import SelectField from "@/components/StudentTable/SelectField";
import { toast } from "sonner";

import { PostStudent, PostRecord, PostEnrollment } from "@/types";


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

  if (!response) {
    throw new Error("server error");
  }

  const data = await response.json();
  return data.modulos;
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

  const queryClient = useQueryClient();

  // Calcula si mostramos la lista de módulos
  const showModules = selectedCiclo && selectedAnioEscolar && selectedTurno;

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


  // =============================================================
  // ============== MANEJADORES DE EVENTOS =======================
  // =============================================================
  const handleLeyChange = (ley: string) => {
    setSelectedLey(ley);
    setSelectedCiclo("");
    setSelectedModules({});
    setModulesFilter("");
  }

  const handleCicloChange = (value: string) => {
    setSelectedCiclo(value);
    setSelectedModules({});
    setModulesFilter("");
  };

  const handleModuleToggle = (moduleId: number) => {
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
    };

    const recordResponse = await mutationExpediente.mutateAsync(recordData);
    const recordId = recordResponse.expediente.id_expediente;

    const matriculas: PostEnrollment[] = Object.entries(selectedModules).map(([id]) => ({
      id_modulo: Number(id),
      nota: 'NE',
      id_expediente: Number(recordId)
    }))

    await Promise.all(
      matriculas.map(matricula => mutationMatriculas.mutateAsync(matricula))
    );
    queryClient.invalidateQueries({ queryKey: ['full-student-data', student_id] });
    onClose();
    setTimeout(() => { // reset 500 ms después
      setSelectedCiclo("");
      setSelectedAnioEscolar("");
      setModulesFilter("");
      setSelectedTurno("");
      setSelectedModules({});
    }, 500);
  }

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
            setSelectedCiclo("");
            setSelectedAnioEscolar("");
            setModulesFilter("");
            setSelectedTurno("");
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
              <div className="mr-10 text-gray-600 text-sm">
                {fullStudentData?.student.id_estudiante} | {fullStudentData?.student.id_legal} | {fullStudentData?.student.apellido_1} {fullStudentData?.student.apellido_2}, {fullStudentData?.student.nombre}
              </div>
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
          <div>
            <SelectField
              label="Ciclo Formativo"
              name="ciclo_formativo"
              value={selectedCiclo ? `${selectedCiclo}` : ""}
              onValueChange={handleCicloChange}
              placeholder="Seleccionar ciclo"
              options={(ciclosByLeyData ?? []).map((ciclo) => ({
                value: `${ciclo.codigo}`,
                label: `${ciclo.nombre} (${ciclo.codigo})`,
              }))}
              width={1000}
            />
          </div>

          {/* ---------- SELECT AÑO ESCOLAR ----------- */}
          <div>
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
                <h4 className="font-medium mb-2 top-0 bg-white/90 backdrop-blur">
                  Primer curso
                </h4>
                <ModuleList
                  modules={filteredPrimer}
                  selectedModules={selectedModules}
                  onModuleToggle={handleModuleToggle}
                />

                <Separator className="mt-5 mb-5" />

                {/* ---- Segundo curso ---- */}
                {filteredSegundo.length > 0 && (
                  <>
                    <h4 className="font-medium mb-2 mt-2 top-0 bg-white/90 backdrop-blur">
                      Segundo curso
                    </h4>
                    <ModuleList
                      modules={filteredSegundo}
                      selectedModules={selectedModules}
                      onModuleToggle={handleModuleToggle}
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
const ModuleList = React.memo(({ modules, selectedModules, onModuleToggle }: {
  modules: any[],
  selectedModules: Record<number, [string, number | null]>,
  onModuleToggle: (moduleId: number) => void,
}) => (
  <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
    {modules.map((module) => {
      return (
        <div key={module.id_modulo} className="flex">
          <Checkbox
            id={`module-${module.id_modulo}`}
            checked={module.id_modulo in selectedModules}
            onCheckedChange={() => onModuleToggle(module.id_modulo)}
          />
          <span className="text-sm font-medium leading-none w-auto inline-block ml-3">
            {module.nombre}
          </span>
        </div>
      )
    })}
  </div>
));