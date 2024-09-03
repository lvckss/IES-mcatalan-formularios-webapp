import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createCertificadoSchema } from "../models/certificado";
import { getCertificados, createCertificado, getCertificadoById, deleteCertificado } from "../controllers/certificadosController";

export const certificadosRoute = new Hono()
    .get("/", async (c) => {
        const result = await getCertificados();
        return c.json({ certificados: result });
    })
    .post("/", zValidator("json", createCertificadoSchema), async (c) => {
        const certificado = await c.req.valid("json");
        const result = await createCertificado(certificado);
        c.status(201);
        return c.json(result[0]);
    })
    .get("/:id{[0-9]+}", async (c) => {
        const id = Number.parseInt(c.req.param("id"));
        const result = await getCertificadoById(id);
        if (result.length === 0) {
            return c.notFound();
        }
        return c.json({ certificado: result[0] });
    })
    .delete("/:id{[0-9]+}", async (c) => {
        const id = Number.parseInt(c.req.param("id"));
        const result = await deleteCertificado(id);
        if (result.length === 0) {
            return c.notFound();
        }
        return c.json({ certificado: result[0] });
    });