import { z } from "zod";

export const moduloSchema = z.object({
    id_modulo: z.number().int().positive().min(1),
    nombre: z.string().max(150),
    cod_mod: z.string().min(4).max(4),
    cod_ciclo: z.string().min(6).max(15), // Familia Profesional + Leyes de FP: LOGSE, LOE, LOMCE, LOFP | Ejemplo: SAN301_LOE
    ciclo: z.string().max(50),
    curso: z.number().int().positive().min(1).max(1),    
});

export const createModuloSchema = moduloSchema.omit({ id_modulo: true });
export type Modulo = z.infer<typeof createModuloSchema>;