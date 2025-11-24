// frontend/src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

// Si quieres, define en .env.frontend:
// VITE_API_URL=http://localhost:3000
export const authClient = createAuthClient({
  // URL del servidor donde tienes Better Auth montado (Hono)
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
});

// Exponemos helpers cómodos para usar en la app
export const { signIn, signUp, signOut, useSession } = authClient;