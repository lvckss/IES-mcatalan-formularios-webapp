import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { query } from "../dbtest";

const alumnoSchema = z.object({
    id_alumno: z.number(),
    nombre: z.string().max(50),
    apellido1: z.string().max(50),
    apellido2: z.string().max(50),
    id_legal: z.string().min(9).max(9),
    fecha_nacimiento: z.string().min(10).max(10),
    code_expediente: z.string().max(6)
});

const createAlumnoSchema = alumnoSchema.omit({ id_alumno: true });

export const alumnosRoute = new Hono()
.get("/", async (c) => {
    try {
        const result = await query('SELECT * FROM alumnos');
        return c.json({ alumnos: result });
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Failed to fetch students' }, 500);
    }
})
.post("/", zValidator("json", createAlumnoSchema), async (c) => {
    try {
        const alumno = await c.req.valid("json");
        const result = await query(
            'INSERT INTO alumnos (nombre, apellido1, apellido2, id_legal, fecha_nacimiento, code_expediente) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [alumno.nombre, alumno.apellido1, alumno.apellido2, alumno.id_legal, alumno.fecha_nacimiento, alumno.code_expediente]
        );
        c.status(201);
        return c.json(result[0]);
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Failed to create student' }, 500);
    }
})
.get("/:id{[0-9]+}", async (c) => {
    try {
        const id = Number.parseInt(c.req.param("id"));
        const result = await query('SELECT * FROM alumnos WHERE id = $1', [id]);
        if (result.length === 0) {
            return c.notFound();
        }
        return c.json({ alumno: result[0] });
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Failed to fetch student' }, 500);
    }
})
.delete("/:id{[0-9]+}", async (c) => {
    try {
        const id = Number.parseInt(c.req.param("id"));
        const result = await query('DELETE FROM alumnos WHERE id = $1 RETURNING *', [id]);
        if (result.length === 0) {
            return c.notFound();
        }
        return c.json({ alumno: result[0] });
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Failed to delete student' }, 500);
    }
});