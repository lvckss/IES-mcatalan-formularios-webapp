// server/auth.ts
import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { admin } from "better-auth/plugins/admin";

export const auth = betterAuth({
  // conexión a Postgres SOLO para Better Auth
  database: new Pool({
    connectionString:
      process.env.DATABASE_URL ??
      "postgres://postgres:postgres@localhost:5432/mcatalan",
  }), // patrón recomendado en la doc de PostgreSQL:contentReference[oaicite:3]{index=3}

  // URL pública del backend
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",

  // secreto (si no lo pones, coge BETTER_AUTH_SECRET por defecto):contentReference[oaicite:4]{index=4}
  secret: process.env.BETTER_AUTH_SECRET,

  // quién puede hablar con /api/auth desde el navegador
  trustedOrigins: ["http://localhost:5173"],

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
      },
    },
  },

  // activamos login/registro por email+password:contentReference[oaicite:5]{index=5}
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },

  plugins: [
    admin(),
  ],
});