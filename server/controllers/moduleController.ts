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