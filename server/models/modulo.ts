import { z } from "zod";

export const moduloSchema = z.object({
    id_modulo: z.number(),
    codigo_modulo: z.string().max(10),
    nombre_modulo: z.string().max(100),
    ciclo_asignado: z.string().max(50),
    duracion: z.number().min(1), // Suponiendo que la duración mínima de un módulo es 1 (horas, semanas, etc.)
});

export const createModuloSchema = moduloSchema.omit({ id_modulo: true });
export type Modulo = z.infer<typeof createModuloSchema>;