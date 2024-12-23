import { z } from "zod";

export const cicloSchema = z.object({
    id_ciclo: z.number(),
    curso: z.string(),
    nombre: z.string().max(100),
    codigo: z.string(),
    norma_1: z.string(),
    norma_2: z.string(),
});

export const createCicloSchema = cicloSchema.omit({ id_ciclo: true });
export type Ciclo = z.infer<typeof createCicloSchema>;