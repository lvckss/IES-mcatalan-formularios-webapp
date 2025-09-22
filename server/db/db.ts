import postgres from "postgres";

const sql = postgres({
  host: 'localhost',
  port: 5432,
  database: 'mcatalan',
  username: 'postgres',
  password: 'postgres',

  // 🔎 Modo debug: imprime la consulta y sus parámetros
  debug: (connection, query, params) => {
    // ID del backend de Postgres (útil si hay varias conexiones)
    const pid = (connection as any)?.processID ?? 'conn';

    console.log(`[pg:${pid}] QUERY:\n${query}`);
    console.log(`[pg:${pid}] PARAMS:`, params);

    // Aviso específico si entra un NaN
    if (Array.isArray(params) && params.some(p => typeof p === 'number' && Number.isNaN(p))) {
      console.warn(`[pg:${pid}] ⚠️ Detectado parámetro NaN en la consulta anterior.`);
      // Si quieres pinchar la ejecución en dev:
      // throw new Error('NaN parameter passed to Postgres query');
    }
  },

  // Notificaciones del servidor (NOTICE, etc.)
  onnotice: (notice) => {
    console.warn('[pg notice]', notice);
  },
});

(async () => {
  try {
    await sql`SELECT 1`; // Test query
    console.log("Database connected successfully!");
  } catch (error) {
    console.error("Failed to connect to the database:", error);
  }
})();

export default sql;