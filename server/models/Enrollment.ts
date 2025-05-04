import { z } from "zod";

export const EnrollmentSchema = z.object({
  id_matricula: z.number().int().positive().min(1),
  id_expediente: z.number().int().positive().min(1),
  id_modulo: z.number().int().positive().min(1),
  status: z.enum(['Matricula', 'Convalidada', 'Exenta', 'Trasladada']),
  completion_status: z
    .enum(['En proceso', 'Completado', 'Fallido', 'Retirado']),
  nota: z.preprocess(
    (v) => v === '' || v == null ? null : Number(v),
    z.number().min(0).max(10).nullable()
  )
});

export const createEnrollmentSchema = EnrollmentSchema.omit({ id_matricula: true });
export type PostEnrollment = z.infer<typeof createEnrollmentSchema>;
export type Enrollment = z.infer<typeof EnrollmentSchema>;