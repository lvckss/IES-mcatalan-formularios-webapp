import sql from "../db/db";
import type { Ciclo } from "../models/ciclo";

export const getCiclos = async () => {
    return await sql`SELECT * FROM Ciclos`;
};

export const createCiclo = async (ciclo: Ciclo) => {
    return await sql`
        INSERT INTO Ciclos (curso, nombre, codigo, norma_1, norma_2)
        VALUES (${ciclo.curso}, ${ciclo.nombre}, ${ciclo.codigo}, ${ciclo.norma_1}, ${ciclo.norma_2}) RETURNING *',
    `;
};

export const getCicloById = async (id: number) => {
    return await sql`SELECT * FROM Ciclos WHERE id_ciclo = ${id}`;
};

export const deleteCiclo = async (id: number) => {
    return await sql`DELETE FROM Ciclos WHERE id_ciclo = ${id} RETURNING *`;
};
