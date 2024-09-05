import { useState } from 'react';

import Sidebar from "./components/Sidebar"
import Header from "./components/Header"
import Estudiantes from "./components/Students"
import Certificados from "./components/Certificates"
import { ThemeProvider } from "@/components/theme-provider"

function App() {

  const [activeTab, setActiveTab] = useState<'Estudiantes' | 'Certificados'>('Estudiantes');

  const renderContent = () => {
    switch (activeTab) {
      case 'Estudiantes':
        return <Estudiantes />;
      case 'Certificados':
        return <Certificados />;
      default:
        return <Estudiantes />;
    }
  };

  return (
    <ThemeProvider defaultTheme='light' storageKey='vite-ui-theme'>
      <div className="flex min-h-screen w-full">
      <Sidebar setActiveTab={setActiveTab} activeTab={activeTab}/>
      <div className="flex flex-1 flex-col">
        <Header activeTab={activeTab as 'students' | 'certificates'} />
        {renderContent()}
      </div>
    </div>
    </ThemeProvider>
  );
}

export default App
