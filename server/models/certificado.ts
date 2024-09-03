import { z } from "zod";


export const certificadoSchema = z.object({
    id_certificado: z.number(),
    id_alumno: z.number(),
    fecha_expedicion: z.string().min(10).max(10), // Aseguramos que sea una fecha en formato "YYYY-MM-DD"
    tipo_certificado: z.string().max(50),
    nota_media: z.string().max(10),
    estado_titulo: z.string().max(50),
    observaciones: z.string().optional(),
    requisito_academico: z.boolean(),
});

export const createCertificadoSchema = certificadoSchema.omit({ id_certificado: true });
export type Certificado = z.infer<typeof createCertificadoSchema>;