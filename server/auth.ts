// server/auth.ts
import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { admin } from "better-auth/plugins/admin";

const APP_ORIGIN = process.env.APP_ORIGIN ?? "http://localhost:5173";

export const auth = betterAuth({
  // conexión a Postgres SOLO para Better Auth
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }), // patrón recomendado en la doc de PostgreSQL

  // URL pública del backend
  baseURL: process.env.BETTER_AUTH_URL ?? APP_ORIGIN,

  // secreto (si no lo pones, coge BETTER_AUTH_SECRET por defecto)
  secret: process.env.BETTER_AUTH_SECRET,

  // quién puede hablar con /api/auth desde el navegador
  trustedOrigins: [
    "http://localhost:5173",
    APP_ORIGIN,
  ],

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
      },
    },
  },

  // activamos login/registro por email+password  
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },

  plugins: [
    admin(),
  ],
});