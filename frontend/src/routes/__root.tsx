// frontend/src/routes/__root.tsx
import { createRootRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'

import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from "@/components/theme-provider";
import SidebarAvatar from '@/components/sidebar-avatar';

import { UsersIcon, FileIcon, Package2Icon } from '@/components/icons/index';
import logo from '@/assets/ies-mcatalan-logo.png';

import { useSession } from '@/lib/auth-client';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const { data: session, isPending } = useSession();
  const location = useRouterState({ select: (s) => s.location });

  const isLoginRoute = location.pathname === '/login';

  // mostrar layout “grande” solo si:
  //  - tenemos sesión
  //  - y NO estamos en /login
  const showAppLayout = !!session && !isLoginRoute;

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      {showAppLayout ? (
        // ===== LAYOUT CON SIDEBAR (ya logueado) =====
        <div className="grid min-h-screen w-full overflow-x-clip grid-cols-1 md:grid-cols-[16rem_minmax(0,1fr)]">
          {/* SIDEBAR */}
          <aside className="hidden md:block border-r border-r-gray-300">
            <a href="#" className="flex items-center gap-2 p-4">
              <Package2Icon className="h-6 w-6" />
              <span className="font-semibold">Gestor de Certificados</span>
            </a>

            <nav className="flex h-[calc(100vh-64px)] flex-col overflow-hidden">
              <div className="flex-1 flex flex-col gap-1">
                <Link
                  to="/estudiantes"
                  className="[&.active]:font-bold [&.active]:text-black flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <UsersIcon className="h-4 w-4" />
                  Estudiantes
                </Link>
                <Link
                  to="/introducir-acta"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground [&.active]:font-bold [&.active]:text-black"
                >
                  <FileIcon className="h-4 w-4" />
                  Introducir por acta
                </Link>
              </div>

              <div className="mt-auto relative z-10 top-40">
                <SidebarAvatar />
              </div>

              <div className="relative p-4">
                <div className="relative w-full h-60">
                  <img
                    src={logo}
                    alt="IES M Catalán Logo"
                    draggable="false"
                    className="absolute inset-0 transform scale-150 rotate-12 w-full h-full object-cover opacity-30 blur-[1px]"
                  />
                </div>
              </div>
            </nav>
          </aside>

          {/* CONTENT */}
          <div className="min-w-0 overflow-x-clip">
            <Outlet />
          </div>

          <Toaster />
        </div>
      ) : (
        // ===== LAYOUT SIMPLE (login, sin sesión) =====
        <div className="min-h-screen w-full">
          <Outlet />
          <Toaster />
        </div>
      )}
    </ThemeProvider>
  );
}