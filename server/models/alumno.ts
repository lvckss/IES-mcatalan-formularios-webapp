import { z } from "zod";

export const alumnoSchema = z.object({
    id_alumno: z.number(),
    nombre: z.string().max(50),
    apellido1: z.string().max(50),
    apellido2: z.string().max(50),
    id_legal: z.string().min(9).max(9),
    fecha_nacimiento: z.string().min(10).max(10),
    codigo_expediente: z.string().max(6),
});

export const createAlumnoSchema = alumnoSchema.omit({ id_alumno: true });
export type Alumno = z.infer<typeof createAlumnoSchema>;