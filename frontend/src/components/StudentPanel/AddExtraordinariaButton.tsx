// src/components/StudentPanel/addExtraordinariaButton.tsx
import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
} from "@/components/ui/tooltip";

import { toast } from "sonner";

import { api } from "@/lib/api";

import type { PostEnrollment, PostRecord } from "@/types";

import { FilePlus2, Loader2 } from "lucide-react";

async function createRecord(recordData: PostRecord) {
    const response = await api.records.$post({ json: recordData });
    if (!response.ok) throw new Error("Error al crear el expediente");
    return response.json();
}

async function createMatricula(enrollmentData: PostEnrollment) {
    const response = await api.enrollments.$post({ json: enrollmentData });
    if (!response.ok) throw new Error("Error al crear las matrículas");
    return response.json();
}

type BaseRecordCore = {
    ano_inicio: number;
    ano_fin: number;
    turno: string;
    id_ciclo: number;
};

interface AddExtraordinariaButtonProps {
    studentId: number;
    baseRecord: BaseRecordCore | null;      // Datos del Ordinaria
    failingModuleIds: number[];             // IDs de módulos suspendidos
    disabled?: boolean;                     // control externo de deshabilitado
    className?: string;
    onCreated?: (newRecordId: number) => void; // para seleccionar "Extraordinaria" tras crear
}

const AddExtraordinariaButton: React.FC<AddExtraordinariaButtonProps> = ({
    studentId,
    baseRecord,
    failingModuleIds,
    disabled,
    className,
    onCreated,
}) => {
    const qc = useQueryClient();

    const mutation = useMutation({
        mutationFn: async () => {
            if (!baseRecord) {
                throw new Error("No hay expediente 'Ordinaria' base para clonar.");
            }

            const payload: PostRecord = {
                id_estudiante: studentId,
                ano_inicio: baseRecord.ano_inicio,
                ano_fin: baseRecord.ano_fin,
                turno: baseRecord.turno,
                convocatoria: "Extraordinaria",
                id_ciclo: baseRecord.id_ciclo,
                vino_traslado: false,
                fecha_pago_titulo: null,
            };

            // 1) Crear expediente Extraordinaria
            const created = await createRecord(payload);
            const newId: number = created?.expediente.id_expediente

            if (!newId) {
                throw new Error("No se pudo obtener el id del nuevo expediente.");
            }

            // 2) Crear matrículas de módulos suspendidos (nota null inicialmente)
            if (failingModuleIds.length > 0) {
                await Promise.all(
                    failingModuleIds.map((id_modulo) =>
                        createMatricula({
                            id_expediente: newId,
                            id_estudiante: studentId,
                            id_modulo,
                            nota: 'NE',
                        })
                    )
                );
            }

            return { newId };
        },
        onSuccess: ({ newId }) => {
            toast.success("Extraordinaria creada y matrículas (suspensas) copiadas.");
            qc.invalidateQueries({ queryKey: ["full-student-data", studentId] });
            qc.invalidateQueries({ queryKey: ["can-approve", studentId] });
            qc.invalidateQueries({ queryKey: ["can-enroll-period", studentId] });
            onCreated?.(newId);
        },
        onError: (err: any) => {
            toast.error(err?.message ?? "No se pudo crear la Extraordinaria.");
        },
    });

    return (
        <TooltipProvider delayDuration={150}>
            <Tooltip>
                <TooltipTrigger asChild>
                    {/* envoltorio para que el tooltip funcione incluso si el botón está disabled */}
                    <span className="inline-flex">
                        <Button
                            variant="outline"
                            className={`h-9 w-9 p-0 ${className ?? ""}`} // botón solo-ícono
                            onClick={() => mutation.mutate()}
                            disabled={Boolean(disabled) || mutation.isPending}
                            type="button"
                            aria-label="Crear Extraordinaria"
                        >
                            {mutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <FilePlus2 className="h-4 w-4" />
                            )}
                            <span className="sr-only">Crear Extraordinaria</span>
                        </Button>
                    </span>
                </TooltipTrigger>

                <TooltipContent>
                    <p>Crear Extraordinaria</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default AddExtraordinariaButton;
