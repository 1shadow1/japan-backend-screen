import React, { useState, useMemo } from 'react';
import { Plus, Search, MoreHorizontal, Edit2, Trash2, RefreshCw, Filter, Layers, X, Info, Sparkles, Activity, CheckCircle2, AlertCircle, Eye, Clock, User, ClipboardList, AlertTriangle, Loader2, Bot, PlayCircle, CheckCircle, CalendarDays } from 'lucide-react';
import { Task, TaskStatus, TaskPriority } from '../types';
import { getGeminiStreamingResponse } from '../services/geminiService';

const INITIAL_TASKS: Task[] = [
  { 
    id: 'T-801', name: '水质抽样检测', description: '对四号池进行例行水质抽样，检测氨氮与溶氧量。', 
    status: 'pending', priority: 'high', assignee: '张工', dueDate: '2024-05-21 10:00', pond: '四号池' 
  },
  { 
    id: 'T-802', name: '投喂机例行检查', description: '检查投喂机传动部件，清理残留饲料。', 
    status: 'in_progress', priority: 'medium', assignee: '李四', dueDate: '2024-05-20 16:30', pond: '一号池' 
  },
  { 
    id: 'T-803', name: '藻类清理', description: '清理二号池边缘过度生长的小球藻。', 
    status: 'completed', priority: 'low', assignee: '王五', dueDate: '2024-05-19 14:00', pond: '二号池' 
  },
];

