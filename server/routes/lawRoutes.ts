import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { type PostLaw, type Law, createLawSchema, LawSchema  } from '../models/Law';

import { getLaws } from "../controllers/lawController";

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