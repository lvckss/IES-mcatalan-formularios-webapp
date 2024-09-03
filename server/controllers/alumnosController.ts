import { query } from "../db";
import type { Alumno } from "../models/alumno";

export const getAlumnos = async () => {
    return await query('SELECT * FROM alumnos');
};

export const createAlumno = async (alumno: Alumno) => {
    return await query(
        'INSERT INTO alumnos (nombre, apellido1, apellido2, id_legal, fecha_nacimiento, codigo_expediente) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [alumno.nombre, alumno.apellido1, alumno.apellido2, alumno.id_legal, alumno.fecha_nacimiento, alumno.codigo_expediente]
    );
};

export const getAlumnoById = async (id: number) => {
    return await query('SELECT * FROM alumnos WHERE id_alumno = $1', [id]);
};

export const deleteAlumno = async (id: number) => {
    return await query('DELETE FROM alumnos WHERE id_alumno = $1 RETURNING *', [id]);
};