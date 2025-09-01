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
        '5','6','7','8','9','10','10-MH',
        'APTO','CV','CV-5','CV-6','CV-7','CV-8','CV-9','CV-10'
      )
    ) AS can_approve;
  `;

  return Boolean(result[0]?.can_approve)
}

// QUERY GRANDE [SEPARACIÓN] -----------------------------------------------------------------

type NotaEnum =
  | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10'
  | '10-MH'
  | 'CV' | 'CV-5' | 'CV-6' | 'CV-7' | 'CV-8' | 'CV-9' | 'CV-10'
  | 'AM' | 'RC' | 'NE' | 'APTO' | 'NO APTO';

type NotasMasAltasPorCicloReturn = {
  id_ciclo: number;     // curso concreto (1º o 2º) dentro del ciclo
  id_modulo: number;
  modulo: string;
  codigo_modulo: string;
  mejor_nota: NotaEnum | null;
};

export const notasMasAltasEstudiantePorCicloCompleto = async (
  id_estudiante: number,
  any_id_ciclo_del_ciclo: number
): Promise<NotasMasAltasPorCicloReturn[]> => {
  const results = await sql`
    -- $1 = id_estudiante
    -- $2 = any_id_ciclo_del_ciclo (un id_ciclo perteneciente al ciclo objetivo)

    -- 1) Hallamos el "codigo" del ciclo (agrupa 1º y 2º si existen)
    WITH target_codigo AS (
      SELECT codigo
      FROM Ciclos
      WHERE id_ciclo = ${any_id_ciclo_del_ciclo}
    ),

    -- 2) Reunimos todos los id_ciclo que comparten ese codigo (todos los cursos)
    ciclos_objetivo AS (
      SELECT id_ciclo
      FROM Ciclos
      WHERE codigo IN (SELECT codigo FROM target_codigo)
    ),

    -- 3) Expedientes del alumno en cualquiera de esos cursos
    exp AS (
      SELECT id_expediente, ano_inicio, ano_fin
      FROM Expedientes
      WHERE id_estudiante = ${id_estudiante}
        AND id_ciclo IN (SELECT id_ciclo FROM ciclos_objetivo)
    ),

    -- 4) Todas las matrículas de esos expedientes con métricas de comparación
    m_all AS (
      SELECT
        m.*,
        e.ano_inicio,
        e.ano_fin,

        -- ¿Aprobada?
        CASE
          WHEN m.nota IN (
            '5','6','7','8','9','10','10-MH',
            'APTO','CV','CV-5','CV-6','CV-7','CV-8','CV-9','CV-10'
          ) THEN 1 ELSE 0
        END AS pass_flag,

        -- Valor base comparable
        CASE
          WHEN m.nota IS NULL THEN 0
          WHEN m.nota = '10-MH' THEN 10
          WHEN m.nota::text ~ '^[0-9]+$' THEN (m.nota::text)::int
          WHEN m.nota::text LIKE 'CV-%' THEN split_part(m.nota::text,'-',2)::int
          WHEN m.nota IN ('CV','APTO') THEN 5
          ELSE 0
        END AS base_num,

        -- Bonus para 10-MH
        CASE WHEN m.nota = '10-MH' THEN 1 ELSE 0 END AS mh_boost
      FROM Matriculas m
      JOIN exp e ON e.id_expediente = m.id_expediente
      WHERE m.id_estudiante = ${id_estudiante}
    ),

    -- 5) Mejor intento por módulo a nivel global (entre años/convocatorias)
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

    -- 6) Listamos TODOS los módulos de TODOS los cursos del ciclo, con mejor_nota o NULL
    SELECT
      mo.id_ciclo,
      mo.curso,
      mo.id_modulo,
      mo.nombre        AS modulo,
      mo.codigo_modulo,
      b.nota           AS mejor_nota
    FROM Modulos mo
    LEFT JOIN best b
      ON b.id_modulo = mo.id_modulo
    WHERE mo.id_ciclo IN (SELECT id_ciclo FROM ciclos_objetivo)
    ORDER BY
      -- ordena por curso y luego por nombre del módulo
      mo.curso, mo.nombre;
  `;

  return results.map((row) => ({
    id_ciclo: Number(row.id_ciclo),
    id_modulo: Number(row.id_modulo),
    modulo: String(row.modulo),
    codigo_modulo: String(row.codigo_modulo),
    mejor_nota: (row.mejor_nota ?? null) as NotaEnum | null,
  }));
};
