import { type ReactNode, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useNavigate, useRouterState } from "@tanstack/react-router";

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });

  useEffect(() => {
    if (!isPending && !session) {
      navigate({
        to: "/login",
        search: {
          redirect: location.pathname,
        },
        replace: true,
      });
    }
  }, [isPending, session, navigate, location.pathname]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
        Comprobando sesión...
      </div>
    );
  }

  if (!session) {
    // Ya hemos lanzado la navegación a /login
    return null;
  }

  return <>{children}</>;
}
