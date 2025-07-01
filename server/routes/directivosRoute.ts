import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { getDirectivoByCargo } from "../controllers/directivosController";

export const directivosRoute = new Hono()
  .get("/:cargo", async(c) => {
    const cargo = String(c.req.param("cargo"));
    const result = await getDirectivoByCargo(cargo);
    return c.json({ directivo: result })
  });