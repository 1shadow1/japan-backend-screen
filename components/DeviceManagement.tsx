
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Search, MoreHorizontal, Edit2, Trash2, RefreshCw, Camera, Wind, Zap, Filter, ChevronDown, ShieldCheck, User, Bot, Layers, X, Info, MapPin, Sparkles, Activity, CheckCircle2, AlertCircle, Loader2, Eye, History, Cpu, AlertTriangle } from 'lucide-react';
import { Device, DeviceType, DeviceStatus, ExecutionPermission } from '../types';
import { getGeminiStreamingResponse } from '../services/geminiService';

const INITIAL_DEVICES: Device[] = [
  { 
    id: 'D-1001', name: '智能投喂机-A', type: 'feeder', status: 'online', pond: '四号池', executionPermission: 'manual_ai', lastActive: '2024-05-20 14:30',
    metadata: { battery: 85, signal: 'strong', firmware: 'v2.1.0' }
  },
  { 
    id: 'D-2003', name: '主池增氧泵', type: 'aerator', status: 'online', pond: '一号池', executionPermission: 'ai_only', lastActive: '2024-05-20 15:10',
    metadata: { signal: 'medium', firmware: 'v1.4.5' }
  },
  { 
    id: 'C-5001', name: '全景摄像头-北', type: 'camera', status: 'offline', pond: '三号池', executionPermission: 'manual_only', lastActive: '2024-05-19 09:22',
    metadata: { signal: 'weak', firmware: 'v3.0.2' }
  },
  { 
    id: 'D-2004', name: '二号池增氧泵', type: 'aerator', status: 'online', pond: '二号池', executionPermission: 'manual_ai', lastActive: '2024-05-20 15:45',
    metadata: { signal: 'strong', firmware: 'v1.4.5' }
  },
];