const TaskManagement: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchAssignee, setSearchAssignee] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Execution status within modal
  const [executionStatus, setExecutionStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // AI Learning states
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'pending' as TaskStatus,
    priority: 'medium' as TaskPriority,
    assignee: '',
    dueDate: '',
    pond: ''
  });

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAssignee = t.assignee.toLowerCase().includes(searchAssignee.toLowerCase());
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
    return matchesSearch && matchesAssignee && matchesStatus && matchesPriority;
  });

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'pending': return <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600"><Clock size={12}/> 待处理</div>;
      case 'in_progress': return <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 animate-pulse"><Activity size={12}/> 进行中</div>;
      case 'completed': return <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600"><CheckCircle2 size={12}/> 已完成</div>;
      case 'cancelled': return <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-400"><X size={12}/> 已取消</div>;
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'high': return <span className="text-red-500 font-bold text-xs uppercase tracking-tighter">● 高</span>;
      case 'medium': return <span className="text-orange-400 font-bold text-xs uppercase tracking-tighter">● 中</span>;
      case 'low': return <span className="text-blue-400 font-bold text-xs uppercase tracking-tighter">● 低</span>;
    }
  };

  const openAddModal = () => {
    setActiveTask(null);
    setFormData({ name: '', description: '', status: 'pending', priority: 'medium', assignee: '', dueDate: '', pond: '' });
    setAiAnalysis('');
    setExecutionStatus('idle');
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setActiveTask(task);
    setFormData({ ...task });
    setAiAnalysis('');
    setExecutionStatus('idle');
    setIsModalOpen(true);
    setIsDetailOpen(false);
  };

  const openDetailModal = (task: Task) => {
    setActiveTask(task);
    setIsDetailOpen(true);
  };

  const saveTask = () => {
    let savedTask: Task;
    if (activeTask) {
      savedTask = { ...activeTask, ...formData };
      setTasks(prev => prev.map(t => t.id === activeTask.id ? savedTask : t));
    } else {
      const newId = `T-${Math.floor(800 + Math.random() * 200)}`;
      savedTask = { id: newId, ...formData };
      setTasks(prev => [savedTask, ...prev]);
      setActiveTask(savedTask); // Keep reference for execution
    }
    return savedTask;
  };

  const handleManualExecute = async () => {
    if (!formData.name.trim()) {
      alert('请先输入任务名称');
      return;
    }
    
    setExecutionStatus('processing');
    
    // 1. Save current form state first
    const currentTask = saveTask();
    
    // 2. Simulate execution delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 3. Update status to completed
    setTasks(prev => prev.map(t => 
      t.id === (activeTask?.id || currentTask.id) ? { ...t, status: 'completed' as TaskStatus } : t
    ));
    
    setExecutionStatus('success');
    
    // 4. Close modal after success feedback
    setTimeout(() => {
      setIsModalOpen(false);
      setIsDetailOpen(false);
      setExecutionStatus('idle');
    }, 1500);
  };

  const handleAiLearn = async () => {
    if (!formData.description.trim()) {
      alert('请先输入任务描述以供 AI 学习');
      return;
    }
    setIsAiLoading(true);
    setAiAnalysis('');
    const prompt = `作为一个养殖专家，请分析以下任务：
任务名称：${formData.name}
任务描述：${formData.description}
关联池位：${formData.pond}

请提供：
1. 任务执行的逻辑步骤。
2. 可能存在的风险及安全提示。
3. 优化执行效率的建议。`;

    try {
      const stream = getGeminiStreamingResponse(prompt);
      for await (const chunk of stream) {
        setAiAnalysis(prev => prev + chunk);
      }
    } catch (error) {
      setAiAnalysis('AI 学习过程中发生错误，请重试。');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveTask();
    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    if (taskToDelete) {
      setTasks(prev => prev.filter(t => t.id !== taskToDelete.id));
      setIsDeleteModalOpen(false);
      setTaskToDelete(null);
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-[#f9fafb]">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">任务管理</h1>
            <p className="text-gray-400 text-sm mt-1">创建和跟踪养殖场内的日常维护及突发任务</p>
          </div>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 bg-teal-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-teal-600 shadow-lg shadow-teal-500/20 transition-all active:scale-95"
          >
            <Plus size={20} />
            <span>发布新任务</span>
          </button>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1"><Filter size={12}/> 状态</span>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-sm text-gray-900 outline-none">
                <option value="all">全部状态</option>
                <option value="pending">待处理</option>
                <option value="in_progress">进行中</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1"><AlertCircle size={12}/> 优先级</span>
              <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-sm text-gray-900 outline-none">
                <option value="all">全部级别</option>
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 pt-4 border-t border-gray-50">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="搜索任务名称、ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-11 pr-4 py-3 text-sm text-gray-900 outline-none font-medium" />
            </div>
            <div className="relative flex-1 w-full">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="负责人..." value={searchAssignee} onChange={(e) => setSearchAssignee(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-11 pr-4 py-3 text-sm text-gray-900 outline-none font-medium" />
            </div>
            <button className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-600 rounded-xl text-sm font-bold border border-gray-100 shadow-sm">
              <RefreshCw size={16} /> 刷新
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-12">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">任务信息</th>
                <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">状态</th>
                <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">优先级</th>
                <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">负责人</th>
                <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:bg-white transition-all shadow-sm text-teal-500">
                        <ClipboardList size={20} />
                      </div>
                      <div>
                        <div className="text-[15px] font-bold text-gray-800">{task.name}</div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">{task.id} • {task.pond}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">{getStatusBadge(task.status)}</td>
                  <td className="px-6 py-6 font-medium text-sm text-gray-600">{getPriorityBadge(task.priority)}</td>
                  <td className="px-6 py-6 text-sm text-gray-700 font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center text-[10px] font-bold">{task.assignee.charAt(0)}</div>
                      {task.assignee}
                    </div>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => openDetailModal(task)} className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl">
                        <Eye size={18} />
                      </button>
                      <button onClick={() => openEditModal(task)} className="p-2.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => {setTaskToDelete(task); setIsDeleteModalOpen(true);}} className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl">
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

      {/* Task Detail Modal */}
      {isDetailOpen && activeTask && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setIsDetailOpen(false)} />
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in slide-in-from-right-10 duration-300">
            <div className="p-8 space-y-8">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 shadow-sm border border-teal-100">
                    <ClipboardList size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{activeTask.name}</h2>
                    <p className="text-sm font-mono text-gray-400">{activeTask.id} • {activeTask.pond}</p>
                  </div>
                </div>
                <button onClick={() => setIsDetailOpen(false)} className="p-2 text-gray-300 hover:text-gray-500 transition-colors"><X size={24} /></button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">执行进度</p>
                  {getStatusBadge(activeTask.status)}
                </div>
                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">紧急程度</p>
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(activeTask.priority)}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">任务详情</h3>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-teal-600">
                    <CalendarDays size={12} />
                    截止: {activeTask.dueDate}
                  </div>
                </div>
                <div className="p-5 bg-white border border-gray-100 rounded-2xl text-gray-600 text-[15px] leading-relaxed">
                  {activeTask.description}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">执行责任人</h3>
                <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-teal-500/20">
                    {activeTask.assignee.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{activeTask.assignee}</p>
                    <p className="text-xs text-gray-400">场区作业负责人</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex gap-3">
                <button onClick={() => openEditModal(activeTask)} className="flex-1 py-4 bg-teal-500 text-white rounded-2xl font-bold shadow-lg shadow-teal-500/20 hover:bg-teal-600 transition-all flex items-center justify-center gap-2 active:scale-95">
                  <Edit2 size={18} /> 编辑任务
                </button>
                <button onClick={() => setIsDetailOpen(false)} className="px-8 py-4 bg-gray-50 text-gray-400 rounded-2xl font-bold hover:bg-gray-100 transition-all">
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => executionStatus === 'idle' && setIsModalOpen(false)} />
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in zoom-in duration-200">
            {/* Overlay for Execution Status */}
            {executionStatus !== 'idle' && (
              <div className="absolute inset-0 z-[110] bg-white/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-8 space-y-6 animate-in fade-in duration-300">
                {executionStatus === 'processing' ? (
                  <>
                    <div className="w-20 h-20 bg-teal-50 text-teal-500 rounded-full flex items-center justify-center animate-pulse">
                      <Loader2 size={40} className="animate-spin" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">正在下发执行指令...</h3>
                      <p className="text-gray-400 mt-2">系统正在同步 IoT 数据中心并启动现场作业</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-in zoom-in duration-500">
                      <CheckCircle size={40} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-emerald-600">手动执行已成功启动</h3>
                      <p className="text-gray-400 mt-2">任务状态已更新，现场设备正在响应中</p>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="px-8 py-6 border-b flex items-center justify-between bg-teal-50/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-500 rounded-xl text-white">
                  <Plus size={24} />
                </div>
                <h2 className="text-xl font-bold text-gray-800">{activeTask ? '编辑任务' : '发布新任务'}</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">任务名称</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-teal-500/5" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">优先级</label>
                  <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as TaskPriority})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none">
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">负责人</label>
                  <input required value={formData.assignee} onChange={e => setFormData({...formData, assignee: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">关联池位</label>
                  <input value={formData.pond} onChange={e => setFormData({...formData, pond: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none" placeholder="例如：四号池" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">截止时间</label>
                  <input type="datetime-local" required value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">当前状态</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as TaskStatus})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none">
                    <option value="pending">待处理</option>
                    <option value="in_progress">进行中</option>
                    <option value="completed">已完成</option>
                    <option value="cancelled">已取消</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">任务描述</label>
                  <button type="button" onClick={handleAiLearn} disabled={isAiLoading} className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-lg hover:bg-teal-100 flex items-center gap-1 transition-colors">
                    {isAiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} 
                    AI 学习
                  </button>
                </div>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none resize-none" placeholder="请输入任务详细信息..." />
              </div>

              {/* AI Feedback Area */}
              {(aiAnalysis || isAiLoading) && (
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-bold text-teal-400 uppercase flex items-center gap-2">
                      <Bot size={12} /> AI 专家建议
                    </div>
                    {isAiLoading && <div className="text-[10px] text-teal-400/50 animate-pulse">正在生成深度分析...</div>}
                  </div>
                  <div className="text-[12px] text-teal-50/90 font-medium whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar leading-relaxed">
                    {aiAnalysis || (isAiLoading && "正在分析养殖任务逻辑...")}
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 font-bold text-gray-400 hover:bg-gray-50 rounded-xl transition-all">取消</button>
                <button 
                  type="button" 
                  onClick={handleManualExecute} 
                  className="flex-1 py-3 font-bold text-teal-600 border border-teal-100 rounded-xl hover:bg-teal-50 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <PlayCircle size={18} /> 立刻手动执行
                </button>
                <button type="submit" className="flex-1 py-3 font-bold text-white bg-teal-500 rounded-xl shadow-lg shadow-teal-500/20 hover:bg-teal-600 transition-all active:scale-[0.98]">确认提交</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Delete */}
      {isDeleteModalOpen && taskToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
          <div className="bg-white w-full max-sm rounded-[2rem] shadow-2xl relative p-8 text-center space-y-6 animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">确认撤销任务？</h3>
              <p className="text-sm text-gray-400 mt-2">此操作将移除任务 <span className="text-gray-900 font-bold">{taskToDelete.name}</span>。</p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-gray-400 hover:bg-gray-50 transition-all">取消</button>
              <button onClick={confirmDelete} className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white bg-red-500 shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all">确认撤销</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagement;