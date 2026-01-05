
import React, { useState, useRef, useEffect } from 'react';
import { Calendar, MapPin, ChevronDown, Cpu, History, Mic, GraduationCap, TrendingUp, Settings, Save, Database, Library, FileText, Play, Square, Volume2, Loader2, Bot } from 'lucide-react';
import { SidebarTab, Message } from '../types';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

interface DataPanelProps {
  activeTab: SidebarTab;
  setActiveTab: (tab: SidebarTab) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const DataPanel: React.FC<DataPanelProps> = ({ activeTab, setActiveTab, setMessages }) => {
  // Voice Chat State
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Settings State
  const [settings, setSettings] = useState({
    systemInstruction: "You are an expert AI assistant for an aquaculture management system.",
    model: 'gemini-3-flash-preview',
    temperature: 0.7,
    maxTokens: 2048,
    summaryFreq: 'every_5',
    tools: ['googleSearch']
  });

  const stopVoice = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    setIsVoiceActive(false);
    setVoiceStatus('idle');
  };

  const startVoice = async () => {
    try {
      setVoiceStatus('connecting');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = audioCtx;
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      inputAudioContextRef.current = inputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setVoiceStatus('listening');
            setIsVoiceActive(true);

            // Audio input processing
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
              
              const base64 = btoa(String.fromCharCode(...new Uint8Array(int16.buffer)));
              sessionPromise.then(session => {
                session.sendRealtimeInput({ 
                  media: { data: base64, mimeType: 'audio/pcm;rate=16000' } 
                });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              setVoiceStatus('speaking');
              const bytes = atob(audioData).split('').map(c => c.charCodeAt(0));
              const uint8 = new Uint8Array(bytes);
              const dataInt16 = new Int16Array(uint8.buffer);
              const buffer = audioCtx.createBuffer(1, dataInt16.length, 24000);
              const channelData = buffer.getChannelData(0);
              for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;

              const source = audioCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(audioCtx.destination);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioCtx.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setVoiceStatus('listening');
              };
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }

            if (message.serverContent?.turnComplete) {
              // Optionally handle transcripts here
            }

            // Map server transcripts to main chat
            if (message.serverContent?.inputTranscription) {
               const text = message.serverContent.inputTranscription.text;
               setMessages(prev => {
                 const last = prev[prev.length - 1];
                 if (last && last.role === 'user' && last.timestamp === 'Voice') {
                   return [...prev.slice(0, -1), { ...last, content: last.content + text }];
                 }
                 return [...prev, { role: 'user', content: text, timestamp: 'Voice' }];
               });
            }
            if (message.serverContent?.outputTranscription) {
               const text = message.serverContent.outputTranscription.text;
               setMessages(prev => {
                 const last = prev[prev.length - 1];
                 if (last && last.role === 'model' && last.timestamp === 'Voice') {
                   return [...prev.slice(0, -1), { ...last, content: last.content + text }];
                 }
                 return [...prev, { role: 'model', content: text, timestamp: 'Voice' }];
               });
            }
          },
          onclose: () => stopVoice(),
          onerror: (e) => {
            console.error("Live API Error:", e);
            stopVoice();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: settings.systemInstruction
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (e) {
      console.error(e);
      setVoiceStatus('idle');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'data':
        return (
          <div className="space-y-8 animate-in fade-in duration-300">
            <section>
              <h3 className="text-gray-800 font-bold text-lg mb-4">养殖数据</h3>
              <div className="relative group">
                <select className="w-full appearance-none bg-[#F9FAFB] border border-gray-200 rounded-xl px-5 py-3.5 text-[15px] text-gray-700 outline-none focus:ring-4 focus:ring-teal-50 transition-all cursor-pointer font-medium">
                  <option>四号池</option>
                  <option>三号池</option>
                  <option>二号池</option>
                </select>
                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </section>
            <section>
              <h4 className="text-gray-400 text-[13px] font-bold mb-4 uppercase tracking-widest">养殖概况</h4>
              <div className="space-y-px bg-gray-100 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                {[
                  { label: '养殖面积', value: '7 ha' },
                  { label: '养殖种类', value: '南美白对虾' },
                  { label: '预计产量', value: '12.4 吨' }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center px-6 py-4.5 bg-white transition-colors hover:bg-gray-50/80">
                    <span className="text-gray-500 font-medium">{item.label}</span>
                    <span className="text-gray-900 font-bold text-lg">{item.value}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <h3 className="text-gray-800 font-bold text-lg flex items-center gap-2">
              <Cpu size={20} className="text-teal-500" /> 对话设置
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">系统提示词 (System Instruction)</label>
                <textarea 
                  value={settings.systemInstruction} 
                  onChange={e => setSettings({...settings, systemInstruction: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-teal-500/10 min-h-[100px] resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">选择模型</label>
                <select 
                  value={settings.model}
                  onChange={e => setSettings({...settings, model: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none"
                >
                  <option value="gemini-3-flash-preview">Gemini 3 Flash (Fast)</option>
                  <option value="gemini-3-pro-preview">Gemini 3 Pro (Smart)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">温度 (Temp)</label>
                  <input 
                    type="range" min="0" max="1" step="0.1" 
                    value={settings.temperature}
                    onChange={e => setSettings({...settings, temperature: parseFloat(e.target.value)})}
                    className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-teal-500"
                  />
                  <div className="text-[10px] text-right text-gray-400 font-bold">{settings.temperature}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">最大输出 (Tokens)</label>
                  <input 
                    type="number" 
                    value={settings.maxTokens}
                    onChange={e => setSettings({...settings, maxTokens: parseInt(e.target.value)})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm text-gray-700 outline-none"
                  />
                </div>
              </div>
              <button className="w-full py-3 bg-teal-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 hover:bg-teal-600 transition-all">
                <Save size={18} /> 保存配置
              </button>
            </div>
          </div>
        );
      case 'history':
        return (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <h3 className="text-gray-800 font-bold text-lg flex items-center gap-2">
              <History size={20} className="text-teal-500" /> 历史回话
            </h3>
            <div className="space-y-2">
              {[
                { title: '四号池溶氧量偏低咨询', date: '2024-05-20 14:22' },
                { title: '南美白对虾饵料投喂率计算', date: '2024-05-19 10:15' },
                { title: '增氧机自动化开启规则设定', date: '2024-05-18 16:40' },
                { title: '水质异常预警处理', date: '2024-05-17 09:12' }
              ].map((item, i) => (
                <button key={i} className="w-full text-left p-4 bg-white border border-gray-100 rounded-2xl hover:bg-teal-50 hover:border-teal-100 transition-all group">
                  <p className="text-sm font-bold text-gray-700 group-hover:text-teal-700 line-clamp-1">{item.title}</p>
                  <p className="text-[10px] text-gray-400 font-mono mt-1">{item.date}</p>
                </button>
              ))}
            </div>
          </div>
        );
      case 'voice':
        return (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            <h3 className="text-gray-800 font-bold text-lg flex items-center gap-2">
              <Mic size={20} className="text-teal-500" /> 语音聊天
            </h3>
            <div className="flex flex-col items-center gap-6 py-8">
              <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 relative ${
                isVoiceActive ? 'bg-teal-500 shadow-[0_0_40px_rgba(20,184,166,0.3)]' : 'bg-gray-100'
              }`}>
                {isVoiceActive && (
                  <div className="absolute inset-0 rounded-full border-4 border-teal-500/20 animate-ping" />
                )}
                {voiceStatus === 'connecting' ? (
                  <Loader2 className="animate-spin text-teal-600" size={48} />
                ) : voiceStatus === 'speaking' ? (
                  <Volume2 className="text-white" size={48} />
                ) : (
                  <Mic className={isVoiceActive ? 'text-white' : 'text-gray-300'} size={48} />
                )}
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-700">
                  {voiceStatus === 'idle' ? '准备就绪' : 
                   voiceStatus === 'connecting' ? '正在连接 AI...' : 
                   voiceStatus === 'listening' ? '正在聆听您的声音' : 'AI 正在回复'}
                </p>
                <p className="text-sm text-gray-400 mt-1 italic">
                  实时语音对话模式 (Gemini 2.5 Native)
                </p>
              </div>
              <button 
                onClick={isVoiceActive ? stopVoice : startVoice}
                className={`flex items-center gap-2 px-10 py-4 rounded-2xl font-bold transition-all ${
                  isVoiceActive 
                    ? 'bg-red-50 text-red-600 border border-red-100' 
                    : 'bg-teal-500 text-white shadow-xl shadow-teal-500/30'
                }`}
              >
                {isVoiceActive ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                {isVoiceActive ? '停止通话' : '开始语音对话'}
              </button>
            </div>
          </div>
        );
      case 'sources':
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <h3 className="text-gray-800 font-bold text-lg flex items-center gap-2">
              <GraduationCap size={20} className="text-teal-500" /> 数据源管理
            </h3>
            <div className="space-y-4">
              <section>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">知识库 (Knowledge Base)</label>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                      <Library size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-700">养殖场操作规程.pdf</p>
                      <p className="text-[10px] text-gray-400">已索引 • 2,451 条目</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                    <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-700">病害防治百科.txt</p>
                      <p className="text-[10px] text-gray-400">已索引 • 1,102 条目</p>
                    </div>
                  </div>
                </div>
              </section>
              <section>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">外部数据库 (External DB)</label>
                <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database size={20} className="text-teal-600" />
                    <div>
                      <p className="text-sm font-bold text-teal-700">实时水质分析库</p>
                      <p className="text-[10px] text-teal-500">已连接 • PostgreSQL</p>
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </section>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-80 h-[calc(100vh-3.5rem)] bg-white border-l border-gray-100 overflow-y-auto p-6 flex flex-col gap-8 custom-scrollbar relative">
      {renderContent()}
    </div>
  );
};

export default DataPanel;
