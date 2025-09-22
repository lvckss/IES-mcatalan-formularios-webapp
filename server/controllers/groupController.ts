import sql from '../db/db';
import { type Group, type PostGroup, type GroupMember, GroupSchema, createGroupSchema, GroupMemberSchema } from '../models/Group';
import { z } from 'zod';

// get de todos los grupos
// GET: todos los grupos (ordenados por nombre)
export const getGroups = async (): Promise<Group[]> => {
    const results = await sql`
      SELECT id_grupo, nombre, descripcion
      FROM Grupos
      ORDER BY nombre;
    `;
    return results.map((r: any) => GroupSchema.parse(r));
};

// POST: crear grupo (nombre único)
export const createGroup = async (payload: PostGroup): Promise<Group> => {
    const data = createGroupSchema.parse(payload);
    try {
        const [row] = await sql/*sql*/`
        INSERT INTO Grupos (nombre, descripcion)
        VALUES (${data.nombre}, ${data.descripcion})
        RETURNING id_grupo, nombre, descripcion;
      `;
        return GroupSchema.parse(row);
    } catch (e: any) {
        // 23505 = unique_violation (duplicado de 'nombre')
        if (e?.code === '23505') {
            throw new Error('GROUP_NAME_EXISTS');
        }
        throw e;
    }
};

// PATCH: actualizar nombre y/o descripcion
export const updateGroup = async (
    id_grupo: number,
    fields: Partial<Omit<Group, 'id_grupo'>>
): Promise<Group> => {
    // normalizamos a strings (si no vienen, mantenemos valores actuales con COALESCE)
    const nombre = fields.nombre ?? null;
    const descripcion = fields.descripcion ?? null;

    const [row] = await sql/*sql*/`
      UPDATE Grupos
      SET
        nombre = COALESCE(${nombre}, nombre),
        descripcion = COALESCE(${descripcion}, descripcion)
      WHERE id_grupo = ${id_grupo}
      RETURNING id_grupo, nombre, descripcion;
    `;
    if (!row) throw new Error('GROUP_NOT_FOUND');
    return GroupSchema.parse(row);
};

// DELETE: eliminar grupo (borra miembros por CASCADE)
export const deleteGroup = async (id_grupo: number): Promise<void> => {
    const res = await sql/*sql*/`
      DELETE FROM Grupos
      WHERE id_grupo = ${id_grupo};
    `;
};


// =========================
//  MIEMBROS
// =========================

// GET: solo ids de miembros (ligero, perfecto para la UI)
export const getGroupMemberIds = async (id_grupo: number): Promise<number[]> => {
    const rows = await sql/*sql*/`
      SELECT id_estudiante
      FROM GruposMiembros
      WHERE id_grupo = ${id_grupo}
      ORDER BY id_estudiante;
    `;
    return rows.map((r: any) => r.id_estudiante as number);
};

// POST: añadir miembros (bulk). Ignora duplicados. Devuelve ids insertados.
export const addGroupMembers = async (
    id_grupo: number,
    id_estudiantes: number[]
): Promise<GroupMember[]> => {
    if (!id_estudiantes.length) return [];

    const rows = await sql/*sql*/`
      INSERT INTO GruposMiembros (id_grupo, id_estudiante)
      SELECT ${id_grupo}, x
      FROM UNNEST(${sql.array(id_estudiantes)}::int[]) AS t(x)
      ON CONFLICT DO NOTHING
      RETURNING id_grupo, id_estudiante;
    `;
    return rows.map((r: any) => GroupMemberSchema.parse(r));
};

// DELETE: quitar miembros (bulk). Devuelve ids eliminados.
export const removeGroupMembers = async (
    id_grupo: number,
    id_estudiantes: number[]
): Promise<GroupMember[]> => {
    if (!id_estudiantes.length) return [];

    const rows = await sql/*sql*/`
      DELETE FROM GruposMiembros
      WHERE id_grupo = ${id_grupo}
        AND id_estudiante = ANY(${sql.array(id_estudiantes)}::int[])
      RETURNING id_grupo, id_estudiante;
    `;
    return rows.map((r: any) => GroupMemberSchema.parse(r));
};

// Schema para validar el SELECT con contador
const GroupWithCountSchema = GroupSchema.extend({
    num_miembros: z.number().int().nonnegative(),
});

type GroupWithCount = z.infer<typeof GroupWithCountSchema>;

export const getGroupsWithCounts = async (): Promise<GroupWithCount[]> => {
    const rows = await sql/*sql*/`
      SELECT
        g.id_grupo,
        g.nombre,
        g.descripcion,
        COUNT(m.id_estudiante)::int AS num_miembros
      FROM Grupos g
      LEFT JOIN GruposMiembros m USING (id_grupo)
      GROUP BY g.id_grupo, g.nombre, g.descripcion
      ORDER BY g.nombre;
    `;

    return rows.map((r: any) => GroupWithCountSchema.parse({
        id_grupo: r.id_grupo,
        nombre: r.nombre,
        descripcion: r.descripcion,
        num_miembros: Number(r.num_miembros),
    }));
};

