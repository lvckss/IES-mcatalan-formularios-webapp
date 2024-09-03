import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createFirmanteSchema } from "../models/firmante";
import { getFirmantes, createFirmante, getFirmanteById, deleteFirmante } from "../controllers/firmantesController";

export const firmantesRoute = new Hono()
    .get("/", async (c) => {
        const result = await getFirmantes();
        return c.json({ firmantes: result });
    })
    .post("/", zValidator("json", createFirmanteSchema), async (c) => {
        const firmante = await c.req.valid("json");
        const result = await createFirmante(firmante);
        c.status(201);
        return c.json(result[0]);
    })
    .get("/:id{[0-9]+}", async (c) => {
        const id = Number.parseInt(c.req.param("id"));
        const result = await getFirmanteById(id);
        if (result.length === 0) {
            return c.notFound();
        }
        return c.json({ firmante: result[0] });
    })
    .delete("/:id{[0-9]+}", async (c) => {
        const id = Number.parseInt(c.req.param("id"));
        const result = await deleteFirmante(id);
        if (result.length === 0) {
            return c.notFound();
        }
        return c.json({ firmante: result[0] });
    });
