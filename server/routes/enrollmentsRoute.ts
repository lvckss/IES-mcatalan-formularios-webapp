import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { type Enrollment, EnrollmentSchema, createEnrollmentSchema } from "../models/Enrollment";
import { 
  getEnrollments,
  createEnrollment, 
  getEnrollmentById,
  deleteEnrollment, 
  patchEnrollmentNota,
  checkSePuedeAprobar,
  notasMasAltasEstudiantePorCicloCompleto
} from "../controllers/enrollmentController";
import { z } from "zod";

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
  })
  .patch(
    "/notas/:record_id/:module_id",
    zValidator("json", z.object({
      nota: z.enum([
        '1','2','3','4','5','6','7','8','9','10',
        '10-MH',
        'CV','CV-5','CV-6','CV-7','CV-8','CV-9','CV-10',
        'AM','RC','NE','APTO','NO APTO'
      ]).nullable()
    })),
    async (c) => {
      const record_id = Number(c.req.param("record_id"));
      const module_id = Number(c.req.param("module_id"));
      const { nota } = c.req.valid("json");
      try {
        const updated = await patchEnrollmentNota(record_id, module_id, nota);
        return c.json({ matricula: updated });
      } catch (error) {
        return c.json({ error: "No se pudo actualizar la matrícula." }, 500);
      }
    })
    .get(
      "/puedeAprobar/:id_estudiante/:id_modulo",
      async (c) => {
        const id_estudiante = Number(c.req.param("id_estudiante"));
        const id_modulo = Number(c.req.param("id_modulo"));
        const result = await checkSePuedeAprobar(id_estudiante, id_modulo);
        return c.json({ result })
      }
    )
    .get(
      "/notasAltas/:id_estudiante/:id_ciclo",
      async (c) => {
        const id_estudiante = Number(c.req.param("id_estudiante"));
        const id_ciclo = Number(c.req.param("id_ciclo"));
        const result = await notasMasAltasEstudiantePorCicloCompleto(id_estudiante, id_ciclo);
        return c.json({ result })
      }
    )
  ;
