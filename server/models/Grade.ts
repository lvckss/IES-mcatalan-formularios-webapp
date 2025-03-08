import { z } from "zod";

export const GradeSchema = z.object({
  id_calificacion: z.number().int().positive().min(1),
  id_matricula: z.number().int().positive().min(1),
  nota: z.number().nullable().optional().transform(val => val ?? null),
});

export const createGradeSchema = GradeSchema.omit({ id_calificacion: true });
export type PostGrade = z.infer<typeof createGradeSchema>;
export type Grade = z.infer<typeof GradeSchema>;