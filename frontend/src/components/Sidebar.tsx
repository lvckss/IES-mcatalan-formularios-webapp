import React from 'react';
import { UsersIcon, FileIcon, AwardIcon, LayoutDashboardIcon, Package2Icon } from '@/components/icons/index';
import logo from '@/assets/ies-mcatalan-logo.png';

interface SidebarProps {
  setActiveTab: (tab: 'Estudiantes' | 'Introducir por acta') => void;
  activeTab: 'Estudiantes' | 'Introducir por acta';
}

const Sidebar: React.FC<SidebarProps> = ({ setActiveTab, activeTab }) => {
  return (
    <aside className="bg-background border-r border-border hidden md:flex flex-col text-s h-screen w-64">
      <a href="#" className="flex items-center gap-2 p-4 ">
        <Package2Icon className="h-6 w-6" />
        <span className="font-semibold">Gestor de Certificados</span>
      </a>
      <nav className="flex flex-col gap-1 flex-grow overflow-hidden">
        <a
          href="#"
          className={`flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground ${activeTab === 'Estudiantes' ? 'bg-muted' : ''}`}
          onClick={() => setActiveTab('Estudiantes')}
        >
          <UsersIcon className={`h-4 w-4 ${activeTab === 'Estudiantes' ? 'text-foreground' : ''}`} />
          <span className={activeTab === 'Estudiantes' ? 'text-foreground font-semibold' : ''}>Estudiantes</span>
        </a>
        <a
          href="#"
          className={`flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground  ${activeTab === 'Introducir por acta' ? 'bg-muted' : ''}`}
          onClick={() => setActiveTab('Introducir por acta')}
        >
          <FileIcon className={`h-4 w-4 ${activeTab === 'Introducir por acta' ? 'text-foreground' : ''}`} />
          <span className={`${activeTab === 'Introducir por acta' ? 'text-foreground font-semibold' : ''}`}>Introducir por acta</span>
        </a>
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
  );
};

export default Sidebar;


