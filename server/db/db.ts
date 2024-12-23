import postgres from "postgres";

const sql = postgres({
    host: 'localhost',
    port: 5432,
    database: 'mcatalan',
    username: 'postgres',
    password: 'postgres',
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