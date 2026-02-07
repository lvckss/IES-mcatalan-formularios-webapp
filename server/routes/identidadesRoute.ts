import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import type { AppBindings } from "../app";
import { auth } from "../auth";

const CreateUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(1),
    role: z.enum(["user", "admin"]).optional(),
});

export const identidadesRoute = new Hono<AppBindings>()
    .use("*", async (c, next) => {
        const user = c.get("user");
        if (!user) return c.json({ error: "No autorizado" }, 401);

        // solo admins
        const role = (user as any)?.role ?? (user as any)?.data?.role;
        if (role !== "admin") return c.json({ error: "Prohibido" }, 403);

        await next();
    })
    .get("/", async (c) => {
        const res = await auth.api.listUsers({
            query: { limit: 200, sortBy: "email", sortDirection: "asc" },
            headers: c.req.raw.headers,
        });
        
        return c.json(res);
    })
    .post("/", zValidator("json", CreateUserSchema), async (c) => {
        const { email, password, name, role } = c.req.valid("json");

        const created = await auth.api.createUser({
            body: {
                email,
                password,
                name,
                data: {
                    role: role ?? "user",
                },
            },
            headers: c.req.raw.headers,
        });

        return c.json(created, 201);
    });