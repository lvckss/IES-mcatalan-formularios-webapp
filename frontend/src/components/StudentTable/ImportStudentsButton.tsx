import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type ImportResponse = {
    importedCount: number;
    rejectedCount: number;
    rejectedReport: string | null;
};

function downloadTextFile(content: string, fileName: string) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();

    URL.revokeObjectURL(url);
}

export default function ImportStudentsButton() {
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (file: File): Promise<ImportResponse> => {
            const res = await api.students["import"].$post({
                form: {
                    file,
                },
            });

            const data = await res.json();

            if (!res.ok) {
                const errorMessage =
                    typeof data === "object" &&
                        data !== null &&
                        "error" in data &&
                        typeof data.error === "string"
                        ? data.error
                        : "No se pudo importar el Excel";

                throw new Error(errorMessage);
            }

            return data as ImportResponse;
        },
        onSuccess: async (data) => {
            toast("Importación completada", {
                description: `${data.importedCount} importados · ${data.rejectedCount} rechazados`,
            });

            if (data.rejectedReport) {
                const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
                downloadTextFile(data.rejectedReport, `rechazos-importacion-${ts}.txt`);
            }

            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["get-total-students"] }),
                queryClient.invalidateQueries({ queryKey: ["students-allFullInfo"] }),
                queryClient.invalidateQueries({ queryKey: ["students-by-filter"] }),
                queryClient.invalidateQueries({ queryKey: ["student-by-legal"] }),
            ]);
        },
        onError: (error) => {
            alert(error instanceof Error ? error.message : "Error al importar");
        },
    });

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    mutation.mutate(file);
                    e.currentTarget.value = "";
                }}
            />

            <Button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={mutation.isPending}
            >
                {mutation.isPending ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importando...
                    </>
                ) : (
                    <>
                        <FileSpreadsheet className="mr-2 h-5 w-5" />
                        Importar estudiantes desde Excel
                    </>
                )}
            </Button>
        </>
    );
}