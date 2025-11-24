// routes/groupsRoute.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

import {
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  getGroupMemberIds,
  addGroupMembers,
  removeGroupMembers,
  getGroupsWithCounts, // opcional
} from "../controllers/groupController";

import {
  createGroupSchema,
  GroupSchema,
} from "../models/Group";

import type { AppBindings } from "../app";

// PATCH body: actualizar uno o ambos campos
const updateGroupSchema = z.object({
  nombre: z.string().max(120).optional(),
  descripcion: z.string().max(255).optional(),
}).refine(v => v.nombre !== undefined || v.descripcion !== undefined, {
  message: "Debes enviar al menos un campo a actualizar (nombre o descripcion).",
});

// Body para añadir/quitar miembros en bulk
const groupMembersBodySchema = z.object({
  id_estudiantes: z.array(z.number().int().positive()).min(1),
});

export const groupsRoute = new Hono<AppBindings>()

  .use("*", async (c, next) => {
    const user = c.get("user");
    if (!user) {
      // devolvemos Response aquí
      return c.json({ error: "No autorizado" }, 401);
    }
    // y solo seguimos si hay sesión
    await next();
  })

  // Listar grupos (simples)
  .get("/", async (c) => {
    const grupos = await getGroups();
    return c.json({ grupos });
  })

  // (Opcional) Listar grupos con contador de miembros
  .get("/withCounts", async (c) => {
    const grupos = await getGroupsWithCounts();
    return c.json({ grupos });
  })

  // Crear grupo
  .post("/", zValidator("json", createGroupSchema), async (c) => {
    try {
      const data = c.req.valid("json");
      const grupo = await createGroup(data);
      return c.json({ grupo }, 201);
    } catch (e: any) {
      if (e?.message === "GROUP_NAME_EXISTS") {
        return c.json({ error: "Ya existe un grupo con ese nombre." }, 409);
      }
      return c.json({ error: "Error interno del servidor." }, 500);
    }
  })

  // Actualizar grupo (nombre/descripcion)
  .patch("/:id_grupo", zValidator("json", updateGroupSchema), async (c) => {
    const id_grupo = Number(c.req.param("id_grupo"));
    if (!Number.isFinite(id_grupo) || id_grupo <= 0) {
      return c.json({ error: "id_grupo inválido." }, 400);
    }
    try {
      const fields = c.req.valid("json");
      const grupo = await updateGroup(id_grupo, fields);
      return c.json({ grupo });
    } catch (e: any) {
      if (e?.message === "GROUP_NOT_FOUND") {
        return c.json({ error: "Grupo no encontrado." }, 404);
      }
      if (e?.code === "23505") { // unique_violation si renombran a uno existente
        return c.json({ error: "Ya existe un grupo con ese nombre." }, 409);
      }
      return c.json({ error: "Error interno del servidor." }, 500);
    }
  })

  // Eliminar grupo
  .delete("/:id_grupo", async (c) => {
    const id_grupo = Number(c.req.param("id_grupo"));
    if (!Number.isFinite(id_grupo) || id_grupo <= 0) {
      return c.json({ error: "id_grupo inválido." }, 400);
    }
    try {
      await deleteGroup(id_grupo);
      return c.json({ ok: true });
    } catch {
      return c.json({ error: "Error al eliminar el grupo." }, 500);
    }
  })

  // Obtener IDs de miembros del grupo
  .get("/:id_grupo/members", async (c) => {
    const id_grupo = Number(c.req.param("id_grupo"));
    if (!Number.isFinite(id_grupo) || id_grupo <= 0) {
      return c.json({ error: "id_grupo inválido." }, 400);
    }
    const miembros = await getGroupMemberIds(id_grupo);
    return c.json({ miembros });
  })

  // Añadir miembros al grupo (bulk)
  .post(
    "/:id_grupo/members",
    zValidator("json", groupMembersBodySchema),
    async (c) => {
      const id_grupo = Number(c.req.param("id_grupo"));
      if (!Number.isFinite(id_grupo) || id_grupo <= 0) {
        return c.json({ error: "id_grupo inválido." }, 400);
      }
      const { id_estudiantes } = c.req.valid("json");
      try {
        const miembros = await addGroupMembers(id_grupo, id_estudiantes);
        return c.json({ miembros });
      } catch {
        return c.json({ error: "No se pudieron añadir miembros." }, 500);
      }
    }
  )

  // Quitar miembros del grupo (bulk)
  .delete(
    "/:id_grupo/members",
    zValidator("json", groupMembersBodySchema),
    async (c) => {
      const id_grupo = Number(c.req.param("id_grupo"));
      if (!Number.isFinite(id_grupo) || id_grupo <= 0) {
        return c.json({ error: "id_grupo inválido." }, 400);
      }
      const { id_estudiantes } = c.req.valid("json");
      try {
        const miembros = await removeGroupMembers(id_grupo, id_estudiantes);
        return c.json({ miembros });
      } catch {
        return c.json({ error: "No se pudieron eliminar miembros." }, 500);
      }
    }
  );