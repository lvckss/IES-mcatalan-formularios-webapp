import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createAlumnoSchema } from "../models/alumno";
import { getAlumnos, createAlumno, getAlumnoById, deleteAlumno } from "../controllers/alumnosController";

export const alumnosRoute = new Hono()
    .get("/", async (c) => {
        const result = await getAlumnos();
        return c.json({ alumnos: result });
    })
    .post("/", zValidator("json", createAlumnoSchema), async (c) => {
        const alumno = await c.req.valid("json");
        const result = await createAlumno(alumno);
        c.status(201);
        return c.json(result[0]);
    })
    .get("/:id{[0-9]+}", async (c) => {
        const id = Number.parseInt(c.req.param("id"));
        const result = await getAlumnoById(id);
        if (result.length === 0) {
            return c.notFound();
        }
        return c.json({ alumno: result[0] });
    })
    .delete("/:id{[0-9]+}", async (c) => {
        const id = Number.parseInt(c.req.param("id"));
        const result = await deleteAlumno(id);
        if (result.length === 0) {
            return c.notFound();
        }
        return c.json({ alumno: result[0] });
    });