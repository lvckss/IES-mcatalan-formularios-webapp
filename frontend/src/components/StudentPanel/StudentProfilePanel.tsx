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
import { Pencil, X } from "lucide-react"; // NEW (opcional para iconos)

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

// PARA EL ENDPOINT DE LAS NOTAS

const NOTA_OPTIONS = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "10-MH",
  "CV", "CV-5", "CV-6", "CV-7", "CV-8", "CV-9", "CV-10",
  "AM", "RC", "NE", "APTO", "NO APTO"
] as const;

type Nota = typeof NOTA_OPTIONS[number];

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
    },
    onError: (err: any) =>
      toast.error(err.message ?? 'No ha sido posible modificar la convocatoria.')
  });


  // -------------------- QUERY PRINCIPAL ------------------------
  const { data: fullData } = useQuery({
    queryKey: ['full-student-data', id],
    queryFn: ({ queryKey }) => {
      const [_key, studentId] = queryKey;
      return getFullStudentData(studentId as number);
    }
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
    if (!selectedCycle) return [{ value: "invalido", label: "Selecciona antes un ciclo." }];
    const seen = new Set<string>();
    return (fullData?.records ?? [])
      .filter((r) => r.ciclo_codigo === selectedCycle)
      .filter((r) => {
        const key = `${r.ano_inicio}-${r.ano_fin}`;
        return !seen.has(key) && seen.add(key);
      })
      .map((r) => ({
        value: `${r.ano_inicio}-${r.ano_fin}`,
        label: `${r.ano_inicio}-${r.ano_fin}`,
      }));
  }, [fullData, selectedCycle]);

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

  // NEW: detectar cambio de fecha
  const fechaChanged = useMemo(() => {
    const a = currentRecord?.fecha_pago_titulo ?? null;
    const b = selectedFechaPagoTitulo ?? null;
    const ta = a instanceof Date ? a.getTime() : (a ? new Date(a as any).getTime() : null);
    const tb = b instanceof Date ? b.getTime() : null;
    return ta !== tb;
  }, [currentRecord, selectedFechaPagoTitulo]);

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
    setSelectedConvocatoria(""); // reset convocatoria when year changes
  };

  const handleConvocatoriaChange = (value: string) => {
    setSelectedConvocatoria(value);
  };

  const handleFechaPagoTitulo = (fecha: Date | undefined) => {
    setSelectedFechaPagoTitulo(fecha ?? null);
  };

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
            setIsEditingNotas(false); // NEW
            setEditedNotas({});       // NEW
          }, 500);
        }
      }}
    >
      <SheetContent className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl">
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
              <CardHeader>
                <CardTitle>Información personal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm font-medium text-muted-foreground">Nombre:</div>
                  <div>{fullData?.student.nombre}</div>

                  <div className="text-sm font-medium text-muted-foreground">Apellido 1:</div>
                  <div>{fullData?.student.apellido_1}</div>

                  <div className="text-sm font-medium text-muted-foreground">Apellido 2:</div>
                  <div>{fullData?.student.apellido_2}</div>

                  <div className="text-sm font-medium text-muted-foreground">Sexo:</div>
                  <div>{fullData?.student.sexo}</div>

                  <div className="text-sm font-medium text-muted-foreground">ID Legal:</div>
                  <div>{fullData?.student.id_legal}</div>

                  <div className="text-sm font-medium text-muted-foreground">Fecha de nacimiento:</div>
                  <div>{
                    fullData?.student.fecha_nac
                      .toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    || ''
                  }</div>

                  <div className="text-sm font-medium text-muted-foreground">Número de expediente:</div>
                  <div>{fullData?.student.id_estudiante}</div>

                  <div className="text-sm font-medium text-muted-foreground">Número de teléfono:</div>
                  <div>{fullData?.student.num_tfno}</div>
                </div>
                <TextareaForm observaciones={fullData?.student.observaciones ?? ""} id_estudiante={id} />
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
                  </div>

                  {/* -------- Acciones / Botón PDF + Editar -------- */}
                  <div className="flex items-center gap-2">
                    {(selectedCycle && selectedYear && selectedConvocatoria)
                      ? (
                        <PdfCertificateGeneratorButton
                          student_data={fullData!}
                          cycle_code={selectedCycle}
                        />
                      ) : null
                    }
                  </div>

                  {/* -------- Tabla de módulos ---------- */}
                  {filteredRecords.map((anio_escolar) => (
                    <div key={anio_escolar.id_expediente} className="mt-6">
                      <div className="mb-4 flex w-full items-center">
                        <p className="text-sm text-muted-foreground">
                          {anio_escolar.ano_inicio}-{anio_escolar.ano_fin} | {anio_escolar.turno}
                          {anio_escolar.vino_traslado && (
                            <>
                              {' | '}
                              <Badge variant="outline">Trasladado</Badge>
                            </>
                          )}
                        </p>
                        {/* alternar edición de notas */}
                        <Button
                          variant={"outline"}
                          onClick={() =>
                            startTransition(() => setIsEditingNotas((v) => !v))
                          }
                          disabled={!selectedExpedienteId}
                          className="ml-auto"
                        >
                          {isEditingNotas ? <X className="h-2 w-2" /> : <Pencil className="h-2 w-2" />}
                        </Button>
                      </div>

                      <div className="rounded-md border">
                        <table className="w-full table-fixed">
                          <colgroup>
                            <col className="w-[25%]" />
                            <col className="w-[50%]" />
                            <col className="w-[25%]" />
                          </colgroup>
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="p-3 text-left text-sm font-medium">Código</th>
                              <th className="p-3 text-left text-sm font-medium">Nombre</th>
                              <th className="p-3 text-left text-sm font-medium">Calificación</th>
                            </tr>
                          </thead>

                          <tbody>
                            {(anio_escolar.enrollments ?? []).map((modulo: any) => (
                              <tr key={modulo.codigo_modulo} className="border-b last:border-0">
                                <td className="py-4 px-3 text-sm">{modulo.codigo_modulo}</td>
                                <td className="py-4 px-3 text-sm">{modulo.nombre_modulo}</td>
                                <td className="py-4 px-2 text-center text-sm">
                                  {isEditingNotas ? (
                                    <NotaCell
                                      value={editedNotas[modulo.codigo_modulo]}
                                      onChange={(val) =>
                                        setEditedNotas((prev) => ({
                                          ...prev,
                                          [modulo.codigo_modulo]: val, // "" -> placeholder; tu lógica ya lo convierte a null al guardar
                                        }))
                                      }
                                    />
                                  ) : (
                                    <span className="leading-none">{modulo.nota ?? "-"}</span>
                                  )}
                                </td>

                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* -------- Fecha + Guardar ---------- */}
                      <div className="mt-2 flex items-center gap-2">
                        <DatePicker
                          label="Fecha de pago del título"
                          name="pago_titulo"
                          value={selectedFechaPagoTitulo} // precargada al cambiar convocatoria
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
                              notasUpdates, // << aquí va el array
                            });
                          }}
                          disabled={selectedExpedienteId == null || mutation.isPending || !isDirty}
                          className="min-w-[80px]"
                        >
                          {mutation.isPending ? "..." : "Guardar"}
                        </Button>
                      </div>
                    </div>
                  ))}
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

// CELDA DE NOTAS
const NotaCell = React.memo(function NotaCell({
  value,
  onChange,
}: {
  value: string | number | null | undefined;
  onChange: (val: string) => void; // recibe "" para limpiar
}) {
  const [open, setOpen] = useState(false);
  const v = value == null || value === "" ? "" : String(value);

  return (
    <div className="h-4 flex items-center justify-center">
      <Select
        open={open}
        onOpenChange={setOpen}
        value={v}
        onValueChange={(val) => onChange(val)}
      >
        <SelectTrigger className="h-9 w-28 text-center">
          {/* Si hay valor, lo pinto yo; si no, placeholder */}
          <SelectValue placeholder="-">
            {v ? v : undefined}
          </SelectValue>
        </SelectTrigger>

        {/* Solo monto las opciones cuando está abierto */}
        {open && (
          <SelectContent className="max-h-64">
            {NOTA_OPTIONS.map((opt) => (
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