import { z } from "zod";

export const DirectivoSchema = z.object({
    cargo: z.string().max(25),
    nombre: z.string().max(200),
})

export type Directivo = z.infer<typeof DirectivoSchema>;