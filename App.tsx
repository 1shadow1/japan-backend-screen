
import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import DataPanel from './components/DataPanel';
import DeviceManagement from './components/DeviceManagement';
import TaskManagement from './components/TaskManagement';
import { SidebarTab, Message } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('ai');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('data');
  const [messages, setMessages] = useState<Message[]>([]);

  const renderContent = () => {
    switch(activeTab) {
      case 'ai':
        return (
          <>
            <ChatArea 
              activeSidebarTab={sidebarTab} 
              setActiveSidebarTab={setSidebarTab} 
              messages={messages}
              setMessages={setMessages}
            />
            <DataPanel 
              activeTab={sidebarTab} 
              setActiveTab={setSidebarTab}
              setMessages={setMessages}
            />
          </>
        );
      case 'ai-dashboard':
        return (
          <div className="flex-1 w-full h-full bg-white overflow-hidden">
            <iframe 
              src="https://shrimp.cognitive-center.asia/" 
              className="w-full h-full border-none"
              title="Digital Dashboard"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      case 'device-manage':
        return <DeviceManagement />;
      case 'device-monitor':
        return (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-2xl">📹</span>
            </div>
            <p className="text-lg font-medium">远程视频监控正在初始化...</p>
          </div>
        );
      case 'task-manage':
        return <TaskManagement />;
      default:
        return (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-lg animate-pulse">
            模块开发中...
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f9fafb]">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />
        
        <main className="flex-1 flex overflow-hidden">
          {renderContent()}
        </main>
      </div>
      
      {/* Footer Info */}
      <div className="h-6 bg-transparent flex items-center justify-center px-4 fixed bottom-0 left-0 right-0 z-0 pointer-events-none">
        <span className="text-[10px] text-gray-400 font-mono">
          build: 45a8a6d-1766127792
        </span>
      </div>
    </div>
  );
};

export default App;
