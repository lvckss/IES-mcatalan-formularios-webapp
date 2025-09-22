import { z } from "zod";

export const GroupSchema = z.object({
    id_grupo: z.number().int().positive().min(1),
    nombre: z.string().max(120),
    descripcion: z.string().max(255),
});

export const createGroupSchema = GroupSchema.omit({ id_grupo: true });
export type PostGroup = z.infer<typeof createGroupSchema>;
export type Group = z.infer<typeof GroupSchema>;

export const GroupMemberSchema = z.object({
    id_grupo: z.number().int().positive(),
    id_estudiante: z.number().int().positive()
});

export type GroupMember = z.infer<typeof GroupMemberSchema>;