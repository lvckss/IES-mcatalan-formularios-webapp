import { z } from "zod";

export const TipoCicloEnum = z.enum(["GM", "GS"]); 

export type NotaEnum =
  | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10"
  | "10-MH" | "10-Matr. Honor"
  | "CV" | "CV-5" | "CV-6" | "CV-7" | "CV-8" | "CV-9" | "CV-10" | "CV-10-MH"
  | "TRAS-5" | "TRAS-6" | "TRAS-7" | "TRAS-8" | "TRAS-9" | "TRAS-10" | "TRAS-10-MH"
  | "RC" | "NE" | "APTO" | "NO APTO" | "EX";

export type NotasMasAltasPorCicloReturn = {
  id_ciclo: number;     // curso concreto (1º o 2º) dentro del ciclo
  id_modulo: number;
  modulo: string;
  codigo_modulo: string;
  mejor_nota: NotaEnum | null;
  mejor_ano_inicio: number | null;
  mejor_ano_fin: number | null;
  convocatoria: number | null;
};

export const CycleSchema = z.object({
  id_ciclo: z.number().int().positive().min(1),
  curso: z.string().max(5),
  nombre: z.string().max(100),
  codigo: z.string().max(20),
  norma_1: z.string(),
  norma_2: z.string(),
  ley: z.number().positive().min(1),
  tipo_ciclo: TipoCicloEnum,
});

export const createCycleSchema = CycleSchema.omit({ id_ciclo: true });
export const ByNameCycleSchema = CycleSchema.omit({ id_ciclo: true, curso: true });
export type PostCycle = z.infer<typeof createCycleSchema>;
export type Cycle = z.infer<typeof CycleSchema>;

export type TipoCiclo = z.infer<typeof TipoCicloEnum>;