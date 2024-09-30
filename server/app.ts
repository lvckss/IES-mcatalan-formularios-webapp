import { serveStatic } from 'hono/bun'
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { studentsRoute } from './routes/studentsRoute';
import { calificacionesRoute } from './routes/calificacionesRoute';
import { certificadosRoute } from './routes/certificadoRoute';
import { ciclosFormativosRoute } from './routes/ciclosFormativosRoute';
import { firmantesRoute } from './routes/firmantesRoute';
import { modulosRoute } from './routes/modulosRoute';
import { regulacionesRoute } from './routes/regulacionesRoute';
import { api } from '../frontend/src/lib/api';

const app = new Hono();

app.use(logger());

app.get("/health", c => {
    return c.json({ "message": "más sanito que una manzana" });
});

const apiRoutes = app.basePath("/api")
    .route("/students", studentsRoute)
    .route("/modulos", modulosRoute)

/* 
apiRoutes.route("/calificaciones", calificacionesRoute);
apiRoutes.route("/certificados", certificadosRoute);
apiRoutes.route("/ciclosFormativos", ciclosFormativosRoute);
apiRoutes.route("/firmantes", firmantesRoute);
apiRoutes.route("/modulos", modulosRoute);
apiRoutes.route("/regulaciones", regulacionesRoute);
*/

// permitimos que el backend sirva archivos estáticos para la producción
app.get('*', serveStatic({ root: './frontend/dist' }))
app.get('*', serveStatic({ path: './frontend/dist/index.html' }))

export default app
export type ApiRoutes = typeof apiRoutes;