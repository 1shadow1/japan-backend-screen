
import React from 'react';
import { User, Languages, Waves } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="h-14 bg-white border-b flex items-center justify-between px-4 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="bg-teal-500 p-1.5 rounded-lg text-white">
          <Waves size={20} />
        </div>
        <span className="text-teal-600 font-bold text-lg">Aquaculture Admin</span>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-gray-600 hover:text-teal-600 cursor-pointer transition-colors">
          <User size={18} />
          <span className="text-sm font-medium">henry</span>
        </div>
        <button className="text-gray-500 hover:text-teal-600 transition-colors">
          <Languages size={18} />
        </button>
      </div>
    </header>
  );
};

export default Header;
