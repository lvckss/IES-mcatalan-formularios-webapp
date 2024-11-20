import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
/* import { createCicloFormativoSchema } from "../models/cicloFormativo"; */
import { getCiclosFormativos, createCicloFormativo, getCicloFormativoById, deleteCicloFormativo } from "../controllers/ciclosFormativosController";

import ciclos_unicos from "../fakedata/ciclos.json";

export const ciclosFormativosRoute = new Hono()
    .get("/", async (c) => {
        /* const result = await getCiclosFormativos(); */
        return c.json({ ciclos_unicos });
    })
    /* .post("/", zValidator("json", createCicloFormativoSchema), async (c) => {
        const cicloFormativo = await c.req.valid("json");
        const result = await createCicloFormativo(cicloFormativo);
        c.status(201);
        return c.json(result[0]);
    })
    .get("/:id{[0-9]+}", async (c) => {
        const id = Number.parseInt(c.req.param("id"));
        const result = await getCicloFormativoById(id);
        if (result.length === 0) {
            return c.notFound();
        }
        return c.json({ cicloFormativo: result[0] });
    })
    .delete("/:id{[0-9]+}", async (c) => {
        const id = Number.parseInt(c.req.param("id"));
        const result = await deleteCicloFormativo(id);
        if (result.length === 0) {
            return c.notFound();
        }
        return c.json({ cicloFormativo: result[0] });
    }); */