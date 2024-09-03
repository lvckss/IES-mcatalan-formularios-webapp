import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createRegulacionSchema } from "../models/regulacion";
import { getRegulaciones, createRegulacion, getRegulacionById, deleteRegulacion } from "../controllers/regulacionesController";

export const regulacionesRoute = new Hono()
    .get("/", async (c) => {
        const result = await getRegulaciones();
        return c.json({ regulaciones: result });
    })
    .post("/", zValidator("json", createRegulacionSchema), async (c) => {
        const regulacion = await c.req.valid("json");
        const result = await createRegulacion(regulacion);
        c.status(201);
        return c.json(result[0]);
    })
    .get("/:id{[0-9]+}", async (c) => {
        const id = Number.parseInt(c.req.param("id"));
        const result = await getRegulacionById(id);
        if (result.length === 0) {
            return c.notFound();
        }
        return c.json({ regulacion: result[0] });
    })
    .delete("/:id{[0-9]+}", async (c) => {
        const id = Number.parseInt(c.req.param("id"));
        const result = await deleteRegulacion(id);
        if (result.length === 0) {
            return c.notFound();
        }
        return c.json({ regulacion: result[0] });
    });
