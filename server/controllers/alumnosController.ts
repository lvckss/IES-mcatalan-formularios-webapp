import sql from '../db/db'

import { type PostStudent, type Student, StudentSchema } from "../models/student";

export const getAlumnos = async (): Promise<Student[]> => {
    const results = await sql`SELECT * FROM estudiantes`;
    return results.map((result: any) => StudentSchema.parse(result));
};

export const createAlumno = async (alumno: PostStudent) => {
    return await sql`
        INSERT INTO estudiantes (nombre, apellido_1, apellido_2, id_legal, fecha_nac)
        VALUES (${alumno.nombre}, ${alumno.apellido_1}, ${alumno.apellido_2}, ${alumno.id_legal}, ${alumno.fecha_nac})
        RETURNING *
    `;
};

export const getAlumnoById = async (id: number) => {
    return await sql`SELECT * FROM estudiantes WHERE id_estudiante = ${id}`;
};

export const deleteAlumno = async (id: number) => {
    return await sql`DELETE FROM alumnos WHERE id_alumno = ${id} RETURNING *`;
};