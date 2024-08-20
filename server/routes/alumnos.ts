import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const alumnoSchema = z.object({
    id: z.number(),
    nombre: z.string().max(50),
    apellido1: z.string().max(50),
    apellido2: z.string().max(50),
    dni: z.string().min(9).max(9),
    fecha_nacimiento: z.string().min(10).max(10),
    codigo_expediente: z.string().max(6)
});

type Alumno = z.infer<typeof alumnoSchema>

const createAlumnoSchema = alumnoSchema.omit({ id: true });

const fakeAlumnos = [
    {
        id: 1,
        nombre: "Juan",
        apellido1: "Perez",
        apellido2: "Gomez",
        dni: "12345678A",
        fecha_nacimiento: "1990-01-01",
        codigo_expediente: "123456"
    },
    {
        id: 2,
        nombre: "Maria",
        apellido1: "Gomez",
        apellido2: "Perez",
        dni: "87654321B",
        fecha_nacimiento: "1991-01-01",
        codigo_expediente: "654321"
    },
    {
        id: 3,
        nombre: "Pepe",
        apellido1: "Garcia",
        apellido2: "Gomez",
        dni: "12348765C",
        fecha_nacimiento: "1992-01-01",
        codigo_expediente: "123487"
    }
]

export const alumnosRoute = new Hono()
.get("/", async (c) => {
    return c.json({ alumnos: fakeAlumnos });
})
.post("/", zValidator("json", createAlumnoSchema), async (c) => {
    const alumno = await c.req.valid("json")
    fakeAlumnos.push({...alumno, id: fakeAlumnos.length + 1});
    c.status(201);
    return c.json(alumno);
})
.get("/:id{[0-9]+}", async (c) => {
    const id = Number.parseInt(c.req.param("id"));
    const alumno = fakeAlumnos.find(alumno => alumno.id === id);
    if (!alumno) {
        return c.notFound();
    }
    return c.json({alumno});
})
.delete("/:id{[0-9]+}", async (c) => {
    const id = Number.parseInt(c.req.param("id"));
    const index = fakeAlumnos.findIndex(alumno => alumno.id === id);
    if (index === -1) {
        return c.notFound();
    }
    const alumnoEliminado = fakeAlumnos.splice(index, 1);
    return c.json({ alumno: alumnoEliminado });
});