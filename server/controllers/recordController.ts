import sql from '../db/db'
import { type PostRecord, type Record, RecordSchema } from "../models/Record";

export const getRecords = async (): Promise<Record[]> => {
  const results = await sql`SELECT * FROM Expedientes`;
  return results.map((result: any) => RecordSchema.parse(result));
};

export const createRecord = async (record: PostRecord): Promise<Record> => {
  const results = await sql`
    INSERT INTO Expedientes (id_estudiante, ano_inicio, ano_fin, id_ciclo, convocatoria, fecha_pago_titulo)
    VALUES (${record.id_estudiante}, ${record.ano_inicio}, ${record.ano_fin}, ${record.id_ciclo}, ${record.convocatoria}, ${record.fecha_pago_titulo ?? null})
    RETURNING *
  `;
  return RecordSchema.parse(results[0]);
};

export const getRecordById = async (id: number): Promise<Record> => {
  const results = await sql`SELECT * FROM Expedientes WHERE id_expediente = ${id}`;
  return RecordSchema.parse(results[0]);
};

export const deleteRecord = async (id: number): Promise<Record> => {
  const results = await sql`DELETE FROM Expedientes WHERE id_expediente = ${id} RETURNING *`;
  return RecordSchema.parse(results[0]);
};

export const getRecordsByStudentId = async (student_id: number): Promise<Record[]> => {
  const results = await sql`SELECT * FROM Expedientes WHERE id_estudiante = ${student_id}`;
  return results.map(record => RecordSchema.parse(record));
}