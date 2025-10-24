import { z } from "zod";

export const LawSchema = z.object({
  id_ley: z.number().int().positive().min(1),
  nombre_ley: z.string()
});

export const createLawSchema = LawSchema.omit({ id_ley: true });
export type PostLaw = z.infer<typeof createLawSchema>;
export type Law = z.infer<typeof LawSchema>;