import sql from "../db/db";
import type { Modulo } from "../models/modulo";

export const getModulos = async () => {
    return await sql`SELECT * FROM modulos`;
};

export const createModulo = async (modulo: Modulo) => {
    return await sql`
        'INSERT INTO modulos (id_modulo, nombre, id_ciclo, curso)
        VALUES (${modulo.id_modulo}, ${modulo.nombre}, ${modulo.id_ciclo}, ${modulo.curso}) RETURNING *
        `;
};

export const getModuloById = async (id: number) => {
    return await sql`SELECT * FROM modulos WHERE id_modulo = ${id}`;
};

export const deleteModulo = async (id: number) => {
    return await sql`DELETE FROM modulos WHERE id_modulo = ${id} RETURNING *`;
};
