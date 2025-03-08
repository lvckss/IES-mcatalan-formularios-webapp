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

export const deleteModule = async (id: number): Promise<Module> => {
  const results = await sql`DELETE FROM Modulos WHERE id_modulo = ${id} RETURNING *`;
  return ModuleSchema.parse(results[0]);
};