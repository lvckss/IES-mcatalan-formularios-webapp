import { z } from "zod";

export const firmanteSchema = z.object({
    id_firmante: z.number(),
    nombre_firmante: z.string().max(100),
    cargo: z.string().max(100),
});

export const createFirmanteSchema = firmanteSchema.omit({ id_firmante: true });
export type Firmante = z.infer<typeof createFirmanteSchema>;