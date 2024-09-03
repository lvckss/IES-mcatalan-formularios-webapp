import { query } from "../db";
import type { Modulo } from "../models/modulo";

export const getModulos = async () => {
    return await query('SELECT * FROM modulos');
};

export const createModulo = async (modulo: Modulo) => {
    return await query(
        'INSERT INTO modulos (codigo_modulo, nombre_modulo, ciclo_asignado, duracion) VALUES ($1, $2, $3, $4) RETURNING *',
        [modulo.codigo_modulo, modulo.nombre_modulo, modulo.ciclo_asignado, modulo.duracion]
    );
};

export const getModuloById = async (id: number) => {
    return await query('SELECT * FROM modulos WHERE id_modulo = $1', [id]);
};

export const deleteModulo = async (id: number) => {
    return await query('DELETE FROM modulos WHERE id_modulo = $1 RETURNING *', [id]);
};
