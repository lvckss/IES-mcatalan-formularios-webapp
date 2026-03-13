import "dotenv/config";
import postgres from "postgres";

const isProd = process.env.BUN_ENV === "production";
const { DATABASE_URL } = process.env;

const debug = !isProd
  ? (connection: any, query: string, params: any[]) => {
      const pid = connection?.processID ?? "conn";
      console.log(`[pg:${pid}] QUERY:\n${query}`);
      console.log(`[pg:${pid}] PARAMS:`, params);
    }
  : undefined;

const sql = DATABASE_URL
  ? postgres(DATABASE_URL, {
      ssl: isProd ? "require" : false,
      debug,
    })
  : postgres({
      host: process.env.DB_HOST ?? "127.0.0.1",
      port: Number(process.env.DB_PORT ?? 5432),
      database: process.env.DB_NAME ?? "mcatalan",
      username: process.env.DB_USER ?? "mcatalan_app",
      password: process.env.DB_PASSWORD ?? "cambia_esto",
      ssl: isProd ? "require" : false,
      debug,
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