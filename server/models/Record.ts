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
  turno: z.enum(['Diurno', 'Vespertino', 'Nocturno', 'Distancia']),
  fecha_pago_titulo: z.preprocess((arg) => {
    if (typeof arg === "string" || arg instanceof Date) {
      const date = new Date(arg);
      if (!isNaN(date.getTime())) return date;
    }
    return arg;
  }, z.date().optional()).nullable(),
});

export const createRecordSchema = RecordSchema.omit({ id_expediente: true });
export type PostRecord = z.infer<typeof createRecordSchema>;
export type Record = z.infer<typeof RecordSchema>;