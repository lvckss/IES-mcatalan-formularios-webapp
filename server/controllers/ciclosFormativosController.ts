import { query } from "../db";
import type { CicloFormativo } from "../models/cicloFormativo";

export const getCiclosFormativos = async () => {
    return await query('SELECT * FROM ciclos_formativos');
};

export const createCicloFormativo = async (cicloFormativo: CicloFormativo) => {
    return await query(
        'INSERT INTO ciclos_formativos (nombre_ciclo, nivel) VALUES ($1, $2) RETURNING *',
        [cicloFormativo.nombre_ciclo, cicloFormativo.nivel]
    );
};

export const getCicloFormativoById = async (id: number) => {
    return await query('SELECT * FROM ciclos_formativos WHERE id_ciclo = $1', [id]);
};

export const deleteCicloFormativo = async (id: number) => {
    return await query('DELETE FROM ciclos_formativos WHERE id_ciclo = $1 RETURNING *', [id]);
};
