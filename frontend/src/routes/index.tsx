import { createFileRoute } from '@tanstack/react-router';

import { useState } from 'react';

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Estudiantes from "@/components/StudentTable/Students";
import IntroduceActa from "@/components/IntroduceActa";
import { ThemeProvider } from "@/components/theme-provider";

import { Toaster } from '@/components/ui/sonner';

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {

  const [activeTab, setActiveTab] = useState<'Estudiantes' | 'Introducir por acta'>('Estudiantes');

  const renderContent = () => {
    switch (activeTab) {
      case 'Estudiantes':
        return <Estudiantes />;
      case 'Introducir por acta':
        return <IntroduceActa />;
      default:
        return <Estudiantes />;
    }
  };

  return (
    <ThemeProvider defaultTheme='light' storageKey='vite-ui-theme'>
      <div className="flex min-h-screen w-full">
        <Sidebar setActiveTab={setActiveTab} activeTab={activeTab} />
        <div className="flex flex-1 flex-col">
          <Header activeTab={activeTab as 'students' | 'certificates'} />
          {renderContent()}
        </div>
      </div>
      <Toaster />
    </ThemeProvider>
  );
}
