// frontend/src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

// En Vite:
const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

// 1) Decidir el ORIGIN de la API
let apiOrigin: string;

if (isDev) {
  // 🔹 Desarrollo: el backend corre en http://localhost:3000
  //    (o lo que tú pongas en VITE_API_URL)
  apiOrigin = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
} else {
  // 🔹 Producción (Render):
  //    - Si defines VITE_API_URL en Render, usamos eso
  //    - Si no, usamos window.location.origin (el propio dominio de Render)
  if (import.meta.env.VITE_API_URL) {
    apiOrigin = import.meta.env.VITE_API_URL;
  } else if (typeof window !== "undefined") {
    apiOrigin = window.location.origin;
  } else {
    // Fallback ultra defensivo (no debería ocurrir en el navegador)
    apiOrigin = "";
  }
}

if (!apiOrigin) {
  throw new Error(
    "No se pudo determinar apiOrigin. Define VITE_API_URL o revisa auth-client.ts"
  );
}

// 2) Base URL completa para Better Auth
const baseURL = `${apiOrigin}/api/auth`;

export const authClient = createAuthClient({
  baseURL,
});

export const { signIn, signUp, signOut, useSession } = authClient;