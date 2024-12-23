import { z } from "zod";

export const StudentSchema = z.object({
    id_estudiante: z.number().int().positive().min(1),
    nombre: z.string().max(50),
    apellido_1: z.string().max(50),
    apellido_2: z.string().max(50),
    id_legal: z.string().min(9).max(9),
    fecha_nac: z.date(),
});

export const createStudentSchema = StudentSchema.omit({ id_estudiante: true });
export type PostStudent = z.infer<typeof createStudentSchema>;
export type Student = z.infer<typeof StudentSchema>;