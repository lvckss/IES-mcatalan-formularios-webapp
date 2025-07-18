import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import  { createStudentSchema } from "../models/Student";
import { getStudents, createStudent, getStudentById, deleteStudent, getStudentFullInfo, getStudentByLegalId, updateStudentObservaciones } from "../controllers/studentController";

import { z } from "zod";

export const studentsRoute = new Hono()
  .get("/", async (c) => {
    const result = await getStudents();
    return c.json({ estudiantes: result });
  })
  .post("/", zValidator("json", createStudentSchema), async (c) => {
    try {
      const validatedData = c.req.valid("json");
      const result = await createStudent(validatedData);
      return c.json({ estudiante: result }, 201);
    } catch (error: any) {
      if (error.message === 'UNIQUE_VIOLATION') {
        return c.json({ error: "El identificador legal ya existe." }, 409);
      }
      return c.json({ error: "Error interno del servidor." }, 500);
    }
  })
  .get("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const result = await getStudentById(id);
    return c.json({ estudiante: result });
  })
  .get("/legal_id/:legal_id", async (c) => {
    const legal_id = c.req.param("legal_id");
    const result = await getStudentByLegalId(legal_id);
    return c.json({ estudiante: result });
  })
  .delete("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const result = await deleteStudent(id);
    return c.json({ estudiante: result });
  })
  .patch("/:id/observaciones", zValidator("json", z.object({observaciones: z.string().max(5000)}) ), async (c) => {
    const id = Number(c.req.param("id"));
    const { observaciones } = c.req.valid("json");
    try {
      const updated = await updateStudentObservaciones(id, observaciones);
      return c.json({ estudiante: updated });
    } catch (error) {
      return c.json({ error: "No se pudo actualizar observaciones." }, 500);
    }
  })
  .get("/fullInfo/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const result = await getStudentFullInfo(id);
    return c.json({fullInfo: result})
  });
