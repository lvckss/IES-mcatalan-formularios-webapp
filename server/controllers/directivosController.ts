import sql from '../db/db'
import { type Directivo, DirectivoSchema } from '../models/Directivos'

export const getDirectivoByCargo = async (cargo: string): Promise<Directivo> => {
    const results = await sql`SELECT * FROM Directivos WHERE cargo = ${cargo}`;
    return DirectivoSchema.parse(results[0]);
}