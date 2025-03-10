import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import  { createStudentSchema } from "../models/Student";
import { getStudents, createStudent, getStudentById, deleteStudent } from "../controllers/studentController";

export const studentsRoute = new Hono()
  .get("/", async (c) => {
    const result = await getStudents();
    return c.json({ estudiantes: result });
  })
  .post("/", zValidator("json", createStudentSchema), async (c) => {
    const validatedData = c.req.valid("json");
    const result = await createStudent(validatedData);
    return c.json({ estudiante: result }, 201);
  })
  .get("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const result = await getStudentById(id);
    return c.json({ estudiante: result });
  })
  .delete("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const result = await deleteStudent(id);
    return c.json({ estudiante: result });
  });
