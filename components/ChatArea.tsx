
import React, { useState, useRef, useEffect } from 'react';
import { TrendingUp, Cpu, History, Mic, GraduationCap, Send, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../types';
import { getGeminiStreamingResponse } from '../services/geminiService';

const ChatArea: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
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

  return (
    <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 my-4 mx-2 overflow-hidden relative">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <h2 className="text-gray-600 font-medium text-lg">new chat</h2>
        <div className="flex items-center gap-5 text-teal-200">
          <TrendingUp size={22} className="text-teal-400 hover:text-teal-600 cursor-pointer transition-colors" />
          <Cpu size={22} className="hover:text-teal-400 cursor-pointer transition-colors" />
          <History size={22} className="hover:text-teal-400 cursor-pointer transition-colors" />
          <Mic size={22} className="hover:text-teal-400 cursor-pointer transition-colors" />
          <GraduationCap size={22} className="hover:text-teal-400 cursor-pointer transition-colors" />
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 bg-transparent custom-scrollbar"
      >
        <div className="flex flex-col items-center space-y-4 max-w-3xl mx-auto w-full">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-300">
              <p className="text-lg">开始您的对话吧</p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`w-full flex ${msg.role === 'user' ? 'justify-center' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] rounded-2xl px-6 py-3.5 text-[15.5px] leading-relaxed transition-all duration-300 ${
                msg.role === 'user' 
                  ? 'bg-[#EBFDF5] text-[#065F46] border border-[#CDF9E5] shadow-sm' 
                  : 'bg-white text-gray-700 border border-gray-100 shadow-sm prose prose-slate'
              }`}>
                {msg.role === 'model' ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content || '...'}
                  </ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          {isLoading && messages.length > 0 && messages[messages.length - 1].content === '' && (
            <div className="flex justify-start w-full">
              <div className="bg-white rounded-2xl px-6 py-3.5 border border-gray-100 shadow-sm">
                <Loader2 className="animate-spin text-teal-500" size={20} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-gray-50">
        <div className="max-w-2xl mx-auto relative flex items-center bg-white rounded-2xl border border-gray-200 focus-within:border-teal-400 focus-within:ring-4 focus-within:ring-teal-50/50 transition-all shadow-sm">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="请输入提示语"
            className="w-full py-4 px-6 pr-14 text-gray-700 outline-none rounded-2xl placeholder-gray-300 font-medium"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`absolute right-3 p-2.5 rounded-xl transition-all ${
              input.trim() ? 'bg-teal-400 text-white hover:bg-teal-500 shadow-lg' : 'text-gray-300'
            }`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
