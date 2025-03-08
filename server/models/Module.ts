import { z } from "zod";

export const ModuleSchema = z.object({
  id_modulo: z.number().int().positive().min(1),
  nombre: z.string().max(100),
  id_ciclo: z.number().int().positive().min(1),
  curso: z.string().max(5),
});

export const createModuleSchema = ModuleSchema.omit({ id_modulo: true });
export type PostModule = z.infer<typeof createModuleSchema>;
export type Module = z.infer<typeof ModuleSchema>;