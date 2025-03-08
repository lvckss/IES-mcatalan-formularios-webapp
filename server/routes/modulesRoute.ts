import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { type Module, ModuleSchema, createModuleSchema } from "../models/Module";
import { getModules, createModule, getModuleById, deleteModule } from "../controllers/moduleController";

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
  .delete("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const result = await deleteModule(id);
    return c.json({ modulo: result });
  });