import sql from '../db/db'
import { type PostGrade, type Grade, GradeSchema } from "../models/Grade";

export const getGrades = async (): Promise<Grade[]> => {
  const results = await sql`SELECT * FROM Calificaciones`;
  return results.map((result: any) => GradeSchema.parse(result));
};

export const createGrade = async (grade: PostGrade): Promise<Grade> => {
  const results = await sql`
    INSERT INTO Calificaciones (id_matricula, nota)
    VALUES (${grade.id_matricula}, ${grade.nota})
    RETURNING *
  `;
  return GradeSchema.parse(results[0]);
};

export const getGradeById = async (id: number): Promise<Grade> => {
  const results = await sql`SELECT * FROM Calificaciones WHERE id_calificacion = ${id}`;
  return GradeSchema.parse(results[0]);
};

export const deleteGrade = async (id: number): Promise<Grade> => {
  const results = await sql`DELETE FROM Calificaciones WHERE id_calificacion = ${id} RETURNING *`;
  return GradeSchema.parse(results[0]);
};