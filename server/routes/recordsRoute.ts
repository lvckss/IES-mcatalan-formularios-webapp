import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { type Record, RecordSchema, createRecordSchema } from "../models/Record";
import { getRecords, createRecord, getRecordById, deleteRecord } from "../controllers/recordController";

export const recordsRoute = new Hono()
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
  });
