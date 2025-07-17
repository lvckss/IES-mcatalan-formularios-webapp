// ===============================================================
// =========================== IMPORTS ===========================
// ===============================================================
import React, { useState, useMemo } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import SelectField from "../StudentTable/SelectField"
import PdfCertificateGeneratorButton from "@/components/StudentPanel/PdfGeneratorButton"

import { api } from "@/lib/api"

import { useQuery } from "@tanstack/react-query"

import { RecordExtended, FullStudentData } from "@/types"


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

  const records = raw.records.map(r => ({
    ...r,
    fecha_pago_titulo: r.fecha_pago_titulo
      ? new Date(r.fecha_pago_titulo)
      : undefined
  }))

  return { student, records };
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
// =========== COMPONENTE <StudentProfilePanel /> ===============
// ===============================================================
const StudentProfilePanel: React.FC<StudentProfilePanelProps> = ({ id, isOpen, onClose }) => {

  // -------------------- ESTADO LOCAL ---------------------------
  const [selectedCycle, setSelectedCycle] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedConvocatoria, setSelectedConvocatoria] = useState("");
  const [allAnios, setAllAnios] = useState<RecordExtended[] | null>();

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
      r.convocatoria === selectedConvocatoria        // ⬅ add this test
    );
  }, [fullData, selectedCycle, selectedYear, selectedConvocatoria]);


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


  // =============================================================
  // ======================= RENDER UI ===========================
  // =============================================================
  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          setSelectedCycle("");
          setSelectedYear("");
        }
      }}
    >
      <SheetContent className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl">
        {/* ---------- CABECERA DEL PANEL ----------- */}
        <SheetHeader className="flex flex-row items-center justify-between pb-4">
          <SheetTitle className="text-xl font-bold">Perfil del estudiante</SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)] pr-4">
          <div className="space-y-6">
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
                </div>
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
                  <div className="flex items-center">
                    {/* -------- Selector de ciclo -------- */}
                    <div className="flex items-center space-x-4">
                      <SelectField
                        label="cycle"
                        name="cycle"
                        value={selectedCycle}
                        onValueChange={handleCycleChange}
                        placeholder="Ciclo"
                        options={cycleOptions}
                        width={300} 
                      />
                    </div>

                    {/* -------- Selector de curso -------- */}
                    <div className="flex items-center space-x-4">
                      <SelectField
                        label="year"
                        name="year"
                        value={selectedYear}
                        onValueChange={handleYearChange}
                        placeholder="Curso"
                        options={yearOptions}
                      />
                    </div>

                    {/* -------- Selector de convocatoria -------- */}
                    <div className="flex items-center space-x-4">
                      <SelectField
                        label="convocatoria"
                        name="convocatoria"
                        value={selectedConvocatoria}
                        onValueChange={handleConvocatoriaChange}
                        placeholder="Convocatoria"
                        options={convocatoriaOptions}
                      />
                    </div>
                  </div>

                  {/* -------- Botón PDF -------- */}
                  {(selectedCycle && selectedYear && selectedConvocatoria) ? <PdfCertificateGeneratorButton student_data={fullData!} cycle_code={selectedCycle} /> : ""}

                  {/* -------- Tabla de módulos ---------- */}
                  {filteredRecords.map((anio_escolar) => (
                    <div key={anio_escolar.id_expediente} className="mt-6">
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground">
                          {anio_escolar.ano_inicio}-{anio_escolar.ano_fin} | {anio_escolar.turno}
                        </p>
                      </div>

                      <div className="rounded-md border">
                        <table className="w-full table-fixed">
                          <colgroup>
                            <col className="w-[25%]" />
                            <col className="w-[55%]" />
                            <col className="w-[20%]" />
                          </colgroup>
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="p-2 text-left text-sm font-medium">Código</th>
                              <th className="p-2 text-left text-sm font-medium">Nombre</th>
                              <th className="p-2 text-left text-sm font-medium">Calificación</th>
                            </tr>
                          </thead>

                          <tbody>
                            {(anio_escolar.enrollments ?? []).map(modulo => (
                              <tr key={modulo.codigo_modulo} className="border-b last:border-0">
                                <td className="p-2 text-sm">{modulo.codigo_modulo}</td>
                                <td className="p-2 text-sm">{modulo.nombre_modulo}</td>
                                <td className="p-2 text-center text-sm">{modulo.nota}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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