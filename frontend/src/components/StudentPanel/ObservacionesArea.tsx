import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { api } from "@/lib/api"
import { useQuery, useQueries, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"

import { Textarea } from "@/components/ui/textarea"
import React from "react"


async function patchStudentObservaciones(id: number, observaciones: string) {
    const response = await api.students[":id"].observaciones.$patch({
        param: { id: String(id) },
        json: { observaciones },
    });

    if (!response.ok) {
        throw new Error("No se pudo actualizar las observaciones");
    }

    return response.json();
}


const FormSchema = z.object({
    observaciones: z
        .string()
        .max(5000, {
            message: "Las observaciones no pueden tener más de 5000 caracteres.",
        }),
})

interface TextareaFormProps {
    observaciones: string;
    id_estudiante: number;
}

const TextareaForm: React.FC<TextareaFormProps> = ({ observaciones, id_estudiante }) => {
    /* ---------- 1. mutation ---------- */
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: ({ observaciones }: { observaciones: string }) =>
            patchStudentObservaciones(id_estudiante, observaciones),

        // Mantén la caché sincronizada (elige A o B)
        onSuccess: () => {
            toast.success("Observaciones actualizadas ✅");
            queryClient.invalidateQueries({ queryKey: ['full-student-data', id_estudiante] });
        },
        onError: (err: any) =>
            toast.error(err.message ?? "Error al actualizar las observaciones"),
    });

    /* ---------- 2. react-hook-form ---------- */
    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: { observaciones: observaciones ?? "" },
    })

    /* ---------- 3. submit ---------- */
  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    mutation.mutate({ observaciones: data.observaciones });
  };

    return (
        <div className="pt-5">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-2">
                    <FormField
                        control={form.control}
                        name="observaciones"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Textarea
                                        placeholder="Observaciones..."
                                        className="resize-none"
                                        disabled={mutation.isPending}
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Añade las observaciones del alumno en este campo. (es necesario guardarlas con el botón inferior)
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button size="sm" variant="outline" type="submit" className="w-30">
                        {"Guardar"}
                    </Button>
                </form>
            </Form>
        </div>
    )
}

export default TextareaForm;
