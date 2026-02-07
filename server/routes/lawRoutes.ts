import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { type PostLaw, type Law, createLawSchema, LawSchema } from '../models/Law';

import { createLaw, deleteLaw, getLaws } from "../controllers/lawController";

import type { AppBindings } from "../app";

export const lawsRoute = new Hono<AppBindings>()
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
        const result = await getLaws();
        return c.json({ leyes: result });
    })
    .post("/", zValidator("json", createLawSchema), async (c) => {
        const validatedData = c.req.valid("json");
        const result = await createLaw(validatedData);
        return c.json({ ley: result }, 201);
    })
    .delete("/:id", async (c) => {
        const id = Number(c.req.param("id"));
        if (!Number.isInteger(id) || id <= 0) {
            return c.json({ error: "ID inválido" }, 400);
        }

        try {
            const deleted = await deleteLaw(id);
            // Devuelve la ley eliminada (útil para UI/toasts)
            return c.json({ ley: deleted }, 200);
        } catch (error: any) {
            if (error?.message === "LAW_NOT_FOUND") {
                return c.json({ error: "Ley no encontrada" }, 404);
            }
            // console.error(error);
            return c.json({ error: "Error eliminando la ley" }, 500);
        }
    });