import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { type Cycle, CycleSchema, createCycleSchema } from "../models/Cycle";
import { 
  getCycles, 
  createCycle, 
  getCycleById, 
  deleteCycle, 
  getCyclesByName, 
  getCycleByCode,
  getCycleByLaw,
  updateCycle
} from "../controllers/cycleController";

import type { AppBindings } from "../app";

export const cyclesRoute = new Hono<AppBindings>()
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
    const result = await getCycles();
    return c.json({ ciclos: result });
  })
  .get("/by-name", async (c) => {
    const result = await getCyclesByName();
    return c.json({ ciclos: result });
  })
  .get("/code/:codigo", async (c) => {
    const code = String(c.req.param("codigo"));
    const result = await getCycleByCode(code);
    return c.json({ ciclo: result });
  })
  .get("/law/:ley", async (c) => {
    const law = Number(c.req.param("ley"));
    const result = await getCycleByLaw(law);
    return c.json({ ciclo: result });
  })
  .post("/", zValidator("json", createCycleSchema), async (c) => {
    const validatedData = c.req.valid("json");
    const result = await createCycle(validatedData);
    return c.json({ ciclo: result }, 201);
  })
  .put("/:id", zValidator("json", createCycleSchema), async (c) => {
    const id = Number(c.req.param("id"));
    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ error: "ID inválido" }, 400);
    }

    const validatedData = c.req.valid("json");

    try {
      const result = await updateCycle(id, validatedData);
      return c.json({ ciclo: result }, 200);
    } catch (error: any) {
      if (error?.message === "CYCLE_NOT_FOUND") {
        return c.json({ error: "Ciclo no encontrado" }, 404);
      }
      if (error?.code === "23505") {
        return c.json({ error: "UNIQUE_VIOLATION" }, 409);
      }
      return c.json({ error: "Error actualizando el ciclo" }, 500);
    }
  })
  .get("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const result = await getCycleById(id);
    return c.json({ ciclo: result });
  })
  .delete("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const result = await deleteCycle(id);
    return c.json({ ciclo: result });
  });
