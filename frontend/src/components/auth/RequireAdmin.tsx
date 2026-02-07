// frontend/src/components/auth/RequireAdmin.tsx
import { type ReactNode, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useNavigate, useRouterState } from "@tanstack/react-router";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });

  const role = (session?.user as any)?.role ?? (session?.user as any)?.data?.role;

  useEffect(() => {
    if (!isPending && !session) {
      navigate({ to: "/login", search: { redirect: location.pathname }, replace: true });
    } else if (!isPending && session && role !== "admin") {
      navigate({ to: "/", replace: true });
    }
  }, [isPending, session, role, navigate, location.pathname]);

  if (isPending) return <div className="p-8 text-sm text-muted-foreground">Comprobando sesión...</div>;
  if (!session) return null;
  if (role !== "admin") return null;

  return <>{children}</>;
}