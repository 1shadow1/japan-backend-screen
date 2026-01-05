
import React, { useState, useRef, useEffect } from 'react';
import { TrendingUp, Cpu, History, Mic, GraduationCap, Send, Loader2, Paperclip, Globe, Clock, MessageSquareQuote } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, SidebarTab } from '../types';
import { getGeminiStreamingResponse } from '../services/geminiService';

interface ChatAreaProps {
  activeSidebarTab: SidebarTab;
  setActiveSidebarTab: (tab: SidebarTab) => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const ChatArea: React.FC<ChatAreaProps> = ({ activeSidebarTab, setActiveSidebarTab, messages, setMessages }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input;
    const userMsg: Message = {
      role: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const aiMsg: Message = {
      role: 'model',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    setMessages(prev => [...prev, aiMsg]);

    try {
      let accumulatedText = '';
      const stream = getGeminiStreamingResponse(userText);
      
      for await (const chunk of stream) {
        accumulatedText += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            ...aiMsg,
            content: accumulatedText
          };
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const navItems = [
    { id: 'data' as SidebarTab, icon: TrendingUp, label: '养殖数据' },
    { id: 'settings' as SidebarTab, icon: Cpu, label: '对话设置' },
    { id: 'history' as SidebarTab, icon: History, label: '历史回话' },
    { id: 'voice' as SidebarTab, icon: Mic, label: '语音聊天' },
    { id: 'sources' as SidebarTab, icon: GraduationCap, label: '数据源' },
  ];

  return (
    <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 my-4 mx-2 overflow-hidden relative">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
        <h2 className="text-gray-600 font-medium text-lg">new chat</h2>
        <div className="flex items-center gap-5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSidebarTab(item.id)}
              title={item.label}
              className={`p-1.5 rounded-lg transition-all ${
                activeSidebarTab === item.id 
                  ? 'text-teal-500 bg-teal-50' 
                  : 'text-teal-200 hover:text-teal-400 hover:bg-teal-50/30'
              }`}
            >
              <item.icon size={22} />
            </button>
          ))}
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-transparent custom-scrollbar"
      >
        <div className="flex flex-col space-y-6 w-full">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-300 gap-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                <MessageSquareQuote size={32} />
              </div>
              <p className="text-lg">开始您的对话吧</p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`w-full flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'user' && (
                <span className="text-[10px] text-gray-400 font-mono pb-1 select-none">
                  {msg.timestamp}
                </span>
              )}
              
              <div className={`max-w-[80%] rounded-2xl px-6 py-3.5 text-[15px] leading-relaxed transition-all duration-300 ${
                msg.role === 'user' 
                  ? 'bg-[#EBFDF5] text-[#065F46] border border-[#CDF9E5] shadow-sm rounded-br-none' 
                  : 'bg-white text-gray-700 border border-gray-100 shadow-sm prose prose-slate rounded-bl-none'
              }`}>
                {msg.role === 'model' ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content || '...'}
                  </ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>

              {msg.role === 'model' && (
                <span className="text-[10px] text-gray-400 font-mono pb-1 select-none">
                  {msg.timestamp}
                </span>
              )}
            </div>
          ))}
          {isLoading && messages.length > 0 && messages[messages.length - 1].content === '' && (
            <div className="flex justify-start w-full">
              <div className="bg-white rounded-2xl px-6 py-3.5 border border-gray-100 shadow-sm rounded-bl-none">
                <Loader2 className="animate-spin text-teal-500" size={20} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="w-full relative flex items-center bg-white rounded-2xl border border-gray-200 focus-within:border-teal-400 focus-within:ring-4 focus-within:ring-teal-50/30 transition-all shadow-sm">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="请输入您的问题或指令..."
            className="w-full py-4 px-6 pr-32 text-gray-700 outline-none rounded-2xl placeholder-gray-300 font-medium bg-white"
          />
          <div className="absolute right-3 flex items-center gap-2">
            <button 
              type="button"
              className="p-2 text-gray-400 hover:text-teal-500 transition-colors"
              title="上传文件"
            >
              <Paperclip size={20} />
            </button>
            <button 
              type="button"
              className="p-2 text-gray-400 hover:text-teal-500 transition-colors"
              title="联网搜索"
            >
              <Globe size={20} />
            </button>
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`p-2.5 rounded-xl transition-all ${
                input.trim() ? 'bg-teal-500 text-white hover:bg-teal-600 shadow-md active:scale-95' : 'text-gray-300 bg-gray-50'
              }`}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
