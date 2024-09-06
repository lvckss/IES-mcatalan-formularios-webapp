import postgres from "postgres";

// Configuración del cliente PostgreSQL
const sql = postgres({
    host: 'localhost',  // Host de la base de datos
    port: 5432,  // Puerto de la base de datos
    database: 'iesmcatalan_formacciona',  // Nombre de la base de datos
    username: 'postgres',  // Usuario de la base de datos
    password: 'ies-mcatalan-123',  // Contraseña de la base de datos
});

export const query = (text: string, params?: any[]) => sql.unsafe(text, params);