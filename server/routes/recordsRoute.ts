import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { type Record, RecordSchema, createRecordSchema } from "../models/Record";
import {
  getRecords,
  createRecord,
  getRecordById,
  deleteRecord,
  updateFechaPagoTitulo,
  checkPuedeCursar,
  patchBajaEstudianteCiclo,
  deleteRecordComplete
} from "../controllers/recordController";
import { z } from "zod";
import type { AppBindings } from "../app";

export const recordsRoute = new Hono<AppBindings>()
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
    const result = await getRecords();
    return c.json({ expedientes: result });
  })
  .post("/", zValidator("json", createRecordSchema), async (c) => {
    const validatedData = c.req.valid("json");
    const result = await createRecord(validatedData);
    return c.json({ expediente: result }, 201);
  })
  .get("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const result = await getRecordById(id);
    return c.json({ expediente: result });
  })
  .delete("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const result = await deleteRecord(id);
    return c.json({ expediente: result });
  })
  .patch(
    "/:id/fecha_pago_titulo",
    zValidator(
      "json",
      z.object({
        fecha_pago_titulo: z.preprocess((arg) => {
          if (typeof arg === "string" || arg instanceof Date) {
            const date = new Date(arg);
            if (!isNaN(date.getTime())) return date;
          }
          return arg;
        }, z.date().optional()).nullable(),
      })),
    async (c) => {
      const id = Number(c.req.param("id"));
      const { fecha_pago_titulo } = c.req.valid("json");

      if (!(fecha_pago_titulo instanceof Date)) {
        return c.text("fecha_pago_titulo es obligatorio y debe ser una fecha", 400);
      }

      try {
        const updated = await updateFechaPagoTitulo(id, fecha_pago_titulo);
        return c.json({ expediente: updated });
      } catch (error) {
        return c.json({ error: "No se pudo actualizar la fecha del pago del título." }, 500);
      }
    }
  )
  .patch(
    "/darBaja/:id_estudiante/:id_ciclo",
    zValidator("json", z.object({
      dado_baja: z.boolean()
    })),
    async (c) => {
      const id_estudiante = Number(c.req.param("id_estudiante"));
      const id_ciclo = Number(c.req.param("id_ciclo"));
      const { dado_baja } = c.req.valid("json");
      try {
        const updated = await patchBajaEstudianteCiclo(id_estudiante, id_ciclo, dado_baja);
        return c.json({ expedientes: updated });
      } catch (error) {
        return c.json({ error: "No se pudo actualizar el campo dado_baja del expediente."}, 500);
      }
    }
  )
  .get(
    "/puedeMatricularse/:id_estudiante/:id_ciclo/:periodo",
    async (c) => {
      const id_estudiante = Number(c.req.param("id_estudiante"));
      const id_ciclo = Number(c.req.param("id_ciclo"));
      const periodo = String(c.req.param("periodo"));

      const [y1, y2] = periodo.split("-");
      const ano_inicio = Number(y1);
      const ano_fin = Number(y2);

      const result = await checkPuedeCursar(id_estudiante, id_ciclo, ano_inicio, ano_fin);
      return c.json({ result })
    }
  )
  .delete(
    "/deleteComplete/:id_record",
    async (c) => {
      const id = Number(c.req.param("id_record"));
      if (!Number.isInteger(id)) return c.json({ error: "invalid id" }, 400);

      const deleted = await deleteRecordComplete(id);

      return c.json({
        deleted,
        count: deleted.length,
      });
    }
  )
  ;
