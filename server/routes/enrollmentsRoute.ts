import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { type Enrollment, EnrollmentSchema, createEnrollmentSchema } from "../models/Enrollment";
import { getEnrollments, createEnrollment, getEnrollmentById, deleteEnrollment } from "../controllers/enrollmentController";

export const enrollmentsRoute = new Hono()
  .get("/", async (c) => {
    const result = await getEnrollments();
    return c.json({ matriculas: result });
  })
  .post("/", zValidator("json", createEnrollmentSchema), async (c) => {
    const validatedData = c.req.valid("json");
    const result = await createEnrollment(validatedData);
    return c.json({ matricula: result }, 201);
  })
  .get("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const result = await getEnrollmentById(id);
    return c.json({ matricula: result });
  })
  .delete("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const result = await deleteEnrollment(id);
    return c.json({ matricula: result });
  });
