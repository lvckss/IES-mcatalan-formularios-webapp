import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createStudentSchema } from "../models/Student";
import {
  getStudents,
  createStudent,
  getStudentById,
  deleteStudent,
  getStudentFullInfo,
  getStudentByLegalId,
  updateStudent,
  updateStudentObservaciones,
  getAllStudentsFromCycleYearCursoTurnoConvocatoria,
  getAllStudentsFullInfo,
  getStudentFullInfoByCycleCode
} from "../controllers/studentController";

import { z } from "zod";

import type { AppBindings } from "../app";

// --- Helpers de validación ---
const dateFromISO = z.preprocess((v) => {
  if (v instanceof Date) return v;
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? undefined : d;
  }
  return v;
}, z.date());

const updateStudentSchema = createStudentSchema.partial().extend({
  // Fuerza que fecha_nac acepte string/number/Date
  fecha_nac: dateFromISO.optional(),
});

// Validación de :id
const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const studentsRoute = new Hono<AppBindings>()
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
  .get(
    "/allFullInfo",
    async (c) => {
      const result = await getAllStudentsFullInfo();
      return c.json({ allFullInfo: result });
    })
  .get("/legal_id/:legal_id", async (c) => {
    const legal_id = c.req.param("legal_id");
    const result = await getStudentByLegalId(legal_id);
    return c.json({ estudiante: result });
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
  })
  .patch("/:id/observaciones", zValidator("json", z.object({ observaciones: z.string().max(5000) })), async (c) => {
    const id = Number(c.req.param("id"));
    const { observaciones } = c.req.valid("json");
    try {
      const updated = await updateStudentObservaciones(id, observaciones);
      return c.json({ estudiante: updated });
    } catch (error) {
      return c.json({ error: "No se pudo actualizar observaciones." }, 500);
    }
  })
  .patch(
    "/:id",
    zValidator("param", idParamSchema),
    zValidator("json", updateStudentSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const payload = c.req.valid("json"); // tipado por Zod

      try {
        const updated = await updateStudent(id, payload);
        return c.json({ estudiante: updated });
      } catch (error: any) {
        // mapeo de errores comunes de Postgres
        if (error?.message === "NOT_FOUND") {
          return c.json({ error: "Estudiante no encontrado." }, 404);
        }
        if (error?.code === "23505") {
          return c.json({ error: "El identificador legal ya existe." }, 409);
        }
        if (error?.code === "23514") {
          return c.json({ error: "Valor inválido (violación de CHECK)." }, 400);
        }
        if (error?.code === "23502") {
          return c.json({ error: "Falta un campo obligatorio." }, 400);
        }
        return c.json({ error: "Error interno del servidor." }, 500);
      }
    }
  )
  .get("/filtro/:cycle_code/:ano_inicio/:ano_fin/:curso/:turno/:convocatoria", async (c) => {
    const cycle_code = String(c.req.param("cycle_code"));
    const ano_inicio = Number(c.req.param("ano_inicio"));
    const ano_fin = Number(c.req.param("ano_fin"));
    const curso = c.req.param("curso");
    const turno = c.req.param("turno");
    const convocatoria = c.req.param("convocatoria")

    const result = await getAllStudentsFromCycleYearCursoTurnoConvocatoria(cycle_code, ano_inicio, ano_fin, curso, turno, convocatoria);
    return c.json({ estudiantes: result })
  })
  .get("/fullInfo/:id/cycle/:cycle_code", async (c) => {
    const id = Number(c.req.param("id"));
    const cycle_code = c.req.param("cycle_code");

    try {
      const result = await getStudentFullInfoByCycleCode(id, cycle_code);
      return c.json({ fullInfo: result });
    } catch (error: any) {
      if (error?.message === "NO_RECORDS_FOR_STUDENT_AND_CYCLE") {
        return c.json(
          { error: "No hay expedientes para ese estudiante y ciclo." },
          404
        );
      }
      return c.json({ error: "Error interno del servidor." }, 500);
    }
  })
  .get("/fullInfo/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const result = await getStudentFullInfo(id);
    return c.json({ fullInfo: result })
  });
