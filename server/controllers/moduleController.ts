import sql from '../db/db'
import { type PostModule, type Module, ModuleSchema } from "../models/Module";

export const getModules = async (): Promise<Module[]> => {
  const results = await sql`SELECT * FROM Modulos`;
  return results.map((result: any) => ModuleSchema.parse(result));
};

export const createModule = async (module: PostModule): Promise<Module> => {
  const results = await sql`
    INSERT INTO Modulos (nombre, id_ciclo, curso)
    VALUES (${module.nombre}, ${module.id_ciclo}, ${module.curso})
    RETURNING *
  `;
  return ModuleSchema.parse(results[0]);
};

export const getModuleById = async (id: number): Promise<Module> => {
  const results = await sql`SELECT * FROM Modulos WHERE id_modulo = ${id}`;
  return ModuleSchema.parse(results[0]);
};

export const getModuleByCycleId = async (id: number): Promise<Module[]> => {
  const results = await sql`SELECT * FROM Modulos WHERE id_ciclo = ${id}`;
  return results.map((result: any) => ModuleSchema.parse(result));
};

export const getModulesByCycleCodeAndCurso = async (cycle_code: string, curso: string): Promise<Module[]> => {
  const results = await sql`
    SELECT m.*
    FROM ciclos AS c
    JOIN modulos AS m ON m.id_ciclo = c.id_ciclo
    WHERE c.codigo = ${cycle_code}
    AND c.curso = ${curso}`
  ;

  return results.map((result: any) => ModuleSchema.parse(result))
}

export const deleteModule = async (id: number): Promise<Module> => {
  const results = await sql`DELETE FROM Modulos WHERE id_modulo = ${id} RETURNING *`;
  return ModuleSchema.parse(results[0]);
};

export const countConvocatorias = async (
  id_estudiante: number,
  id_modulo: number
): Promise<number> => {
  const rows = await sql`
    WITH intentos AS (
      SELECT
        m.id_matricula,
        e.ano_inicio,
        e.ano_fin,
        e.convocatoria,
        m.nota,
        ROW_NUMBER() OVER (
          ORDER BY
            e.ano_inicio,
            e.ano_fin,
            CASE e.convocatoria
              WHEN 'Ordinaria' THEN 0
              WHEN 'Extraordinaria' THEN 1
              ELSE 2
            END,
            m.id_matricula
        ) AS intento_n
      FROM Matriculas m
      JOIN Expedientes e ON e.id_expediente = m.id_expediente
      WHERE m.id_estudiante = ${id_estudiante}
        AND m.id_modulo     = ${id_modulo}
        AND m.nota IS DISTINCT FROM 'RC'::nota_enum   -- ⬅️ excluye RC y también NULL
    ),
    primera_aprob AS (
      SELECT MIN(intento_n) AS n
      FROM intentos
      WHERE nota = ANY (ARRAY[
        '5'::nota_enum,'6'::nota_enum,'7'::nota_enum,'8'::nota_enum,'9'::nota_enum,'10'::nota_enum,
        '10-MH'::nota_enum,'10-Matr. Honor'::nota_enum,
        'APTO'::nota_enum,
        'CV'::nota_enum,'CV-5'::nota_enum,'CV-6'::nota_enum,'CV-7'::nota_enum,'CV-8'::nota_enum,'CV-9'::nota_enum,'CV-10'::nota_enum,'CV-10-MH'::nota_enum,
        'TRAS-5'::nota_enum,'TRAS-6'::nota_enum,'TRAS-7'::nota_enum,'TRAS-8'::nota_enum,'TRAS-9'::nota_enum,'TRAS-10'::nota_enum,'TRAS-10-MH'::nota_enum,
        'EX'::nota_enum
      ])
    )
    SELECT COALESCE(
      (SELECT n FROM primera_aprob),      -- hasta el primer aprobado (incluido)
      (SELECT COUNT(*) FROM intentos)     -- si nunca aprueba: todas las que cuentan
    )::int AS convocatorias;
  `;

  return Number(rows[0]?.convocatorias ?? 0);
};