import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { alumnosRoute } from './routes/alumnosRoute';
import { calificacionesRoute } from './routes/calificacionesRoute';
import { certificadosRoute } from './routes/certificadoRoute';
import { ciclosFormativosRoute } from './routes/ciclosFormativosRoute';
import { firmantesRoute } from './routes/firmantesRoute';
import { modulosRoute } from './routes/modulosRoute';
import { regulacionesRoute } from './routes/regulacionesRoute';

const app = new Hono();

app.use(logger());

app.get("/health", c => {
    return c.json({"message": "más sanito que una manzana"});
});

const apiRoutes = app.basePath("/api");

apiRoutes.route("/alumnos", alumnosRoute);
apiRoutes.route("/calificaciones", calificacionesRoute);
apiRoutes.route("/certificados", certificadosRoute);
apiRoutes.route("/ciclosFormativos", ciclosFormativosRoute);
apiRoutes.route("/firmantes", firmantesRoute);
apiRoutes.route("/modulos", modulosRoute);
apiRoutes.route("/regulaciones", regulacionesRoute);

export default app
export type ApiRoutes = typeof apiRoutes;