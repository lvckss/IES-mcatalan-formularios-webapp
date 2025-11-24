import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { type Enrollment, EnrollmentSchema, createEnrollmentSchema } from "../models/Enrollment";
import {
  getEnrollments,
  createEnrollment,
  getEnrollmentById,
  deleteEnrollment,
  deleteEnrollmentCascade,
  patchEnrollmentNota,
  checkSePuedeAprobar,
  notasMasAltasEstudiantePorCicloCompleto,
  notasMasAltasEstudiantePorCicloCompletoSoloAprobadas,
  enrollmentsByRecord
} from "../controllers/enrollmentController";
import { z } from "zod";

import type { AppBindings } from "../app";

export const enrollmentsRoute = new Hono<AppBindings>()
  .use("*", async (c, next) => {
    const user = c.get("user");
    if (!user) {
      // devolvemos Response aquí
      return c.json({ error: "No autorizado" }, 401);
    }
    // y solo seguimos si hay sesión
    await next();
  })
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
  .delete("/:id/cascade", async (c) => {
    const id = Number(c.req.param("id"));
    try {
      const result = await deleteEnrollmentCascade(id);
      return c.json({ matriculas_eliminadas: result, count: result.length });
    } catch (e: any) {
      if (e?.status) {
        return c.json({ error: e.message }, e.status);
      }
      throw e;
    }
  })
  .patch(
    "/notas/:record_id/:module_id",
    zValidator("json", z.object({
      nota: z.enum([
        "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "10-MH", "10-Matr. Honor",
        "CV", "CV-5", "CV-6", "CV-7", "CV-8", "CV-9", "CV-10", "CV-10-MH",
        "TRAS-5", "TRAS-6", "TRAS-7", "TRAS-8", "TRAS-9", "TRAS-10", "TRAS-10-MH",
        "RC", "NE", "APTO", "NO APTO", "EX"
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
  .get(
    "/notasAltasAprobadas/:id_estudiante/:id_ciclo",
    async (c) => {
      const id_estudiante = Number(c.req.param("id_estudiante"));
      const id_ciclo = Number(c.req.param("id_ciclo"));
      const result = await notasMasAltasEstudiantePorCicloCompletoSoloAprobadas(id_estudiante, id_ciclo);
      return c.json({ result })
    }
  )
  .get(
    "/matriculasPorExpediente/:id_expediente/:id_estudiante",
    async (c) => {
      const id_expediente = Number(c.req.param("id_expediente"));
      const id_estudiante = Number(c.req.param("id_estudiante"));
      const result = await enrollmentsByRecord(id_expediente, id_estudiante);
      return c.json({ expedientes: result })
    }
  )
  ;
