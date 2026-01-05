
import React from 'react';
import { Calendar, MapPin, ChevronDown } from 'lucide-react';

const DataPanel: React.FC = () => {
  return (
    <div className="w-80 h-[calc(100vh-3.5rem)] bg-white border-l border-gray-100 overflow-y-auto p-6 flex flex-col gap-8 custom-scrollbar">
      {/* Selector Section */}
      <section>
        <h3 className="text-gray-800 font-bold text-lg mb-4">养殖数据</h3>
        <div className="relative group">
          <select className="w-full appearance-none bg-[#F9FAFB] border border-gray-200 rounded-xl px-5 py-3.5 text-[15px] text-gray-700 outline-none focus:ring-4 focus:ring-teal-50 transition-all cursor-pointer font-medium">
            <option>四号</option>
            <option>三号</option>
            <option>二号</option>
          </select>
          <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </section>

      {/* Overview Section */}
      <section>
        <h4 className="text-gray-400 text-[13px] font-bold mb-4 uppercase tracking-widest">养殖概况</h4>
        <div className="space-y-px bg-gray-100 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
          {[
            { label: '养殖面积', value: '7' },
            { label: '养殖种类', value: 'shrimp' },
            { label: '养殖数量', value: '3576' }
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-center px-6 py-4.5 bg-white transition-colors hover:bg-gray-50/80">
              <span className="text-gray-500 font-medium">{item.label}</span>
              <span className="text-gray-900 font-bold text-lg">{item.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Environment Section */}
      <section>
        <h4 className="text-gray-400 text-[13px] font-bold mb-4 uppercase tracking-widest">环境数据</h4>
        <div className="space-y-px bg-gray-100 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center px-6 py-4.5 bg-white transition-colors hover:bg-gray-50/80">
            <span className="text-gray-500 font-medium">气温</span>
            <span className="text-gray-900 font-bold text-lg">16.4</span>
          </div>
          <div className="flex justify-between items-center px-6 py-4.5 bg-white transition-colors hover:bg-gray-50/80">
            <span className="text-gray-500 font-medium">天气</span>
            <span className="text-gray-900 font-bold text-lg">sunny</span>
          </div>
          <div className="flex flex-col gap-1 px-6 py-4.5 bg-white transition-colors hover:bg-gray-50/80 border-b border-gray-50">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">时间</span>
              <div className="flex items-center gap-2 text-gray-900 font-medium">
                <span className="text-xs font-mono">2026-01-05 11:59:34</span>
                <Calendar size={14} className="text-teal-400" />
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center px-6 py-4.5 bg-white transition-colors hover:bg-gray-50/80">
            <span className="text-gray-500 font-medium">地点</span>
            <div className="flex items-center gap-2 text-gray-900 font-bold">
              <span>つくば</span>
              <MapPin size={16} className="text-teal-400" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DataPanel;
