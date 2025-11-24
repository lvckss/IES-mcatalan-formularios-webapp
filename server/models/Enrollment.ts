import { z } from "zod";

export const EnrollmentSchema = z.object({
  id_matricula: z.number().int().positive().min(1),
  id_expediente: z.number().int().positive().min(1),
  id_modulo: z.number().int().positive().min(1),
  id_estudiante: z.number(),
  nota: z.enum([
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "10-MH", "10-Matr. Honor",
    "CV", "CV-5", "CV-6", "CV-7", "CV-8", "CV-9", "CV-10", "CV-10-MH",
    "TRAS-5", "TRAS-6", "TRAS-7", "TRAS-8", "TRAS-9", "TRAS-10", "TRAS-10-MH",
    "RC", "NE", "APTO", "NO APTO", "EX"
  ]).nullable()
});

export const createEnrollmentSchema = EnrollmentSchema.omit({ id_matricula: true });
export type PostEnrollment = z.infer<typeof createEnrollmentSchema>;
export type Enrollment = z.infer<typeof EnrollmentSchema>;