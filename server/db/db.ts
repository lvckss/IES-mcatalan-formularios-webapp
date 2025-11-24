import "dotenv/config";
import postgres from "postgres";

const isProd = process.env.BUN_ENV === "production";

const { DATABASE_URL } = process.env;

const sql = DATABASE_URL
  // Camino Render (hosting) / producción: usar la URL completa
  ? postgres(DATABASE_URL, {
      // En Render Postgres normalmente hace falta cifrado SSL; "require" es el valor correcto.
      ssl: "require",
      debug: !isProd
        ? (connection, query, params) => {
            const pid = (connection as any)?.processID ?? "conn";
            console.log(`[pg:${pid}] QUERY:\n${query}`);
            console.log(`[pg:${pid}] PARAMS:`, params);
          }
        : undefined,
    })
  // Camino local: variables separadas
  : postgres({
      host: process.env.DB_HOST ?? "localhost",
      port: Number(process.env.DB_PORT ?? 5432),
      database: process.env.DB_NAME ?? "mcatalan",
      username: process.env.DB_USER ?? "mcatalan_app",
      password: process.env.DB_PASSWORD ?? "cambia_esto",
      ssl: isProd ? "require" : undefined,
      debug: !isProd
        ? (connection, query, params) => {
            const pid = (connection as any)?.processID ?? "conn";
            console.log(`[pg:${pid}] QUERY:\n${query}`);
            console.log(`[pg:${pid}] PARAMS:`, params);
          }
        : undefined,
    });

(async () => {
  try {
    await sql`SELECT 1`;
    console.log("Database connected successfully!");
  } catch (error) {
    console.error("Failed to connect to the database:", error);
  }
})();

export default sql;