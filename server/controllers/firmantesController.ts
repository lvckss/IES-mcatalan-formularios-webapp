import { query } from "../db";
import type { Firmante } from "../models/firmante";

export const getFirmantes = async () => {
    return await query('SELECT * FROM firmantes');
};

export const createFirmante = async (firmante: Firmante) => {
    return await query(
        'INSERT INTO firmantes (nombre_firmante, cargo) VALUES ($1, $2) RETURNING *',
        [firmante.nombre_firmante, firmante.cargo]
    );
};

export const getFirmanteById = async (id: number) => {
    return await query('SELECT * FROM firmantes WHERE id_firmante = $1', [id]);
};

export const deleteFirmante = async (id: number) => {
    return await query('DELETE FROM firmantes WHERE id_firmante = $1 RETURNING *', [id]);
};
