import { query } from "../db";
import type { Regulacion } from "../models/regulacion";

export const getRegulaciones = async () => {
    return await query('SELECT * FROM regulaciones');
};

export const createRegulacion = async (regulacion: Regulacion) => {
    return await query(
        'INSERT INTO regulaciones (id_ciclo, ano_escolar, norma_legal) VALUES ($1, $2, $3) RETURNING *',
        [regulacion.id_ciclo, regulacion.ano_escolar, regulacion.norma_legal]
    );
};

export const getRegulacionById = async (id: number) => {
    return await query('SELECT * FROM regulaciones WHERE id_regulacion = $1', [id]);
};

export const deleteRegulacion = async (id: number) => {
    return await query('DELETE FROM regulaciones WHERE id_regulacion = $1 RETURNING *', [id]);
};
