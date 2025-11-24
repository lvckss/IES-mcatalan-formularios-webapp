import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { MenuIcon } from '@/components/icons/index';
import { signOut } from "@/lib/auth-client";
import { useNavigate } from "@tanstack/react-router";

import logo from '@/assets/ies-mcatalan-logo.png';

interface HeaderProps {
  activeTab: string;
}

const Header: React.FC<HeaderProps> = ({ activeTab }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(); // llama al endpoint /api/auth/sign-out, borra la cookie de sesión
      navigate({ to: "/login", replace: true }); // redirige al login
    } catch (e) {
      console.error("Error cerrando sesión", e);
      // si quieres, aquí podrías meter un toast de error
    }
  };

  return (
    <header className="bg-background border-b border-border flex items-center justify-between px-4 py-3 md:px-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden">
          <MenuIcon className="h-5 w-5" />
          <span className="sr-only">Alternar menú</span>
        </Button>
        <h1 className="text-lg font-semibold">{activeTab}</h1>
      </div>
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full">
              <img
                src={logo}
                width={36}
                height={36}
                alt="Avatar"
                className="rounded-full blur-[1px] overflow-hidden"
                style={{ aspectRatio: "36/36", objectFit: "cover" }}
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Administrador</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;