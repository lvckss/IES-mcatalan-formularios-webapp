import sql from '../db/db';
import { type PostLaw, type Law, createLawSchema, LawSchema } from '../models/Law';

export const getLaws = async (): Promise<Law[]> => {
    const results = await sql`SELECT * FROM Leyes`;
    return results.map((result: any) => LawSchema.parse(result));
};

export const createLaw = async (ley: PostLaw): Promise<Law> => {
    try {
        const results = await sql`
        INSERT INTO Leyes (nombre_ley)
        VALUES (${ley.nombre_ley})
        RETURNING *
  `;
        return LawSchema.parse(results[0]);
    } catch (error: any) {
        if (error.code === '23505') {
            throw new Error('UNIQUE_VIOLATION')
        }
        throw error
    }
};

export const deleteLaw = async (id_ley: number): Promise<Law> => {
  // Gracias a ON DELETE CASCADE:
  // Leyes -> Ciclos (FK Ciclos.ley) -> Modulos (FK Modulos.id_ciclo)
  const results = await sql`
    DELETE FROM Leyes
    WHERE id_ley = ${id_ley}
    RETURNING *
  `;

  if (!results?.length) {
    throw new Error('LAW_NOT_FOUND');
  }

  return LawSchema.parse(results[0]);
};