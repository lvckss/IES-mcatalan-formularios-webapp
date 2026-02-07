import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { getDirectivoByCargo, getDirectivos, updateDirectivoByCargo } from "../controllers/directivosController";

import type { AppBindings } from "../app";
import { DirectivoSchema, modifyDirectivoSchema } from "../models/Directivos";

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
  .get("/", async(c) => {
    const result = await getDirectivos();
    return c.json({ directivos: result })
  })
  .get("/:cargo", async(c) => {
    const cargo = String(c.req.param("cargo"));
    const result = await getDirectivoByCargo(cargo);
    return c.json({ directivo: result })
  })
  .put(
    "/:cargo",
    zValidator("json", modifyDirectivoSchema),
    async (c) => {
      const cargo = String(c.req.param("cargo"));
      const { nombre } = c.req.valid("json");

      // opcional: restringir a solo estos 2
      if (cargo !== "Director" && cargo !== "Secretario") {
        return c.json({ error: "Cargo inválido" }, 400);
      }

      try {
        const updated = await updateDirectivoByCargo(cargo, nombre);
        return c.json({ directivo: updated });
      } catch (e: any) {
        // si quieres distinguir 404 vs 500, hazlo aquí
        return c.json({ error: e?.message ?? "Error actualizando" }, 400);
      }
    }
  );