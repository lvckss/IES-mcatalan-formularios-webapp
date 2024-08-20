import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { alumnosRoute } from './routes/alumnos';

const app = new Hono();

app.use(logger());

app.get("/test", c => {
    return c.json({"message": "test"});
});

const apiRoutes = app.basePath("/api").route("/alumnos", alumnosRoute)

export default app
export type ApiRoutes = typeof apiRoutes;