import * as React from "react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

import { type Enrollment } from "@/types";

// ======================= API (fuera del componente) =======================
// Borra la matrícula (id_matricula) y en cascada las posteriores del mismo
// alumno+módulo. Devuelve { matriculas_eliminadas, count }.
type DeleteCascadeSuccess = {
    matriculas_eliminadas: Array<Enrollment>;
    count: number;
};

export async function apiDeleteEnrollmentCascade(
    enrollmentId: number
): Promise<DeleteCascadeSuccess> {
    const res = await api.enrollments[":id"].cascade.$delete({
        param: { id: String(enrollmentId) },
    });

    const body = (await res.json()) as
        | DeleteCascadeSuccess
        | { error: unknown };

    if (!res.ok || "error" in body) {
        const msg =
            typeof (body as any)?.error === "string"
                ? (body as any).error
                : "No se pudo borrar la matrícula";
        throw new Error(msg);
    }

    // Aquí TS ya sabe que 'body' es DeleteCascadeSuccess
    return body;
}

// ======================= Componente botón =======================
type DeleteModuleCascadeButtonProps = {
    enrollmentId: number;              // id_matricula
    studentId: number;                 // para invalidar cache de este alumno
    onDeleted?: (payload?: { count: number }) => void; // callback opcional
    className?: string;
    disabled?: boolean;
};

export const DeleteModuleCascadeButton: React.FC<DeleteModuleCascadeButtonProps> = ({
    enrollmentId,
    studentId,
    onDeleted,
    className,
    disabled,
}) => {
    const qc = useQueryClient();
    const [open, setOpen] = useState(false);
    const [stage, setStage] = useState<0 | 1>(0); // doble confirmación

    const mutation = useMutation({
        mutationFn: async () => apiDeleteEnrollmentCascade(enrollmentId),
        onSuccess: (data) => {
            // Invalida todo lo que depende de este alumno
            qc.invalidateQueries({ queryKey: ["full-student-data", studentId] });
            qc.refetchQueries({ queryKey: ["full-student-data", studentId], type: "active" });

            qc.invalidateQueries({ queryKey: ["can-approve", studentId] });
            qc.refetchQueries({ queryKey: ["can-approve", studentId], type: "active" });

            qc.invalidateQueries({ queryKey: ["can-enroll-period", studentId] });
            qc.refetchQueries({ queryKey: ["can-enroll-period", studentId], type: "active" });

            qc.invalidateQueries({ queryKey: ["students-by-filter"] });

            toast.success(`Módulo eliminado${data.count > 1 ? ` (${data.count} matrículas en cascada)` : ""}.`);
            setOpen(false);
            setStage(0);
            onDeleted?.({ count: data.count });
        },
        onError: (err: any) => {
            toast.error(err?.message ?? "No se pudo eliminar el módulo.");
            setStage(0);
        },
    });

    return (
        <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setStage(0); }}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={className}
                    disabled={disabled || mutation.isPending}
                    aria-label="Eliminar módulo (en cascada)"
                    title="Eliminar módulo (en cascada)"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </PopoverTrigger>

            <PopoverContent align="end" className="w-80">
                {stage === 0 ? (
                    <div className="space-y-3">
                        <p className="text-sm">
                            Esto eliminará esta matrícula y{" "}
                            <span className="font-medium">todas las del mismo módulo en años posteriores</span> para este alumno.
                        </p>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setOpen(false)} disabled={mutation.isPending}>
                                Cancelar
                            </Button>
                            <Button variant="destructive" onClick={() => setStage(1)} disabled={mutation.isPending}>
                                Confirmar
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-sm">
                            <span className="font-medium">Confirmación final:</span> acción irreversible. ¿Eliminar definitivamente?
                        </p>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setStage(0)} disabled={mutation.isPending}>
                                Atrás
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => mutation.mutate()}
                                disabled={mutation.isPending}
                            >
                                {mutation.isPending ? "Eliminando…" : "Eliminar definitivamente"}
                            </Button>
                        </div>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
};
