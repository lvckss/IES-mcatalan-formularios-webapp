import React from 'react';
import { UsersIcon, FileIcon, AwardIcon, LayoutDashboardIcon, Package2Icon } from '@/components/icons/index';

interface SidebarProps {
  setActiveTab: (tab: 'Estudiantes' | 'Certificados') => void;
  activeTab: 'Estudiantes' | 'Certificados';
}

const Sidebar: React.FC<SidebarProps> = ({ setActiveTab, activeTab }) => {
  return (
    <aside className="bg-background border-r border-border p-4 hidden md:flex flex-col gap-4 text-s">
      <a href="#" className="flex items-center gap-2">
        <Package2Icon className="h-6 w-6" />
        <span className="font-semibold">Gestor de Certificados</span>
      </a>
      <nav className="flex flex-col gap-1">
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
          className={`flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground  ${activeTab === 'Certificados' ? 'bg-muted' : ''}`}
          onClick={() => setActiveTab('Certificados')}
        >
          <FileIcon className={`h-4 w-4 ${activeTab === 'Certificados' ? 'text-foreground' : ''}`} />
          <span className={`${activeTab === 'Certificados' ? 'text-foreground font-semibold' : ''}`}>Certificados</span>
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
      </nav>
    </aside>
  );
};

export default Sidebar;
