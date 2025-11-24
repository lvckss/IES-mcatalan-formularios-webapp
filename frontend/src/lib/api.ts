// frontend/src/lib/api.ts
import { hc } from "hono/client";
import { ApiRoutes } from "@server/app";

// Si en dev usas proxy de Vite (/api → http://localhost:3000),
// puedes dejar VITE_API_URL sin definir y usará '/'.
// Si quieres hablar directamente con el backend, pon VITE_API_URL=http://localhost:3000
const baseURL = import.meta.env.VITE_API_URL ?? "/";

const client = hc<ApiRoutes>(baseURL, {
  init: {
    // Por si algún día usas baseURL absoluto tipo "http://localhost:3000"
    // y no solo rutas relativas: así te aseguras de que las cookies
    // de Better Auth se envían siempre.
    credentials: "include",
  },
});

export const api = client.api;