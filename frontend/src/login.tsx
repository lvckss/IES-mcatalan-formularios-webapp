// frontend/src/pages/Login.tsx
import { useState } from "react";
import { useSession, signIn, signUp } from "@/lib/auth-client";
import { toast } from "sonner";

export function LoginPage() {
  const { data: session, isPending } = useSession();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (isPending) return <div>Cargando sesión...</div>;

  if (session) {
    return (
      <div className="p-4">
        <p>Estás autenticado como {session.user.email}</p>
        <a href="/estudiantes" className="underline text-blue-600">
          Ir a estudiantes
        </a>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === "register") {
        const { error } = await signUp.email({
          email,
          password,
          name,
          callbackURL: "/estudiantes",
        });
        if (error) throw error;
      } else {
        const { error } = await signIn.email(
          { email, password },
          {
            onSuccess() {
              window.location.href = "/estudiantes";
            },
          }
        );
        if (error) throw error;
      }
    } catch (err: any) {
      toast(err?.message ?? "Error de autenticación");
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-10">
      <h1 className="text-xl font-semibold mb-4">
        {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === "register" && (
          <input
            type="text"
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border px-2 py-1 w-full"
          />
        )}
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border px-2 py-1 w-full"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border px-2 py-1 w-full"
        />

        <button type="submit" className="border px-2 py-1 w-full">
          {mode === "login" ? "Entrar" : "Registrarse"}
        </button>
      </form>

      <button
        className="mt-3 text-sm underline"
        onClick={() => setMode(mode === "login" ? "register" : "login")}
      >
        {mode === "login"
          ? "¿No tienes cuenta? Regístrate"
          : "¿Ya tienes cuenta? Inicia sesión"}
      </button>
    </div>
  );
}