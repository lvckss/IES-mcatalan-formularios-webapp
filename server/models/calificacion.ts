import { z } from "zod";

export const calificacionSchema = z.object({
    id_calificacion: z.number(),
    id_alumno: z.number(),
    id_modulo: z.number(),
    calificacion: z.number().min(0).max(10), // Ejemplo de nota numérica entre 0 y 10
    convocatoria: z.number().min(1).max(6), // Suponiendo que hay 6 convocatorias posibles
    curso_escolar: z.number().min(2000), // Suponiendo que el año escolar debe ser mayor o igual a 2000
    estado_modulo: z.string().max(50),
    ano_escolar: z.number().min(2000), // Suponiendo que el año escolar debe ser mayor o igual a 2000
});

export const createCalificacionSchema = calificacionSchema.omit({ id_calificacion: true });
export type Calificacion = z.infer<typeof createCalificacionSchema>;