import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { type PostLaw, type Law, createLawSchema, LawSchema  } from '../models/Law';

import { getLaws } from "../controllers/lawController";

export const lawsRoute = new Hono()
    .get("/", async (c) => {
        const result = await getLaws();
        return c.json({ leyes: result });
    })