import * as React from "react";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { deleteRecordCascade } from "@/components/StudentPanel/StudentProfilePanel"; // adjust the path if needed

type DeleteRecordCascadeButtonProps = {
  expedienteId: number;
  studentId: number;            // for invalidations (full-student-data, etc.)
  cicloId?: number | null;      // for invalidations of 'notas-altas' scoped by ciclo
  className?: string;
  onDeleted?: (payload: { count: number }) => void;
};

export const DeleteRecordCascadeButton: React.FC<DeleteRecordCascadeButtonProps> = ({
  expedienteId,
  studentId,
  cicloId,
  className,
  onDeleted,
}) => {
  const qc = useQueryClient();

  // stages: 0 = idle, 1 = first confirm, 2 = final confirm
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  const [open, setOpen] = useState(false);

  // auto-cancel after some seconds if user pauses mid-flow
  useEffect(() => {
    if (stage === 0) return;
    const t = setTimeout(() => {
      setStage(0);
      setOpen(false);
    }, 7000);
    return () => clearTimeout(t);
  }, [stage]);

  const mutation = useMutation({
    mutationFn: async () => {
      return deleteRecordCascade(expedienteId);
    },
    onSuccess: async (res) => {
      const count = res?.count ?? 0;
      toast.success(
        count > 1
          ? `Expediente eliminado. ${count - 1} registros relacionados también fueron borrados.`
          : "Expediente eliminado correctamente."
      );

      // Invalidate related queries
      qc.invalidateQueries({ queryKey: ["full-student-data", studentId] });
      qc.refetchQueries({ queryKey: ["full-student-data", studentId], type: "active" });

      qc.invalidateQueries({ queryKey: ["students-by-filter"] });
      qc.refetchQueries({ queryKey: ["students-by-filter"], type: "active" });

      qc.invalidateQueries({ queryKey: ["can-approve", studentId] });
      qc.refetchQueries({ queryKey: ["can-approve", studentId], type: "active" });

      qc.invalidateQueries({ queryKey: ["can-enroll-period", studentId] });
      qc.refetchQueries({ queryKey: ["can-enroll-period", studentId], type: "active" });

      if (cicloId != null) {
        qc.invalidateQueries({ queryKey: ["notas-altas", studentId, cicloId] });
        qc.refetchQueries({ queryKey: ["notas-altas", studentId, cicloId], type: "active" });
      } else {
        qc.invalidateQueries({ queryKey: ["notas-altas", studentId] });
        qc.refetchQueries({ queryKey: ["notas-altas", studentId], type: "active" });
      }

      onDeleted?.({ count });
      setStage(0);
      setOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "No se pudo borrar el expediente.");
      setStage(0);
      setOpen(false);
    },
  });

  const handlePrimaryClick = () => {
    if (mutation.isPending) return;
    setStage(1);
    setOpen(true);
  };

  const handleSecondConfirm = () => {
    if (mutation.isPending) return;
    setStage(2);
  };

  const handleFinalDelete = () => {
    if (mutation.isPending) return;
    mutation.mutate();
  };

  const resetFlow = () => {
    if (mutation.isPending) return;
    setStage(0);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={(v) => {
      // Only allow closing; opening is driven by the first click
      if (!v) resetFlow();
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={className}
          onClick={handlePrimaryClick}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "…" : <Trash2 className="h-2 w-2 text-red-700"/>}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-72" side="top" align="center">
        {stage === 1 && (
          <div className="space-y-3">
            <p className="text-sm">
              Vas a borrar este curso escolar y sus sucesores, ¿estás seguro?
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={resetFlow} disabled={mutation.isPending}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleSecondConfirm} disabled={mutation.isPending}>
                Confirmar
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">Se cancela automáticamente en 7 s.</p>
          </div>
        )}

        {stage === 2 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">
              Confirmación final
            </p>
            <p className="text-sm">
              Esta acción es <span className="font-semibold">irreversible</span>. ¿Eliminar definitivamente?
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={resetFlow} disabled={mutation.isPending}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleFinalDelete}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Borrando…" : "Sí, eliminar"}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">Se cancela automáticamente en 7 s.</p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};