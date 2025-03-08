import { z } from "zod";

// EXPEDIENTE

export const RecordSchema = z.object({
  id_expediente: z.number().int().positive().min(1),
  id_estudiante: z.number().int().positive().min(1),
  ano_inicio: z.number().int(),
  ano_fin: z.number().int(),
  estado: z.enum(['Activo', 'Finalizado', 'Abandonado', 'En pausa']),
  id_ciclo: z.number().int().positive().min(1),
  curso: z.string().max(5),
});

export const createRecordSchema = RecordSchema.omit({ id_expediente: true });
export type PostRecord = z.infer<typeof createRecordSchema>;
export type Record = z.infer<typeof RecordSchema>;