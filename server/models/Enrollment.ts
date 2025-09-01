import { z } from "zod";

export const EnrollmentSchema = z.object({
  id_matricula: z.number().int().positive().min(1),
  id_expediente: z.number().int().positive().min(1),
  id_modulo: z.number().int().positive().min(1),
  id_estudiante: z.number(),
  nota: z.enum([
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
    '10-MH',
    'CV', 'CV-5', 'CV-6', 'CV-7', 'CV-8', 'CV-9', 'CV-10',
    'AM', 'RC', 'NE', 'APTO', 'NO APTO'
  ]).nullable()
});

export const createEnrollmentSchema = EnrollmentSchema.omit({ id_matricula: true });
export type PostEnrollment = z.infer<typeof createEnrollmentSchema>;
export type Enrollment = z.infer<typeof EnrollmentSchema>;