import { z } from "zod";

export const cicloFormativoSchema = z.object({
    id_ciclo: z.number(),
    nombre_ciclo: z.string().max(100),
    nivel: z.string().max(50),
});

export const createCicloFormativoSchema = cicloFormativoSchema.omit({ id_ciclo: true });
export type CicloFormativo = z.infer<typeof createCicloFormativoSchema>;