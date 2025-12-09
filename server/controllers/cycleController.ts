import sql from '../db/db';
import { type PostCycle, type Cycle, ByNameCycleSchema, CycleSchema } from "../models/Cycle";

export const getCycles = async (): Promise<Cycle[]> => {
  const results = await sql`SELECT * FROM Ciclos`;
  return results.map((result: any) => CycleSchema.parse(result));
};

export const getCyclesByName = async (): Promise<ReturnType<typeof ByNameCycleSchema.parse>[]> => {
  // Se utiliza DISTINCT para traer solo una fila por cada combinación de código y nombre.
  const results = await sql`
    SELECT DISTINCT codigo, nombre, norma_1, norma_2, ley, tipo_ciclo
    FROM Ciclos
  `;
  return results.map((result: any) => ByNameCycleSchema.parse(result));
};

export const createCycle = async (cycle: PostCycle): Promise<Cycle> => {
  const results = await sql`
    INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2, ley, tipo_ciclo)
    VALUES (${cycle.curso}, ${cycle.nombre}, ${cycle.codigo}, ${cycle.norma_1}, ${cycle.norma_2}, ${cycle.ley}, ${cycle.tipo_ciclo})
    RETURNING *
  `;
  return CycleSchema.parse(results[0]);
};

export const getCycleById = async (id: number): Promise<Cycle> => {
  const results = await sql`SELECT * FROM Ciclos WHERE id_ciclo = ${id}`;
  return CycleSchema.parse(results[0]);
};

export const getCycleByCode = async (code: string): Promise<Cycle[]> => {
  const results = await sql`SELECT * FROM Ciclos WHERE codigo = ${code}`;
  return results.map((result: any) => CycleSchema.parse(result));
};

export const getCycleByLaw = async (law: number): Promise<ReturnType<typeof ByNameCycleSchema.parse>[]> => {
  const results = await sql`
    SELECT DISTINCT codigo, nombre, norma_1, norma_2, ley, tipo_ciclo
    FROM Ciclos
    WHERE ley = ${law}
  `;
  return results.map((result: any) => ByNameCycleSchema.parse(result));
};

export const deleteCycle = async (id: number): Promise<Cycle> => {
  const results = await sql`DELETE FROM Ciclos WHERE id_ciclo = ${id} RETURNING *`;
  return CycleSchema.parse(results[0]);
};