const DeviceManagement: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>(INITIAL_DEVICES);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPond, setFilterPond] = useState<string>('all');
  const [filterPermission, setFilterPermission] = useState<string>('all');
  
  // Modal & Detail States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeDevice, setActiveDevice] = useState<Device | null>(null);
  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'feeder' as DeviceType,
    pond: '',
    executionPermission: 'manual_ai' as ExecutionPermission,
    location: '',
    description: ''
  });

  // AI & Testing States
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testLog, setTestLog] = useState<string[]>([]);
  const analysisEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (analysisEndRef.current) {
      analysisEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiAnalysis, testLog]);

  const ponds = useMemo(() => Array.from(new Set(devices.map(d => d.pond))), [devices]);

  const filteredDevices = devices.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
    const matchesPond = filterPond === 'all' || d.pond === filterPond;
    const matchesPermission = filterPermission === 'all' || d.executionPermission === filterPermission;
    return matchesSearch && matchesStatus && matchesPond && matchesPermission;
  });

  const getIcon = (type: DeviceType) => {
    switch(type) {
      case 'feeder': return <Zap className="text-orange-500" size={18} />;
      case 'aerator': return <Wind className="text-blue-500" size={18} />;
      case 'camera': return <Camera className="text-purple-500" size={18} />;
    }
  };

  const getStatusBadge = (status: DeviceStatus) => {
    const isOnline = status === 'online';
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
        isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
      }`}>
        <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
        {isOnline ? '在线' : '离线'}
      </div>
    );
  };

  const getPermissionBadge = (permission: ExecutionPermission) => {
    switch(permission) {
      case 'manual_only': 
        return <div className="inline-flex items-center gap-1.5 text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg text-xs font-bold border border-orange-100"><User size={12}/> 仅人工</div>;
      case 'manual_ai': 
        return <div className="inline-flex items-center gap-1.5 text-teal-600 bg-teal-50 px-2.5 py-1 rounded-lg text-xs font-bold border border-teal-100"><ShieldCheck size={12}/> 人工/AI</div>;
      case 'ai_only': 
        return <div className="inline-flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg text-xs font-bold border border-blue-100"><Bot size={12}/> 仅AI</div>;
    }
  };

  // Actions
  const openAddModal = () => {
    setActiveDevice(null);
    setFormData({
      name: '',
      type: 'feeder',
      pond: '',
      executionPermission: 'manual_ai',
      location: '',
      description: ''
    });
    setAiAnalysis('');
    setTestStatus('idle');
    setTestLog([]);
    setIsModalOpen(true);
  };

  const openEditModal = (device: Device) => {
    setActiveDevice(device);
    setFormData({
      name: device.name,
      type: device.type,
      pond: device.pond,
      executionPermission: device.executionPermission,
      location: '安装于池位核心区', 
      description: '常规养殖作业设备，性能稳定。'
    });
    setAiAnalysis('');
    setTestStatus('idle');
    setTestLog([]);
    setIsModalOpen(true);
  };

  const openDetailView = (device: Device) => {
    setActiveDevice(device);
    setIsDetailOpen(true);
  };

  const openDeleteConfirmation = (device: Device) => {
    setDeviceToDelete(device);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (deviceToDelete) {
      setDevices(prev => prev.filter(d => d.id !== deviceToDelete.id));
      setIsDeleteModalOpen(false);
      setDeviceToDelete(null);
    }
  };

  const handleAiLearn = async () => {
    if (!formData.description.trim()) {
      alert('请先输入设备描述以供 AI 学习');
      return;
    }
    setIsAiLoading(true);
    setAiAnalysis('');
    const prompt = `分析养殖设备: 名称:${formData.name}, 描述:${formData.description}. 请推理设备用途、控制方式及AI介入逻辑。`;
    try {
      const stream = getGeminiStreamingResponse(prompt);
      for await (const chunk of stream) {
        setAiAnalysis(prev => prev + chunk);
      }
    } catch (error) {
      setAiAnalysis('AI 学习过程中发生错误。');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleConnectTest = async () => {
    setTestStatus('testing');
    setTestLog(['正在接入 IoT 控制中枢...', '正在请求设备序列号授权...', '链路检测中...']);
    await new Promise(res => setTimeout(res, 2000));
    setTestStatus('success');
    setTestLog(prev => [...prev, '连接握手成功', '反馈延迟: 24ms', '状态: READY']);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeDevice) {
      setDevices(prev => prev.map(d => d.id === activeDevice.id ? {
        ...d,
        name: formData.name,
        type: formData.type,
        pond: formData.pond,
        executionPermission: formData.executionPermission
      } : d));
    } else {
      const idPrefix = formData.type === 'camera' ? 'C' : 'D';
      const newDev: Device = {
        id: `${idPrefix}-${Math.floor(1000 + Math.random() * 9000)}`,
        name: formData.name,
        type: formData.type,
        status: 'online',
        pond: formData.pond,
        executionPermission: formData.executionPermission,
        lastActive: new Date().toISOString().slice(0, 16).replace('T', ' '),
        metadata: { firmware: 'v1.0.0', signal: 'strong' }
      };
      setDevices(prev => [newDev, ...prev]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-[#f9fafb] relative">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">设备管理</h1>
            <p className="text-gray-400 text-sm mt-1">管理和查看所有联网养殖设备的实时状态</p>
          </div>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 bg-teal-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-teal-600 shadow-lg shadow-teal-500/20 transition-all active:scale-95"
          >
            <Plus size={20} />
            <span>添加新设备</span>
          </button>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1"><Filter size={12}/> 状态</span>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-sm text-gray-900 outline-none">
                <option value="all">全部</option>
                <option value="online">在线</option>
                <option value="offline">离线</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1"><Layers size={12}/> 养殖池</span>
              <select value={filterPond} onChange={(e) => setFilterPond(e.target.value)} className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-sm text-gray-900 outline-none">
                <option value="all">全部池位</option>
                {ponds.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-gray-50">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="搜索设备名称或ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-11 pr-4 py-3 text-sm text-gray-900 outline-none font-medium" />
            </div>
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-600 rounded-xl text-sm font-bold border border-gray-100 shadow-sm">
              <RefreshCw size={16} /> 刷新列表
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-12">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">设备信息</th>
                <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">状态</th>
                <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">养殖池</th>
                <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredDevices.map((device) => (
                <tr key={device.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:bg-white transition-all shadow-sm">
                        {getIcon(device.type)}
                      </div>
                      <div>
                        <div className="text-[15px] font-bold text-gray-800">{device.name}</div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">{device.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">{getStatusBadge(device.status)}</td>
                  <td className="px-6 py-6 font-medium text-sm text-gray-600">{device.pond}</td>
                  <td className="px-6 py-6 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => openDetailView(device)} className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl" title="查看详情">
                        <Eye size={18} />
                      </button>
                      <button onClick={() => openEditModal(device)} className="p-2.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl" title="编辑信息">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => openDeleteConfirmation(device)} className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl" title="删除设备">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in zoom-in duration-200">
            <div className="px-8 py-6 border-b flex items-center justify-between bg-teal-50/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-500 rounded-xl text-white">
                  {activeDevice ? <Edit2 size={24} /> : <Plus size={24} />}
                </div>
                <h2 className="text-xl font-bold text-gray-800">{activeDevice ? '编辑设备' : '登记设备'}</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">设备名称</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-teal-500/5" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">设备类型</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as DeviceType})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none cursor-pointer appearance-none">
                    <option value="feeder">投喂机</option>
                    <option value="aerator">增氧泵</option>
                    <option value="camera">摄像头</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">养殖池</label>
                  <input required value={formData.pond} onChange={e => setFormData({...formData, pond: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">权限分配</label>
                  <select value={formData.executionPermission} onChange={e => setFormData({...formData, executionPermission: e.target.value as ExecutionPermission})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none">
                    <option value="manual_only">仅人工</option>
                    <option value="manual_ai">人工/AI</option>
                    <option value="ai_only">仅AI</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">设备描述</label>
                  <button type="button" onClick={handleAiLearn} disabled={isAiLoading} className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-lg hover:bg-teal-100 flex items-center gap-1">
                    <Sparkles size={12} /> AI 学习
                  </button>
                </div>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none resize-none" />
              </div>

              {/* Console for AI and Testing */}
              {(aiAnalysis || isAiLoading || testLog.length > 0) && (
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                  <div className="text-[10px] font-bold text-teal-400 uppercase">AI 控制中枢反馈</div>
                  <div className="text-[12px] text-teal-50 font-medium whitespace-pre-wrap max-h-32 overflow-y-auto">{aiAnalysis}</div>
                  {testLog.length > 0 && (
                    <div className="font-mono text-[11px] text-slate-400 border-t border-slate-800 pt-2 space-y-1">
                      {testLog.map((l, i) => <div key={i}>> {l}</div>)}
                      {testStatus === 'success' && <div className="text-emerald-400 font-bold">连接就绪</div>}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 font-bold text-gray-400">取消</button>
                <button type="button" onClick={handleConnectTest} disabled={testStatus === 'testing'} className="flex-1 py-3 font-bold text-teal-600 border border-teal-100 rounded-xl">
                  {testStatus === 'testing' ? '测试中...' : '连接测试'}
                </button>
                <button type="submit" className="flex-[1.5] py-3 font-bold text-white bg-teal-500 rounded-xl shadow-lg shadow-teal-500/20">保存信息</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && deviceToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl relative p-8 text-center space-y-6 animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">确认删除设备？</h3>
              <p className="text-sm text-gray-400 mt-2">此操作将永久移除 <span className="text-gray-900 font-bold">{deviceToDelete.name}</span>，且无法撤销。</p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-gray-400 hover:bg-gray-50 transition-all">取消</button>
              <button onClick={confirmDelete} className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all">确认删除</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailOpen && activeDevice && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsDetailOpen(false)} />
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl relative p-10 space-y-8 animate-in fade-in duration-300">
            <button onClick={() => setIsDetailOpen(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900"><X size={24} /></button>
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center text-3xl">{getIcon(activeDevice.type)}</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{activeDevice.name}</h2>
                <div className="flex gap-2 mt-1">{getStatusBadge(activeDevice.status)} {getPermissionBadge(activeDevice.executionPermission)}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-100">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">资产 ID</span>
                <div className="text-sm font-mono font-bold text-gray-700">{activeDevice.id}</div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">最后活跃</span>
                <div className="text-sm font-bold text-gray-700">{activeDevice.lastActive}</div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">养殖池位</span>
                <div className="text-sm font-bold text-gray-700">{activeDevice.pond}</div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">固件版本</span>
                <div className="text-sm font-bold text-gray-700">{activeDevice.metadata.firmware}</div>
              </div>
            </div>
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase">设备详情摘要</span>
              <div className="p-5 bg-teal-50/50 rounded-2xl border border-teal-100/50 text-sm text-gray-700 leading-relaxed">
                当前设备运行稳定，已接入 AI 智能决策网络。系统将根据水质动态自动调节运行频率，确保养殖环境处于最优状态。
              </div>
            </div>
            <button onClick={() => setIsDetailOpen(false)} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-xl">关闭窗口</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceManagement;
