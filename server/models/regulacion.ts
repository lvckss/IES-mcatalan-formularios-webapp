import { z } from "zod";

export const regulacionSchema = z.object({
    id_regulacion: z.number(),
    id_ciclo: z.number(),
    ano_escolar: z.number().min(2000), // Suponiendo que el año escolar debe ser mayor o igual a 2000
    norma_legal: z.string().max(255),
});

export const createRegulacionSchema = regulacionSchema.omit({ id_regulacion: true });
export type Regulacion = z.infer<typeof createRegulacionSchema>;