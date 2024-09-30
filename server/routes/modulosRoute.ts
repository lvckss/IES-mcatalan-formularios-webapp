import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { type Modulo, createModuloSchema } from "../models/modulo";
/* import { getModulos, createModulo, getModuloById, deleteModulo } from "../controllers/modulosController"; */
import modulos from "../fakedata/modulos.json";

export const modulosRoute = new Hono()
    .get("/", async (c) => {
        return c.json(modulos);
    })
    /* .post("/", zValidator("json", createModuloSchema), async (c) => {
        const modulo = await c.req.valid("json");
        const result = await createModulo(modulo);
        c.status(201);
        return c.json(result[0]);
    })
    .get("/:id{[0-9]+}", async (c) => {
        const id = Number.parseInt(c.req.param("id"));
        const result = await getModuloById(id);
        if (result.length === 0) {
            return c.notFound();
        }
        return c.json({ modulo: result[0] });
    })
    .delete("/:id{[0-9]+}", async (c) => {
        const id = Number.parseInt(c.req.param("id"));
        const result = await deleteModulo(id);
        if (result.length === 0) {
            return c.notFound();
        }
        return c.json({ modulo: result[0] });
    }); */
