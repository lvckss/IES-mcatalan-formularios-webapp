import { serveStatic } from 'hono/bun'
import { Hono } from 'hono';
import { auth } from "./auth";
import { cors } from "hono/cors";
import { logger } from 'hono/logger';

import { cyclesRoute } from './routes/cyclesRoute';
import { lawsRoute } from './routes/lawRoutes';
import { enrollmentsRoute } from './routes/enrollmentsRoute';
import { modulesRoute } from './routes/modulesRoute';
import { recordsRoute } from './routes/recordsRoute';
import { studentsRoute } from './routes/studentsRoute';
import { directivosRoute } from './routes/directivosRoute';
import { groupsRoute } from './routes/groupsRoute';

const isProd = process.env.BUN_ENV === "production";

// en producción normalmente frontend y backend comparten dominio,
// así que no hace falta CORS. 
// Usamos CORS SOLO para desarrollo (cuando el front va en 5173).
const devCorsOrigin = "http://localhost:5173";

export type AppBindings = {
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
};

const app = new Hono<AppBindings>();

app.use(logger());

// CORS SOLO en dev para /api/auth/*
if (!isProd) {
  app.use(
    "/api/auth/*",
    cors({
      origin: devCorsOrigin,
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "OPTIONS"],
      credentials: true,
    })
  );
}

// Middleware para resolver la sesión en todas las rutas /api/*
app.use("/api/*", async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    c.set("user", null);
    c.set("session", null);
    return next();
  }

  c.set("user", session.user);
  c.set("session", session.session);
  return next();
});

// Rutas de autenticación Better Auth
app.on(["GET", "POST"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

// Healthcheck
app.get("/health", c => {
  return c.json({ "message": "más sanito que una manzana" });
});

// Rutas API
const apiRoutes = app.basePath("/api")
  .route("/students", studentsRoute)
  .route("/modules", modulesRoute)
  .route("/cycles", cyclesRoute)
  .route("/laws", lawsRoute)
  .route("/records", recordsRoute)
  .route("/enrollments", enrollmentsRoute)
  .route("/directivos", directivosRoute)
  .route("/groups", groupsRoute);

// ----------------------------------------------------------------------------------------------------
// Static frontend SOLO en producción
// En dev ya usas Vite en el 5173.
if (isProd) {
  // Sirve los archivos generados por `frontend` (bun run build dentro de frontend)
  app.get('*', serveStatic({ root: '/frontend/dist' }));
  app.get('*', serveStatic({ path: '/frontend/dist/index.html' }));
}

export default app;
export type ApiRoutes = typeof apiRoutes;