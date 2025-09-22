import { z } from "zod";

export const StudentSchema = z.object({
  id_estudiante: z.number().int().positive().min(1),
  nombre: z.string().max(100),
  apellido_1: z.string().max(100),
  apellido_2: z.string().max(100).optional().nullable().optional(), // cuando no hay valor (undefined) se convierte en null
  sexo: z.enum(['Masculino', 'Femenino', 'Indefinido']),
  num_tfno: z.string().max(20).optional().nullable().optional(),
  id_legal: z.string().max(20),
  tipo_id_legal: z.string().max(50),
  fecha_nac: z.preprocess((arg) => {
    if (typeof arg === "string" || arg instanceof Date) {
      const date = new Date(arg);
      if (!isNaN(date.getTime())) return date;
    }
    return arg;
  }, z.date()),
  observaciones: z.string().max(5000).optional(),
  requisito_academico: z.boolean().default(true),
});

export const createStudentSchema = StudentSchema.omit({ id_estudiante: true });
export type PostStudent = z.infer<typeof createStudentSchema>;
export type Student = z.infer<typeof StudentSchema>;