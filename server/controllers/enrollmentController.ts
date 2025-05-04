import errorMap from 'zod/locales/en.js';
import sql from '../db/db'
import { type PostEnrollment, type Enrollment, EnrollmentSchema } from "../models/Enrollment";

export const getEnrollments = async (): Promise<Enrollment[]> => {
  const results = await sql`SELECT * FROM Matriculas`;
  return results.map((result: any) => EnrollmentSchema.parse(result));
};

export const createEnrollment = async (enrollment: PostEnrollment): Promise<Enrollment> => {
  const results = await sql`
    INSERT INTO Matriculas (id_expediente, id_modulo, status, completion_status, nota)
    VALUES (${enrollment.id_expediente}, ${enrollment.id_modulo}, ${enrollment.status}, ${enrollment.completion_status}, ${enrollment.nota ?? null})
    RETURNING *
  `;
  return EnrollmentSchema.parse(results[0]);
};

export const getEnrollmentById = async (id: number): Promise<Enrollment> => {
  const results = await sql`SELECT * FROM Matriculas WHERE id_matricula = ${id}`;
  return EnrollmentSchema.parse(results[0]);
};

export const deleteEnrollment = async (id: number): Promise<Enrollment> => {
  const results = await sql`DELETE FROM Matriculas WHERE id_matricula = ${id} RETURNING *`;
  return EnrollmentSchema.parse(results[0]);
};

export const getEnrollmentsByRecordId = async (record_id: number): Promise<Enrollment[]> => {
  const results = await sql`SELECT * FROM Matriculas WHERE id_expediente = ${record_id}`;
  return results.map(enrollment => EnrollmentSchema.parse(enrollment));
}