import sql from '../db/db'
import { type Directivo, DirectivoSchema } from '../models/Directivos'

export const getDirectivos = async (): Promise<Directivo[]> => {
    const results = await sql`SELECT * FROM Directivos`;
    return results.map((result: any) => DirectivoSchema.parse(result))
}

export const getDirectivoByCargo = async (cargo: string): Promise<Directivo> => {
    const results = await sql`SELECT * FROM Directivos WHERE cargo = ${cargo}`;
    return DirectivoSchema.parse(results[0]);
}

export const updateDirectivoByCargo = async (cargo: string, nombre: string): Promise<Directivo> => {
    const results = await sql`
        UPDATE Directivos
        SET nombre = ${nombre}
        WHERE cargo = ${cargo}
        RETURNING *`
    ;
    
    if (!results?.length) {
        throw new Error("Directivo no encontrado");
    }
    return DirectivoSchema.parse(results[0]);
};