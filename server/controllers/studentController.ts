import sql from '../db/db'
import { type PostStudent, type Student, StudentSchema } from "../models/Student";

export const getStudents = async (): Promise<Student[]> => {
  const results = await sql`SELECT * FROM Estudiantes`;
  return results.map((result: any) => StudentSchema.parse(result));
};

export const createStudent = async (student: PostStudent): Promise<Student> => {
  const results = await sql`
    INSERT INTO Estudiantes (nombre, apellido_1, apellido_2, id_legal, fecha_nac)
    VALUES (${student.nombre}, ${student.apellido_1}, ${student.apellido_2 ?? null}, ${student.id_legal}, ${student.fecha_nac})
    RETURNING *
  `;
  return StudentSchema.parse(results[0]);
};

export const getStudentById = async (id: number): Promise<Student> => {
  const results = await sql`SELECT * FROM Estudiantes WHERE id_estudiante = ${id}`;
  return StudentSchema.parse(results[0]);
};

export const deleteStudent = async (id: number): Promise<Student> => {
  const results = await sql`DELETE FROM Estudiantes WHERE id_estudiante = ${id} RETURNING *`;
  return StudentSchema.parse(results[0]);
};
