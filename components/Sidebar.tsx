
import React, { useState } from 'react';
import { Bot, BarChart3, Settings, ClipboardList, ChevronDown, ChevronLeft, MonitorPlay, Laptop, LayoutDashboard, MessageSquare, ChevronRight, ListTodo } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }) => {
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['ai', 'device', 'task']);

  const toggleExpand = (id: string) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setExpandedMenus([id]);
      return;
    }
    setExpandedMenus(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const menuItems = [
    { 
      id: 'ai', 
      icon: Bot, 
      label: 'AI 中心', 
      hasSub: true,
      subItems: [
        { id: 'ai', icon: MessageSquare, label: '智能问答' },
        { id: 'ai-dashboard', icon: LayoutDashboard, label: '数字大屏' },
      ]
    },
    { id: 'data', icon: BarChart3, label: '数据中心', hasSub: true },
    { 
      id: 'device', 
      icon: Settings, 
      label: '设备中心', 
      hasSub: true,
      subItems: [
        { id: 'device-manage', icon: Laptop, label: '设备管理' },
        { id: 'device-monitor', icon: MonitorPlay, label: '远程监控' },
      ]
    },
    { 
      id: 'task', 
      icon: ClipboardList, 
      label: '任务中心',
      hasSub: true,
      subItems: [
        { id: 'task-manage', icon: ListTodo, label: '任务管理' }
      ]
    },
  ];

  const isMainActive = (id: string) => {
    if (activeTab === id) return true;
    const item = menuItems.find(i => i.id === id);
    return item?.subItems?.some(sub => sub.id === activeTab);
  };

  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-64'} bg-[#19D4AE] h-[calc(100vh-3.5rem)] flex flex-col transition-all duration-300 relative shadow-inner overflow-y-auto overflow-x-hidden custom-scrollbar`}>
      <div className="py-6 space-y-1.5 mt-2">
        {menuItems.map((item) => (
          <div key={item.id} className="w-full">
            <button
              onClick={() => {
                if (item.hasSub) {
                  toggleExpand(item.id);
                } else {
                  setActiveTab(item.id);
                }
              }}
              title={isCollapsed ? item.label : ''}
              className={`flex items-center justify-between rounded-2xl text-white transition-all duration-200 group ${
                isCollapsed ? 'w-12 h-12 mx-auto px-0 justify-center' : 'w-[90%] mx-auto px-5 py-3.5'
              } ${
                isMainActive(item.id) && !item.hasSub
                  ? 'bg-[#15B898] shadow-md shadow-[#15B898]/20' 
                  : 'hover:bg-white/10 opacity-90 hover:opacity-100'
              }`}
            >
              <div className={`flex items-center gap-4 ${isCollapsed ? 'justify-center w-full' : ''}`}>
                <item.icon size={22} className={isMainActive(item.id) ? 'opacity-100' : 'opacity-80'} />
                {!isCollapsed && (
                  <span className={`text-[16px] font-medium tracking-wide whitespace-nowrap ${isMainActive(item.id) ? 'font-bold' : ''}`}>
                    {item.label}
                  </span>
                )}
              </div>
              {!isCollapsed && item.hasSub && (
                <ChevronDown 
                  size={14} 
                  className={`transition-transform duration-300 ${expandedMenus.includes(item.id) ? 'rotate-180' : 'rotate-0 opacity-40'}`} 
                />
              )}
            </button>

            {/* Sub Items */}
            {!isCollapsed && item.hasSub && expandedMenus.includes(item.id) && item.subItems && (
              <div className="mt-1 space-y-1">
                {item.subItems.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setActiveTab(sub.id)}
                    className={`w-[80%] ml-auto mr-[5%] flex items-center gap-3 px-5 py-2.5 rounded-xl text-white transition-all ${
                      activeTab === sub.id 
                        ? 'bg-white/20 font-bold' 
                        : 'opacity-70 hover:opacity-100 hover:bg-white/5'
                    }`}
                  >
                    <sub.icon size={16} />
                    <span className="text-[14px] whitespace-nowrap">{sub.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Collapse Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 bg-teal-300 rounded-full p-1 text-white border-2 border-white shadow-lg hover:bg-teal-400 transition-all z-20 cursor-pointer"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </div>
  );
};

export default Sidebar;
