import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { getDirectivoByCargo } from "../controllers/directivosController";

import type { AppBindings } from "../app";

export const directivosRoute = new Hono<AppBindings>()
  .use("*", async (c, next) => {
    const user = c.get("user");
    if (!user) {
      // devolvemos Response aquí
      return c.json({ error: "No autorizado" }, 401);
    }
    // y solo seguimos si hay sesión
    await next();
  })
  .get("/:cargo", async(c) => {
    const cargo = String(c.req.param("cargo"));
    const result = await getDirectivoByCargo(cargo);
    return c.json({ directivo: result })
  });