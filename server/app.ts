import { serveStatic } from 'hono/bun'
import { Hono } from 'hono';
import { logger } from 'hono/logger';

import { cyclesRoute } from './routes/cyclesRoute';
import { enrollmentsRoute } from './routes/enrollmentsRoute';
import { modulesRoute } from './routes/modulesRoute';
import { recordsRoute } from './routes/recordsRoute';
import { regulacionesRoute } from './routes/regulacionesRoute';
import { studentsRoute } from './routes/studentsRoute';

import { api } from '../frontend/src/lib/api';

const app = new Hono();

app.use(logger());

app.get("/health", c => {
    return c.json({ "message": "más sanito que una manzana" });
});

const apiRoutes = app.basePath("/api")
    .route("/students", studentsRoute)
    .route("/modules", modulesRoute)
    .route("/cycles", cyclesRoute)
    .route("/records", recordsRoute)
    .route("/enrollments", enrollmentsRoute);
/* 
apiRoutes.route("/calificaciones", calificacionesRoute);
apiRoutes.route("/certificados", certificadosRoute);
apiRoutes.route("/firmantes", firmantesRoute);
apiRoutes.route("/modulos", modulosRoute);
apiRoutes.route("/regulaciones", regulacionesRoute);
*/


// ----------------------------------------------------------------------------------------------------
// permitimos que el backend sirva archivos estáticos para la producción
app.get('*', serveStatic({ root: './frontend/dist' }))
app.get('*', serveStatic({ path: './frontend/dist/index.html' }))

export default app
export type ApiRoutes = typeof apiRoutes;