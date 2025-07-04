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
import PdfCertificateGeneratorButton from "@/components/StudentPanel/PdfGeneratorButton"

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
  const [allCursos, setAllCursos] = useState<RecordExtended[] | null>();

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
      .filter(rec => rec.ciclo_codigo === value)
    
    setAllCursos(cicloRecords)
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open : boolean) => {
        if (!open) {
          onClose()
          setSelectedCycle("")
          setTimeout(() => {
            setAllCursos(null);
          }, 400); {/* añado delay para que no desaparezca hasta que finalice la función */}
        }
      }}
    >
      <SheetContent className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl">
        <SheetHeader className="flex flex-row items-center justify-between pb-4">
          <SheetTitle className="text-xl font-bold">Perfil del estudiante</SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)] pr-4">
          <div className="space-y-6">
            {/* Student Information */}
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

                    <div className="text-sm font-medium text-muted-foreground">ID Legal:</div>
                    <div>{fullData?.student.id_legal}</div>

                    <div className="text-sm font-medium text-muted-foreground">Fecha de nacimiento:</div>
                    <div>{
                          fullData?.student.fecha_nac
                            .toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
                            || ''
                        }</div>

                    <div className="text-sm font-medium text-muted-foreground">Número de expediente:</div>
                    <div>{fullData?.student.num_expediente}</div>
                  </div>
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
                    <div className="text-sm font-medium text-muted-foreground">Ciclo:</div>
                      <SelectField
                        label="Periodo"
                        name="period"
                        value={selectedCycle}
                        onValueChange={handleCycleChange}
                        placeholder="Seleccionar ciclo"
                        options={cycleOptions}
                      />
                  </div>
                  {selectedCycle ? <PdfCertificateGeneratorButton student_data={fullData!} cycle_code={selectedCycle}/> : ""}

                  {/* Display selected year's cycle (degree) and courses */}
                  {(allCursos ?? []).map((curso, idx) => (
                  <div key={curso.id_expediente} className="mt-6">
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground">
                        {idx + 1}° ({idx === 0 ? "primero" : idx === 1 ? "segundo" : "tercero"}) | {curso.ano_inicio}-{curso.ano_fin}
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
                          {(curso.enrollments ?? []).map(modulo => (
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
