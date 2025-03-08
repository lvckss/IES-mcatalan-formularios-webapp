import sql from '../db/db'
import { type PostCycle, type Cycle, CycleSchema } from "../models/Cycle";

export const getCycles = async (): Promise<Cycle[]> => {
  const results = await sql`SELECT * FROM Ciclos`;
  return results.map((result: any) => CycleSchema.parse(result));
};

export const createCycle = async (cycle: PostCycle): Promise<Cycle> => {
  const results = await sql`
    INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
    VALUES (${cycle.curso}, ${cycle.nombre}, ${cycle.codigo}, ${cycle.norma_1}, ${cycle.norma_2})
    RETURNING *
  `;
  return CycleSchema.parse(results[0]);
};

export const getCycleById = async (id: number): Promise<Cycle> => {
  const results = await sql`SELECT * FROM Ciclos WHERE id_ciclo = ${id}`;
  return CycleSchema.parse(results[0]);
};

export const deleteCycle = async (id: number): Promise<Cycle> => {
  const results = await sql`DELETE FROM Ciclos WHERE id_ciclo = ${id} RETURNING *`;
  return CycleSchema.parse(results[0]);
};