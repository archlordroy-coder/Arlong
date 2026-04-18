import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, Sparkles } from 'lucide-react';
import api from '../../api/client';
import './AIChat.css';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

const AIChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: 'Bonjour ! Je suis Mboa Drive AI. Comment puis-je vous aider aujourd\'hui ?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const res = await api.post('/ai/chat', {
        message: userMessage,
        history: messages,
        context: {
          // On pourrait injecter des stats ou des noms de fichiers ici
          platform: 'web',
          timestamp: new Date().toISOString()
        }
      });

      if (res.data.success) {
        setMessages(prev => [...prev, { role: 'ai', content: res.data.data }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'ai', content: 'Désolé, une erreur est survenue lors de la communication avec l\'assistant.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <div className="ai-chat-bubble" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        {!isOpen && messages.length === 1 && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900"></div>
        )}
      </div>

      {isOpen && (
        <div className="ai-chat-window animate-slide-up">
          <div className="ai-chat-header">
            <h3>
              <div className="p-1.5 bg-primary/20 rounded-lg text-primary">
                <Bot size={18} />
              </div>
              Mboa Drive Assistant AI
              <Sparkles size={14} className="text-yellow-400" />
            </h3>
            <div className="flex items-center gap-3">
              <div className="ai-status-indicator"></div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="ai-chat-content" ref={scrollRef}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`}>
                {msg.content}
              </div>
            ))}
            {isTyping && (
              <div className="chat-message ai">
                <div className="ai-typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
          </div>

          <div className="ai-chat-input-area">
            <form className="ai-chat-form" onSubmit={handleSubmit}>
              <input 
                type="text" 
                className="ai-chat-input"
                placeholder="Posez-moi une question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                autoFocus
              />
              <button 
                type="submit" 
                className="ai-chat-send-btn"
                disabled={!input.trim() || isTyping}
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChat;
