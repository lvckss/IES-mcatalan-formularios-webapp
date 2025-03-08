import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { type Grade, GradeSchema, createGradeSchema } from "../models/Grade";
import { getGrades, createGrade, getGradeById, deleteGrade } from "../controllers/gradeController";

export const gradesRoute = new Hono()
  .get("/", async (c) => {
    const result = await getGrades();
    return c.json({ calificaciones: result });
  })
  .post("/", zValidator("json", createGradeSchema), async (c) => {
    const validatedData = c.req.valid("json");
    const result = await createGrade(validatedData);
    return c.json({ calificacion: result }, 201);
  })
  .get("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const result = await getGradeById(id);
    return c.json({ calificacion: result });
  })
  .delete("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const result = await deleteGrade(id);
    return c.json({ calificacion: result });
  });
