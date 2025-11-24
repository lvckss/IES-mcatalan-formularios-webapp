// frontend/src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

// true en build de producción, false en `bun dev`
const isProd = import.meta.env.PROD;

// En desarrollo: backend en http://localhost:3000
// En producción (Render): el backend sirve también el frontend, así que usamos la misma origin
const baseURL = isProd
  ? "/api/auth" // => https://tu-app.onrender.com/api/auth/...
  : `${import.meta.env.VITE_API_URL ?? "http://localhost:3000"}/api/auth`;
//      ^ en dev puedes tener VITE_API_URL=http://localhost:3000 si quieres;
//        si no, cae en "http://localhost:3000" igualmente

export const authClient = createAuthClient({
  baseURL,
});

// Helpers que usas en la app
export const { signIn, signUp, signOut, useSession } = authClient;