import { z } from "zod";

export const EnrollmentSchema = z.object({
  id_matricula: z.number().int().positive().min(1),
  id_expediente: z.number().int().positive().min(1),
  id_modulo: z.number().int().positive().min(1),
  status: z.enum(['Matricula', 'Convalidada', 'Exenta', 'Trasladada']),
  completion_status: z
    .enum(['En proceso', 'Completado', 'Fallido', 'Retirado'])
});

export const createEnrollmentSchema = EnrollmentSchema.omit({ id_matricula: true });
export type PostEnrollment = z.infer<typeof createEnrollmentSchema>;
export type Enrollment = z.infer<typeof EnrollmentSchema>;