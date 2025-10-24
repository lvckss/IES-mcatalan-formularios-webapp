import sql from '../db/db';
import { type PostLaw, type Law, createLawSchema, LawSchema  } from '../models/Law';

export const getLaws = async (): Promise<Law[]> => {
    const results = await sql`SELECT * FROM Leyes`;
    return results.map((result : any) => LawSchema.parse(result));
}