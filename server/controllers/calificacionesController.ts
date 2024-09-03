import { query } from "../db";
import type { Calificacion } from "../models/calificacion";

export const getCalificaciones = async () => {
    return await query('SELECT * FROM calificaciones');
};

export const createCalificacion = async (calificacion: Calificacion) => {
    return await query(
        'INSERT INTO calificaciones (id_alumno, id_modulo, calificacion, convocatoria, curso_escolar, estado_modulo, ano_escolar) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [calificacion.id_alumno, calificacion.id_modulo, calificacion.calificacion, calificacion.convocatoria, calificacion.curso_escolar, calificacion.estado_modulo, calificacion.ano_escolar]
    );
};

export const getCalificacionById = async (id: number) => {
    return await query('SELECT * FROM calificaciones WHERE id_calificacion = $1', [id]);
};

export const deleteCalificacion = async (id: number) => {
    return await query('DELETE FROM calificaciones WHERE id_calificacion = $1 RETURNING *', [id]);
};
