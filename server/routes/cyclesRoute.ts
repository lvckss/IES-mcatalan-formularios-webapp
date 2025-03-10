import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { type Cycle, CycleSchema, createCycleSchema } from "../models/Cycle";
import { getCycles, createCycle, getCycleById, deleteCycle } from "../controllers/cycleController";

export const cyclesRoute = new Hono()
  .get("/", async (c) => {
    const result = await getCycles();
    return c.json({ ciclos: result });
  })
  .post("/", zValidator("json", createCycleSchema), async (c) => {
    const validatedData = c.req.valid("json");
    const result = await createCycle(validatedData);
    return c.json({ ciclo: result }, 201);
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
