// server/scripts/create-admin.ts
import { auth } from "../auth";

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "Admin";

  if (!email || !password) {
    console.error(
      "❌ ADMIN_EMAIL o ADMIN_PASSWORD no están definidos en server/.env"
    );
    process.exit(1);
  }

  try {
    const res = await auth.api.createUser({
      body: {
        email,
        password,
        name,
        // Esto va a tu columna/campo extra "role" (additionalFields.role)
        data: {
          role: "admin",
        },
      },
    });

    console.log("✅ Usuario admin creado:");
    console.log("  id:", res.user.id);
    console.log("  email:", res.user.email);
  } catch (err: any) {
    const msg = err?.message ?? String(err);

    // Intentamos ser "idempotentes": si ya existe, no rompemos el script
    if (/already exists/i.test(msg) || /duplicate key/i.test(msg)) {
      console.log("ℹ️  El usuario admin ya existe, no se crea de nuevo.");
      return;
    }

    console.error("❌ Error creando el usuario admin:");
    console.error(err);
    process.exit(1);
  }
}

main();