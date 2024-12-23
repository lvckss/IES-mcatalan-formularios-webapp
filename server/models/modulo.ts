import { z } from "zod";

export const moduloSchema = z.object({
    id_modulo: z.number().int().positive().min(1),
    nombre: z.string().max(150),
    id_ciclo: z.string().min(6).max(15), // Familia Profesional + Leyes de FP: LOGSE, LOE, LOMCE, LOFP | Ejemplo: SAN301_LOE
    curso: z.string(),
});

export const createModuloSchema = moduloSchema;
export type Modulo = z.infer<typeof createModuloSchema>;