import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { type Module, ModuleSchema, createModuleSchema } from "../models/Module";
import { 
  getModules,
  createModule,
  getModuleById,
  deleteModule,
  getModuleByCycleId,
  getModulesByCycleCodeAndCurso,
  countConvocatorias
} from "../controllers/moduleController";

import type { AppBindings } from "../app";

export const modulesRoute = new Hono<AppBindings>()
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
  .get("/convocatorias/:module_id/:student_id", async (c) => {
    const module_id = Number(c.req.param("module_id"));
    const student_id = Number(c.req.param("student_id"));
    const result = await countConvocatorias(student_id, module_id)
    return c.json({ convocatorias: result })
  })
  .get("/cycle_id/:cycle_id", async (c) => {
    const cycleId = Number(c.req.param("cycle_id"));
    const result = await getModuleByCycleId(cycleId);
    return c.json({ modulos: result });
  })
  .get("cycle/:cycle_code/curso/:curso", async (c) => {
    const cycle_code = String(c.req.param("cycle_code"))
    const curso = String(c.req.param("curso"))
    const result = await getModulesByCycleCodeAndCurso(cycle_code, curso)
    return c.json({ modulos: result })
  })
  .delete("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const result = await deleteModule(id);
    return c.json({ modulo: result });
  });