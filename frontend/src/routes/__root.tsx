import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import { UsersIcon, FileIcon, AwardIcon, LayoutDashboardIcon, Package2Icon } from '@/components/icons/index';
import logo from '@/assets/ies-mcatalan-logo.png';

export const Route = createRootRoute({
    component: () => (
        <div className="flex min-h-screen w-full">
            {/* SIDEBAR */}
            <aside className="bg-background border-r border-border hidden md:flex flex-col text-s h-screen w-64">
                <a href="#" className="flex items-center gap-2 p-4 ">
                    <Package2Icon className="h-6 w-6" />
                    <span className="font-semibold">Gestor de Certificados</span>
                </a>
                <nav className="flex flex-col gap-1 flex-grow overflow-hidden">
                    <Link to="/estudiantes" className="[&.active]:font-bold [&.active]:text-black flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                        <UsersIcon className={`h-4 w-4 `} />
                        Estudiantes
                    </Link>
                    <Link to="/introducir-acta" className="flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground [&.active]:font-bold [&.active]:text-black">
                        <FileIcon className={`h-4 w-4`} />
                        Introducir por acta
                    </Link>
                    <a
                        href="#"
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                        <AwardIcon className="h-4 w-4" />
                        <span>Emisión</span>
                    </a>
                    <a
                        href="#"
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                        <LayoutDashboardIcon className="h-4 w-4" />
                        <span>Administración</span>
                    </a>
                    <div className="relative p-4 flex-shrink-0 mt-auto">
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
            <div className="flex flex-1 flex-col">
                <Outlet />
            </div>
            {/* <TanStackRouterDevtools /> */}
        </div>
    ),
})