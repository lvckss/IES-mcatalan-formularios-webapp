import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { type Module, ModuleSchema, createModuleSchema } from "../models/Module";
import { getModules, createModule, getModuleById, deleteModule, getModuleByCycleId } from "../controllers/moduleController";

export const modulesRoute = new Hono()
  .get("/", async (c) => {
    const result = await getModules();
    return c.json({ modulos: result });
  })
  .post("/", zValidator("json", createModuleSchema), async (c) => {
    const validatedData = c.req.valid("json");
    const result = await createModule(validatedData);
    return c.json({ modulo: result }, 201);
  })
  .get("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const result = await getModuleById(id);
    return c.json({ modulo: result });
  })
  .get("/cycle_id/:cycle_id", async (c) => {
    const cycleId = Number(c.req.param("cycle_id"));
    const result = await getModuleByCycleId(cycleId);
    return c.json({ modulos: result });
  })
  .delete("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const result = await deleteModule(id);
    return c.json({ modulo: result });
  });