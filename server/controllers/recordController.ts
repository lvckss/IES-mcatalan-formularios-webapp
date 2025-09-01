import sql from '../db/db'
import { type PostRecord, type Record, RecordSchema } from "../models/Record";

export const getRecords = async (): Promise<Record[]> => {
  const results = await sql`SELECT * FROM Expedientes`;
  return results.map((result: any) => RecordSchema.parse(result));
};

export const createRecord = async (record: PostRecord): Promise<Record> => {
  const results = await sql`
    INSERT INTO Expedientes (id_estudiante, ano_inicio, ano_fin, id_ciclo, turno, convocatoria, fecha_pago_titulo, vino_traslado)
    VALUES (${record.id_estudiante}, ${record.ano_inicio}, ${record.ano_fin}, ${record.id_ciclo}, ${record.turno}, ${record.convocatoria}, ${record.fecha_pago_titulo ?? null}, ${record.vino_traslado ?? false})
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

export const updateFechaPagoTitulo = async (record_id: number, fecha_pago_titulo: Date): Promise<Record> => {
  const results = await sql`
    UPDATE Expedientes
    SET fecha_pago_titulo = ${fecha_pago_titulo}
    WHERE id_expediente = ${record_id}
    RETURNING *
  `;

  if (!results[0]) throw new Error("No existe ese expediente");
  return RecordSchema.parse(results[0]);
}

export const checkPuedeCursar = async (id_estudiante: number, id_ciclo: number, ano_inicio: number, ano_fin: number): Promise<boolean> => {
  const result = await sql`
    SELECT NOT EXISTS (
    SELECT 1
    FROM Expedientes
    WHERE id_estudiante = ${id_estudiante}
      AND id_ciclo      = ${id_ciclo}
      AND ano_inicio    = ${ano_inicio}
      AND ano_fin       = ${ano_fin}
    ) AS can_enroll;
  `;

  return Boolean(result[0]?.can_enroll)
}