import { z } from "zod";

export const StudentSchema = z.object({
    id_student: z.number().int().positive().min(1),
    nombre: z.string().max(50),
    apellido1: z.string().max(50),
    apellido2: z.string().max(50),
    id_legal: z.string().min(9).max(9),
    fecha_nacimiento: z.string().min(10).max(10),
    codigo_expediente: z.string().max(6),
});

export const createStudentSchema = StudentSchema.omit({ id_student: true });
export type PostStudent = z.infer<typeof createStudentSchema>;
export type Student = z.infer<typeof StudentSchema>;