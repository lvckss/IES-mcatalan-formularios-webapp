import errorMap from 'zod/locales/en.js';
import sql from '../db/db'
import { type PostEnrollment, type Enrollment, EnrollmentSchema } from "../models/Enrollment";

export const getEnrollments = async (): Promise<Enrollment[]> => {
  const results = await sql`SELECT * FROM Matriculas`;
  return results.map((result: any) => EnrollmentSchema.parse(result));
};

export const createEnrollment = async (enrollment: PostEnrollment): Promise<Enrollment> => {
  const results = await sql`
    INSERT INTO Matriculas (id_expediente, id_modulo, id_estudiante, nota)
    VALUES (${enrollment.id_expediente}, ${enrollment.id_modulo}, ${enrollment.id_estudiante}, ${enrollment.nota ?? null})
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

export const patchEnrollmentNota = async (
  record_id: number,
  module_id: number,
  nota: string | null
): Promise<Enrollment> => {
  try {
    const result = await sql`
      UPDATE Matriculas
      SET nota = ${nota}::nota_enum
      WHERE id_expediente = ${record_id}
        AND id_modulo     = ${module_id}
      RETURNING id_matricula, id_expediente, id_modulo, id_estudiante, (nota)::text AS nota;
    `;

    if (!result[0]) {
      const err: any = new Error("No existe la matrícula");
      err.status = 404;
      throw err;
    }

    return EnrollmentSchema.parse(result[0]);
  } catch (e: any) {
    // Si choca con el índice único parcial (segunda aprobada)
    if (e.code === '23505') {
      const err: any = new Error('Ese estudiante ya tiene aprobado ese módulo; no puede aprobarse de nuevo.');
      err.status = 409;
      err.code = e.code;
      throw err;
    }
    throw e;
  }
};

export const checkSePuedeAprobar = async (id_estudiante: number, id_modulo: number): Promise<boolean> => {
  const result = await sql`
    SELECT NOT EXISTS (
      SELECT 1
      FROM Matriculas
      WHERE id_estudiante = ${id_estudiante}
        AND id_modulo = ${id_modulo}
        AND nota IN (
          '5','6','7','8','9','10','10-MH','10-Matr. Honor',
          'APTO','CV','CV-5','CV-6','CV-7','CV-8','CV-9','CV-10','CV-10-MH',
          'TRAS-5','TRAS-6','TRAS-7','TRAS-8','TRAS-9','TRAS-10','TRAS-10-MH',
          'EX'
        )
    ) AS can_approve;
  `;

  return Boolean(result[0]?.can_approve);
};

/*
Borra la matrícula objetivo (id_matricula = $1) y todas las matrículas
del MISMO alumno y MISMO módulo en AÑOS POSTERIORES.
Además, si la matrícula objetivo es de convocatoria 'Ordinaria',
borra también la del mismo año en 'Extraordinaria' (si existiera).
*/

// Deletes the target enrollment (plus cascade by your rules),
// then deletes any empty Expedientes for that same student.
// Returns the deleted enrollments.
export const deleteEnrollmentCascade = async (id_matricula: number): Promise<Enrollment[]> => {
  try {
    const result = await sql.begin(async (trx) => {
      // 1) Delete enrollments (anchor + cascade)
      const deleted = await trx/* sql */`
        WITH del AS (
          DELETE FROM Matriculas m
          USING Matriculas t,           -- matrícula objetivo
                Expedientes te,         -- expediente del objetivo
                Expedientes me          -- expediente de cada matrícula candidata
          WHERE t.id_matricula = ${id_matricula}
            AND te.id_expediente = t.id_expediente
            AND me.id_expediente = m.id_expediente

            -- mismo alumno y mismo módulo
            AND m.id_estudiante = t.id_estudiante
            AND m.id_modulo     = t.id_modulo

            AND (
                  -- a) años posteriores
                  me.ano_inicio > te.ano_inicio
               OR (me.ano_inicio = te.ano_inicio AND me.ano_fin > te.ano_fin)

                  -- b) el propio año/expediente objetivo (borra la matrícula ancla)
               OR  me.id_expediente = te.id_expediente

                  -- c) mismo año "extra" si el objetivo es Ordinaria
               OR (me.ano_inicio = te.ano_inicio
                   AND me.ano_fin = te.ano_fin
                   AND te.convocatoria = 'Ordinaria'
                   AND me.convocatoria = 'Extraordinaria')
            )
          RETURNING
            m.id_matricula,
            m.id_expediente,
            m.id_modulo,
            m.id_estudiante,
            (m.nota)::text AS nota
        )
        SELECT * FROM del;
      `;

      if (deleted.length === 0) {
        const err: any = new Error("No existe la matrícula");
        err.status = 404;
        throw err;
      }

      // 2) Cleanup: remove empty Expedientes for this student
      const studentId = deleted[0].id_estudiante as number;

      await trx/* sql */`
        DELETE FROM Expedientes e
        WHERE e.id_estudiante = ${studentId}
          AND NOT EXISTS (
            SELECT 1
            FROM Matriculas mm
            WHERE mm.id_expediente = e.id_expediente
          );
      `;

      // 3) Return the deleted enrollments parsed
      return deleted.map((row: any) => EnrollmentSchema.parse(row));
    });

    return result;
  } catch (e: any) {
    // Optional: surface FK issues clearly if some other table blocks deleting an Expediente
    // if (e.code === '23503') {
    //   const err: any = new Error('No se puede borrar el expediente vacío por dependencias (FK).');
    //   err.status = 409;
    //   throw err;
    // }
    throw e;
  }
};


// QUERY GRANDE [SEPARACIÓN] -----------------------------------------------------------------

type NotaEnum =
  | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10"
  | "10-MH" | "10-Matr. Honor"
  | "CV" | "CV-5" | "CV-6" | "CV-7" | "CV-8" | "CV-9" | "CV-10" | "CV-10-MH"
  | "TRAS-5" | "TRAS-6" | "TRAS-7" | "TRAS-8" | "TRAS-9" | "TRAS-10" | "TRAS-10-MH"
  | "RC" | "NE" | "APTO" | "NO APTO" | "EX";

type NotasMasAltasPorCicloReturn = {
  id_ciclo: number;     // curso concreto (1º o 2º) dentro del ciclo
  id_modulo: number;
  modulo: string;
  codigo_modulo: string;
  mejor_nota: NotaEnum | null;
  mejor_ano_inicio: number | null;
  mejor_ano_fin: number | null;
  convocatoria: number | null;
};

export const notasMasAltasEstudiantePorCicloCompleto = async (
  id_estudiante: number,
  any_id_ciclo_del_ciclo: number
): Promise<NotasMasAltasPorCicloReturn[]> => {
  const results = await sql`
    WITH target_codigo AS (
    SELECT codigo
    FROM Ciclos
    WHERE id_ciclo = ${any_id_ciclo_del_ciclo}
    ),
    ciclos_objetivo AS (
      SELECT id_ciclo
      FROM Ciclos
      WHERE codigo IN (SELECT codigo FROM target_codigo)
    ),
    exp AS (
      SELECT id_expediente, ano_inicio, ano_fin, convocatoria
      FROM Expedientes
      WHERE id_estudiante = ${id_estudiante}
        AND id_ciclo IN (SELECT id_ciclo FROM ciclos_objetivo)
    ),
    m_all AS (
      SELECT
        m.*,
        e.ano_inicio,
        e.ano_fin,
        e.convocatoria AS exp_convocatoria,

        CASE
          WHEN m.nota IN (
            '5','6','7','8','9','10','10-MH',
            'APTO','CV','CV-5','CV-6','CV-7','CV-8','CV-9','CV-10'
          ) THEN 1 ELSE 0
        END AS pass_flag,

        CASE
          WHEN m.nota IS NULL THEN 0
          WHEN m.nota = '10-MH' THEN 10
          WHEN m.nota::text ~ '^[0-9]+$' THEN (m.nota::text)::int
          WHEN m.nota::text LIKE 'CV-%' THEN split_part(m.nota::text,'-',2)::int
          WHEN m.nota IN ('CV','APTO') THEN 5
          ELSE 0
        END AS base_num,

        CASE WHEN m.nota = '10-MH' THEN 1 ELSE 0 END AS mh_boost
      FROM Matriculas m
      JOIN exp e ON e.id_expediente = m.id_expediente
      WHERE m.id_estudiante = ${id_estudiante}
    ),
    -- Orden cronológico de intentos por módulo (para numerar "convocatorias")
    attempts AS (
      SELECT
        m_all.*,
        ROW_NUMBER() OVER (
          PARTITION BY id_modulo
          ORDER BY
            ano_inicio ASC,
            ano_fin   ASC,
            CASE WHEN exp_convocatoria = 'Ordinaria' THEN 0
                WHEN exp_convocatoria = 'Extraordinaria' THEN 1
                ELSE 2 END,
            id_matricula ASC
        ) AS intento_num
      FROM m_all
    ),
    -- Nº de la primera convocatoria aprobada (si existe)
    pass_conv AS (
      SELECT id_modulo, MIN(intento_num) AS convocatoria
      FROM attempts
      WHERE pass_flag = 1
      GROUP BY id_modulo
    ),
    -- Nº total de intentos hasta la fecha (si aún no ha aprobado)
    attempt_totals AS (
      SELECT id_modulo, MAX(intento_num) AS total_intentos
      FROM attempts
      GROUP BY id_modulo
    ),
    -- Mejor intento por tus reglas (para "mejor_nota" y años)
    best AS (
      SELECT DISTINCT ON (id_modulo)
            id_modulo, id_matricula, id_expediente, nota,
            pass_flag, base_num, mh_boost,
            ano_inicio, ano_fin
      FROM m_all
      ORDER BY
        id_modulo,
        pass_flag DESC,
        base_num  DESC,
        mh_boost  DESC,
        ano_fin   DESC,
        ano_inicio DESC,
        id_matricula DESC
    )

    -- SELECT final
    SELECT
      mo.id_ciclo,
      mo.curso,
      mo.id_modulo,
      mo.nombre        AS modulo,
      mo.codigo_modulo,
      b.nota           AS mejor_nota,
      b.ano_inicio     AS mejor_ano_inicio,
      b.ano_fin        AS mejor_ano_fin,
      COALESCE(pc.convocatoria, at.total_intentos) AS convocatoria
    FROM Modulos mo
    LEFT JOIN best b
      ON b.id_modulo = mo.id_modulo
    LEFT JOIN pass_conv pc
      ON pc.id_modulo = mo.id_modulo
    LEFT JOIN attempt_totals at
      ON at.id_modulo = mo.id_modulo
    WHERE mo.id_ciclo IN (SELECT id_ciclo FROM ciclos_objetivo)
    ORDER BY mo.curso, mo.nombre;
  `;

  return results.map((row) => ({
    id_ciclo: Number(row.id_ciclo),
    id_modulo: Number(row.id_modulo),
    modulo: String(row.modulo),
    codigo_modulo: String(row.codigo_modulo),
    mejor_nota: (row.mejor_nota ?? null) as NotaEnum | null,
    mejor_ano_inicio: row.mejor_ano_inicio !== null ? Number(row.mejor_ano_inicio) : null,
    mejor_ano_fin: row.mejor_ano_fin !== null ? Number(row.mejor_ano_fin) : null,
    convocatoria: row.convocatoria !== null ? Number(row.convocatoria) : null,
  }));
};

export const notasMasAltasEstudiantePorCicloCompletoSoloAprobadas = async (
  id_estudiante: number,
  any_id_ciclo_del_ciclo: number
): Promise<NotasMasAltasPorCicloReturn[]> => {
  const results = await sql`
    WITH target_codigo AS (
      SELECT codigo
      FROM Ciclos
      WHERE id_ciclo = ${any_id_ciclo_del_ciclo}
    ),
    ciclos_objetivo AS (
      SELECT id_ciclo
      FROM Ciclos
      WHERE codigo IN (SELECT codigo FROM target_codigo)
    ),
    exp AS (
      SELECT id_expediente, ano_inicio, ano_fin, convocatoria
      FROM Expedientes
      WHERE id_estudiante = ${id_estudiante}
        AND id_ciclo IN (SELECT id_ciclo FROM ciclos_objetivo)
    ),
    m_all AS (
      SELECT
        m.*,
        e.ano_inicio,
        e.ano_fin,
        e.convocatoria AS exp_convocatoria,

        CASE
          WHEN m.nota IN (
            '5','6','7','8','9','10','10-MH',
            'APTO','CV','CV-5','CV-6','CV-7','CV-8','CV-9','CV-10'
          ) THEN 1 ELSE 0
        END AS pass_flag,

        CASE
          WHEN m.nota IS NULL THEN 0
          WHEN m.nota = '10-MH' THEN 10
          WHEN m.nota::text ~ '^[0-9]+$' THEN (m.nota::text)::int
          WHEN m.nota::text LIKE 'CV-%' THEN split_part(m.nota::text,'-',2)::int
          WHEN m.nota IN ('CV','APTO') THEN 5
          ELSE 0
        END AS base_num,

        CASE WHEN m.nota = '10-MH' THEN 1 ELSE 0 END AS mh_boost
      FROM Matriculas m
      JOIN exp e ON e.id_expediente = m.id_expediente
      WHERE m.id_estudiante = ${id_estudiante}
    ),
    attempts AS (
      SELECT
        m_all.*,
        ROW_NUMBER() OVER (
          PARTITION BY id_modulo
          ORDER BY
            ano_inicio ASC,
            ano_fin   ASC,
            CASE WHEN exp_convocatoria = 'Ordinaria' THEN 0
                 WHEN exp_convocatoria = 'Extraordinaria' THEN 1
                 ELSE 2 END,
            id_matricula ASC
        ) AS intento_num
      FROM m_all
    ),
    pass_conv AS (
      SELECT id_modulo, MIN(intento_num) AS convocatoria
      FROM attempts
      WHERE pass_flag = 1
      GROUP BY id_modulo
    ),
    attempt_totals AS (
      SELECT id_modulo, MAX(intento_num) AS total_intentos
      FROM attempts
      GROUP BY id_modulo
    ),
    -- Solo el mejor intento APROBADO por módulo; si no hay aprobado, no habrá fila
    best_pass AS (
      SELECT DISTINCT ON (id_modulo)
        id_modulo, id_matricula, id_expediente, nota,
        base_num, mh_boost,
        ano_inicio, ano_fin
      FROM m_all
      WHERE pass_flag = 1
      ORDER BY
        id_modulo,
        base_num  DESC,
        mh_boost  DESC,
        ano_fin   DESC,
        ano_inicio DESC,
        id_matricula DESC
    )

    SELECT
      mo.id_ciclo,
      mo.curso,
      mo.id_modulo,
      mo.nombre        AS modulo,
      mo.codigo_modulo,
      b.nota           AS mejor_nota,
      b.ano_inicio     AS mejor_ano_inicio,
      b.ano_fin        AS mejor_ano_fin,
      COALESCE(pc.convocatoria, at.total_intentos) AS convocatoria
    FROM Modulos mo
    LEFT JOIN best_pass b
      ON b.id_modulo = mo.id_modulo
    LEFT JOIN pass_conv pc
      ON pc.id_modulo = mo.id_modulo
    LEFT JOIN attempt_totals at
      ON at.id_modulo = mo.id_modulo
    WHERE mo.id_ciclo IN (SELECT id_ciclo FROM ciclos_objetivo)
    ORDER BY mo.curso, mo.nombre;
  `;

  return results.map((row) => ({
    id_ciclo: Number(row.id_ciclo),
    id_modulo: Number(row.id_modulo),
    modulo: String(row.modulo),
    codigo_modulo: String(row.codigo_modulo),
    mejor_nota: (row.mejor_nota ?? null) as NotaEnum | null,
    mejor_ano_inicio: row.mejor_ano_inicio !== null ? Number(row.mejor_ano_inicio) : null,
    mejor_ano_fin: row.mejor_ano_fin !== null ? Number(row.mejor_ano_fin) : null,
    convocatoria: row.convocatoria !== null ? Number(row.convocatoria) : null,
  }));
};

export const enrollmentsByRecord = async (
  id_expediente: number,
  id_estudiante: number
): Promise<Enrollment[]> => {
  const results = await sql`
    SELECT *
    FROM matriculas
    WHERE id_expediente = ${id_expediente}
      AND id_estudiante = ${id_estudiante};
  `;

  return results.map(enrollment => EnrollmentSchema.parse(enrollment));
};