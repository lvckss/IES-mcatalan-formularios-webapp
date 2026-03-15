import { Hono } from "hono";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const settingsRoute = new Hono();

const STORAGE_ROOT = path.resolve(process.cwd(), "storage");
const UPLOADS_DIR = path.join(STORAGE_ROOT, "uploads");
const CERTIFICATE_LOGO_FILENAME = "logo-certificado.png";

settingsRoute.post("/logo-certificado", async (c) => {
  const body = await c.req.parseBody();
  const logo = body["logo"];

  if (!(logo instanceof File)) {
    return c.text("No se recibió ningún archivo en el campo 'logo'", 400);
  }

  if (logo.type !== "image/png") {
    return c.text("Solo se permiten archivos PNG", 400);
  }

  await mkdir(UPLOADS_DIR, { recursive: true });

  const outputPath = path.join(UPLOADS_DIR, CERTIFICATE_LOGO_FILENAME);

  // Bun.write acepta File/Blob directamente
  await Bun.write(outputPath, logo);

  return c.json({
    ok: true,
    url: "/uploads/logo-certificado.png",
    updatedAt: Date.now(),
  });
});

export { settingsRoute };