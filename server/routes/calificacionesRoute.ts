import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createCalificacionSchema } from "../models/calificacion";
import { getCalificaciones, createCalificacion, getCalificacionById, deleteCalificacion } from "../controllers/calificacionesController";

export const calificacionesRoute = new Hono()
    .get("/", async (c) => {
        const result = await getCalificaciones();
        return c.json({ calificaciones: result });
    })
    .post("/", zValidator("json", createCalificacionSchema), async (c) => {
        const calificacion = await c.req.valid("json");
        const result = await createCalificacion(calificacion);
        c.status(201);
        return c.json(result[0]);
    })
    .get("/:id{[0-9]+}", async (c) => {
        const id = Number.parseInt(c.req.param("id"));
        const result = await getCalificacionById(id);
        if (result.length === 0) {
            return c.notFound();
        }
        return c.json({ calificacion: result[0] });
    })
    .delete("/:id{[0-9]+}", async (c) => {
        const id = Number.parseInt(c.req.param("id"));
        const result = await deleteCalificacion(id);
        if (result.length === 0) {
            return c.notFound();
        }
        return c.json({ calificacion: result[0] });
    });