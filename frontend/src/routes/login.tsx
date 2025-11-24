import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useSession, signIn } from "@/lib/auth-client"; // 👈 quitamos signUp
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";

const LoginSearchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: (search) => LoginSearchSchema.parse(search),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate({ from: "/login" });
  const { redirect } = Route.useSearch();
  const { data: session, isPending } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Si ya hay sesión, no tiene sentido estar en /login
  useEffect(() => {
    if (!isPending && session) {
      navigate({
        to: redirect ?? "/estudiantes",
        replace: true,
      });
    }
  }, [isPending, session, redirect, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const { error } = await signIn.email({
        email,
        password,
        // opcional: callbackURL si quieres que lo gestione Better Auth
        // callbackURL: redirect ?? "/estudiantes",
      });

      if (error) {
        throw new Error(error.message);
      }

      // Navegamos nosotros después de login correcto
      navigate({
        to: redirect ?? "/estudiantes",
        replace: true,
      });
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Error al autenticar.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isPending && !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Cargando sesión...
      </div>
    );
  }

  return (
    <main className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold mb-2 text-center">
          Gestor de Estudiantado/Certificados<br></br>para FORMACCIONA
        </h1>
        <p className="text-sm text-muted-foreground mb-6 text-center">
          Inicia sesión para acceder a la plataforma
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 border border-red-200 rounded-md px-3 py-2 bg-red-50">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={submitting || !email || !password}
          >
            {submitting ? "Entrando..." : "Iniciar sesión"}
          </Button>
        </form>

        {/* Si quieres, puedes poner aquí un mini texto tipo:
            "Si no tienes cuenta, habla con Jefatura" */}
        <div className="mt-4 text-xs text-center text-muted-foreground">
          Si no tienes cuenta, contacta con administración.
        </div>
      </div>
    </main>
  );
}