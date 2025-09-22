import React from "react";

import { useQuery } from "@tanstack/react-query";
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { Directivo, FullStudentData } from "@/types";

import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

import { FileUser, Loader2 } from "lucide-react";

import { CertificadoObtencionDocument } from "@/pdf/certificadoObtencionTituloDocument";
import { CertificadoTrasladoDocument } from "@/pdf/certificadoTrasladoDocument";

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

async function getCicloByCodigo({ codigo }: { codigo: string }) {
    const response = await api.cycles.code[":codigo"].$get({ param: { codigo } });
    if (!response) throw new Error("server error");
    const data = await response.json();
    return data.ciclo;
}

async function getDirectivoDataByCargo(cargo: string): Promise<Directivo> {
    const response = await api.directivos[":cargo"].$get({ param: { cargo } });
    const data = await response.json();
    return data.directivo;
}

async function getNotasAltasEstudiantePorCiclo(
    id_estudiante: number,
    id_ciclo: number
): Promise<NotasMasAltasPorCicloReturn[]> {
    const response = await api.enrollments.notasAltas[":id_estudiante"][":id_ciclo"].$get({
        param: { id_estudiante: String(id_estudiante), id_ciclo: String(id_ciclo) },
    });
    if (!response.ok) throw new Error("Error obteniendo las notas más altas del estudiante.");
    const data = await response.json();
    return data.result as NotasMasAltasPorCicloReturn[];
}

interface PdfCertificateGeneratorButtonProps {
    student_data: FullStudentData;
    cycle_code: string;
}

const PdfCertificateGeneratorButton: React.FC<PdfCertificateGeneratorButtonProps> = ({
    student_data,
    cycle_code,
}) => {
    const [certType, setCertType] = React.useState<"obtencion" | "traslado" | "">("");
    const [isGenerating, setIsGenerating] = React.useState(false);

    const studentId = student_data.student.id_estudiante;

    const { data: secretarioData } = useQuery({
        queryKey: ["directivo", "Secretario"],
        queryFn: () => getDirectivoDataByCargo("Secretario"),
        staleTime: 5 * 60 * 1000,
    });

    const { data: directorData } = useQuery({
        queryKey: ["directivo", "Director"],
        queryFn: () => getDirectivoDataByCargo("Director"),
        staleTime: 5 * 60 * 1000,
    });

    const { data: cicloData } = useQuery({
        queryKey: ["ciclo", cycle_code],
        queryFn: ({ queryKey }) => {
            const [_key, code] = queryKey;
            return getCicloByCodigo({ codigo: code as string });
        },
        enabled: Boolean(cycle_code),
        staleTime: 5 * 60 * 1000,
    });

    const cicloList = React.useMemo(() => {
        if (!cicloData) return [];
        return Array.isArray(cicloData) ? cicloData : [cicloData];
    }, [cicloData]);

    const cicloForQuery = cicloList[0];

    const { data: mergedEnrollments } = useQuery({
        queryKey: ["notas-altas", studentId, cicloForQuery?.id_ciclo],
        queryFn: () => getNotasAltasEstudiantePorCiclo(studentId, cicloForQuery!.id_ciclo),
        enabled: Boolean(studentId && cicloForQuery?.id_ciclo),
        staleTime: 5 * 60 * 1000,
    });

    const handleGenerate = async () => {
        if (!certType) {
            toast.error("Selecciona un tipo de certificado.");
            return;
        }
        if (!secretarioData || !directorData || !cicloForQuery || !mergedEnrollments || mergedEnrollments.length === 0) {
            toast.error("Faltan datos para generar el certificado.");
            return;
        }

        const certificateData = {
            student_data,
            cycle_data: cicloForQuery,
            director_data: directorData,
            secretario_data: secretarioData,
            merged_enrollments: mergedEnrollments,
        };

        try {
            setIsGenerating(true);
            const element =
                certType === "traslado" ? (
                    <CertificadoTrasladoDocument data={certificateData} />
                ) : (
                    <CertificadoObtencionDocument data={certificateData} />
                );

            const blob = await pdf(element).toBlob();
            const nombre = `${student_data.student.apellido_1 ?? ""} ${student_data.student.apellido_2 ?? ""} ${student_data.student.nombre ?? ""
                }`.trim().replace(/\s+/g, "_");

            const filename =
                certType === "traslado"
                    ? `certificado_traslado_${nombre || "alumno"}.pdf`
                    : `certificado_obtencion_titulo_${nombre || "alumno"}.pdf`;

            saveAs(blob, filename);
            toast.success("PDF generado correctamente.");
        } catch (err) {
            console.error("❌ Error generando PDF:", err);
            toast.error("No se pudo generar el PDF.");
        } finally {
            setIsGenerating(false);
        }
    };

    const disabled =
        isGenerating ||
        !cicloForQuery ||
        !mergedEnrollments ||
        mergedEnrollments.length === 0 ||
        !directorData ||
        !secretarioData ||
        !certType;

    return (
        <div className="flex flex-wrap items-end gap-3">
            <div className="w-full flex flex-col items-center gap-4">
                <div className="w-full max-w-xl rounded-2xl border bg-muted/30 p-5 shadow-sm">
                    <div className="flex flex-col items-center gap-3">
                        <Label className="text-sm font-medium text-center">
                            Tipo de certificado
                        </Label>

                        <RadioGroup
                            value={certType}
                            onValueChange={(v) => setCertType(v as "obtencion" | "traslado")}
                            className="flex flex-wrap justify-center items-center gap-3"
                            aria-label="Tipo de certificado"
                        >
                            {/* Obtención */}
                            <div className="relative">
                                <RadioGroupItem
                                    id="cert-obt"
                                    value="obtencion"
                                    disabled={isGenerating}
                                    className="peer sr-only"
                                />
                                <Label
                                    htmlFor="cert-obt"
                                    className="inline-flex cursor-pointer select-none items-center gap-2 rounded-full border px-4 py-2 transition
                       hover:bg-accent hover:text-accent-foreground
                       peer-data-[state=checked]:bg-primary/5
                       peer-data-[state=checked]:border-primary
                       peer-data-[state=checked]:ring-1
                       peer-data-[state=checked]:ring-primary/30"
                                >
                                    Obtención del título
                                </Label>
                            </div>

                            {/* Traslado */}
                            <div className="relative">
                                <RadioGroupItem
                                    id="cert-tra"
                                    value="traslado"
                                    disabled={isGenerating}
                                    className="peer sr-only"
                                />
                                <Label
                                    htmlFor="cert-tra"
                                    className="inline-flex cursor-pointer select-none items-center gap-2 rounded-full border px-4 py-2 transition
                       hover:bg-accent hover:text-accent-foreground
                       peer-data-[state=checked]:bg-primary/5
                       peer-data-[state=checked]:border-primary
                       peer-data-[state=checked]:ring-1
                       peer-data-[state=checked]:ring-primary/30"
                                >
                                    Traslado
                                </Label>
                            </div>
                            <Button
                                variant="outline"
                                onClick={handleGenerate}
                                disabled={disabled}
                                className="mt-1 w-full max-w-xs justify-center"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Generar certificado
                                    </>
                                ) : (
                                    <>
                                        <FileUser className="mr-2 h-5 w-5" />
                                        Generar certificado
                                    </>
                                )}
                            </Button>
                        </RadioGroup>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PdfCertificateGeneratorButton;