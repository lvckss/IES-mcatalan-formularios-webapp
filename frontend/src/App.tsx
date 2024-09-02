import { useState } from 'react';

import Sidebar from "./components/Sidebar"
import Header from "./components/Header"
import Estudiantes from "./components/Estudiantes"
import Certificados from "./components/Certificados"

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
    <div className="flex min-h-screen w-full">
      <Sidebar setActiveTab={setActiveTab} activeTab={activeTab}/>
      <div className="flex flex-1 flex-col">
        <Header activeTab={activeTab as 'students' | 'certificates'} />
        {renderContent()}
      </div>
    </div>
  );
}

export default App
