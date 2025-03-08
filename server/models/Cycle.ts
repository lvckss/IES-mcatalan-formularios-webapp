import { z } from "zod";

export const CycleSchema = z.object({
  id_ciclo: z.number().int().positive().min(1),
  curso: z.string().max(5),
  nombre: z.string().max(100),
  codigo: z.string().max(20),
  norma_1: z.string(),
  norma_2: z.string(),
});

export const createCycleSchema = CycleSchema.omit({ id_ciclo: true });
export type PostCycle = z.infer<typeof createCycleSchema>;
export type Cycle = z.infer<typeof CycleSchema>;