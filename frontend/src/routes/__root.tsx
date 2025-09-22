import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from "@/components/theme-provider";

import { UsersIcon, FileIcon, AwardIcon, LayoutDashboardIcon, Package2Icon } from '@/components/icons/index';
import logo from '@/assets/ies-mcatalan-logo.png';

export const Route = createRootRoute({
    component: () => (
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
            {/* Grid de 2 columnas en md+, una sola columna en móvil */}
            <div className="grid min-h-screen w-full overflow-x-clip grid-cols-1 md:grid-cols-[16rem_minmax(0,1fr)]">
                {/* SIDEBAR */}
                <aside className="hidden md:block border-r border-r-gray-300">
                    <a href="#" className="flex items-center gap-2 p-4">
                        <Package2Icon className="h-6 w-6" />
                        <span className="font-semibold">Gestor de Certificados</span>
                    </a>

                    {/* El nav puede seguir en flex */}
                    <nav className="flex flex-col gap-1 h-[calc(100vh-64px)] overflow-hidden">
                        <Link to="/estudiantes" className="[&.active]:font-bold [&.active]:text-black flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                            <UsersIcon className="h-4 w-4" />
                            Estudiantes
                        </Link>
                        <Link to="/introducir-acta" className="flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground [&.active]:font-bold [&.active]:text-black">
                            <FileIcon className="h-4 w-4" />
                            Introducir por acta
                        </Link>

                        {/* CLIP al logo transformado */}
                        <div className="relative p-4 mt-auto">
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

                {/* CONTENT: minmax(0,1fr) ya permite encoger; añade min-w-0 por seguridad */}
                <div className="min-w-0 overflow-x-clip">
                    <Outlet />
                </div>

                <Toaster />
            </div>
        </ThemeProvider>
    ),
})
