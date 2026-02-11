import React, { useState, useEffect, useRef } from 'react';
import { Chat, GenerateContentResponse } from "@google/genai";
import { ChatMessage, MarketingReport } from '../types';
import * as geminiService from '../services/geminiService';
import { SparklesIcon, XMarkIcon } from './IconComponents';

interface ChatInterfaceProps {
  report: MarketingReport;
  onClose?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ report, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Chat Session
  useEffect(() => {
    try {
        const chat = geminiService.createChatSession(report);
        setChatSession(chat);
        setMessages([
            { role: 'model', text: `I've finished the strategy for "${report.showInfo.title}". What would you like to discuss?` }
        ]);
    } catch (e) {
        console.error("Failed to init chat", e);
        setMessages([{ role: 'model', text: "Error: Could not initialize chat session. Please check API Key."}]);
    }
  }, [report.showInfo.title]); // Re-init if report title changes

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chatSession || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
        const response: GenerateContentResponse = await chatSession.sendMessage({ message: userMsg });
        const text = response.text || "I'm sorry, I couldn't generate a response.";
        setMessages(prev => [...prev, { role: 'model', text }]);
    } catch (error: any) {
        console.error("Chat Error", error);
        setMessages(prev => [...prev, { role: 'model', text: "Error: " + (error.message || "Failed to send message") }]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl overflow-hidden flex flex-col h-[500px] w-full print-break-inside-avoid">
       {/* Chat Header */}
       <div className="bg-gray-900/80 backdrop-blur p-4 border-b border-gray-700 flex justify-between items-center">
            <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <h3 className="font-bold text-gray-200">Chat with Strategist</h3>
            </div>
            {onClose && (
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                    <XMarkIcon className="w-5 h-5" />
                </button>
            )}
       </div>

       {/* Messages Area */}
       <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900/30">
            {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div 
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                            msg.role === 'user' 
                            ? 'bg-indigo-600 text-white rounded-br-sm' 
                            : 'bg-gray-700 text-gray-200 rounded-bl-sm'
                        }`}
                    >
                        {msg.text}
                    </div>
                </div>
            ))}
            {isLoading && (
                <div className="flex justify-start">
                     <div className="bg-gray-700 rounded-2xl px-4 py-3 rounded-bl-sm flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms'}}></div>
                     </div>
                </div>
            )}
            <div ref={messagesEndRef} />
       </div>

       {/* Input Area */}
       <form onSubmit={handleSend} className="p-4 bg-gray-800 border-t border-gray-700">
            <div className="relative">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about the budget, audience, or key art..."
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-4 pr-12 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-gray-500"
                    disabled={isLoading}
                />
                <button 
                    type="submit" 
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-indigo-400 hover:text-white disabled:text-gray-600 transition-colors"
                >
                    <SparklesIcon className="w-5 h-5" />
                </button>
            </div>
       </form>
    </div>
  );
};

export default ChatInterface;