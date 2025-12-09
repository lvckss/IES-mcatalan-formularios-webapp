import sql from '../db/db'
import { type PostRecord, type Record, RecordSchema } from "../models/Record";

export const getRecords = async (): Promise<Record[]> => {
  const results = await sql`SELECT * FROM Expedientes`;
  return results.map((result: any) => RecordSchema.parse(result));
};

export const createRecord = async (record: PostRecord): Promise<Record> => {
  const results = await sql`
    INSERT INTO Expedientes (id_estudiante, ano_inicio, ano_fin, id_ciclo, turno, convocatoria, fecha_pago_titulo, vino_traslado, dado_baja)
    VALUES (${record.id_estudiante}, ${record.ano_inicio}, ${record.ano_fin}, ${record.id_ciclo}, ${record.turno}, ${record.convocatoria}, ${record.fecha_pago_titulo ?? null}, ${record.vino_traslado ?? false}, ${record.dado_baja ?? false})
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

export const updateFechaPagoTitulo = async (
  record_id: number,
  fecha_pago_titulo: Date
): Promise<Record[]> => {
  const results = await sql`
    WITH base AS (
      SELECT 
        e.id_estudiante,
        e.id_ciclo
      FROM Expedientes e
      WHERE e.id_expediente = ${record_id}
    ),
    updated AS (
      UPDATE Expedientes e
      SET fecha_pago_titulo = ${fecha_pago_titulo}
      FROM base b
      WHERE 
        e.id_estudiante = b.id_estudiante
        AND e.id_ciclo = b.id_ciclo
      RETURNING e.*
    )
    SELECT * FROM updated
    ORDER BY id_expediente;
  `;

  if (!results[0]) {
    throw new Error("No existe ese expediente o no hay expedientes asociados a ese ciclo para el alumno.");
  }

  return results.map((row: any) => RecordSchema.parse(row));
};

export const patchBajaEstudianteCiclo = async (id_estudiante: number, id_ciclo: number, dado_baja: boolean): Promise<Record[]> => {
  const results = await sql`
    UPDATE Expedientes e
    SET dado_baja = ${dado_baja}
    FROM Ciclos c
    WHERE e.id_ciclo = c.id_ciclo
      AND e.id_estudiante = ${id_estudiante}
      AND c.codigo = (SELECT codigo FROM Ciclos WHERE id_ciclo = ${id_ciclo})
      AND e.dado_baja IS DISTINCT FROM ${dado_baja}
    RETURNING *;
  `;

  if (!results[0]) throw new Error("No existe ese expediente");
  return results.map(record => RecordSchema.parse(record));
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

export const deleteRecordComplete = async (id: number): Promise<Record[]> => {
  const results = await sql`
    DELETE FROM Expedientes e
    USING Expedientes t
    WHERE t.id_expediente = ${id}
      AND e.id_estudiante = t.id_estudiante
      AND e.id_ciclo      = t.id_ciclo
      AND (
            -- any later academic year (strictly greater)
            e.ano_inicio > t.ano_inicio
        OR (e.ano_inicio = t.ano_inicio AND e.ano_fin > t.ano_fin)

            -- the target year itself: always delete the target;
            -- and if target is Ordinaria, also delete same-year Extraordinaria
        OR (e.ano_inicio = t.ano_inicio AND e.ano_fin = t.ano_fin AND (
              e.id_expediente = t.id_expediente
            OR (t.convocatoria = 'Ordinaria' AND e.convocatoria = 'Extraordinaria')
        ))
      )
    RETURNING e.*
  `;

  if (!results || results.length === 0) {
    return [];
  }

  return results.map((result: any) => RecordSchema.parse(result));
}