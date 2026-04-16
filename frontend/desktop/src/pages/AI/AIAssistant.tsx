import { useState, useRef, useEffect } from 'react';
import api from '../../api/client';
import { Sparkles, Send, User, Bot, Loader2 } from 'lucide-react';
import './AI.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Bonjour ! Je suis Arlong AI. Comment puis-je vous aider avec vos archives aujourd\'hui ?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        message: userMsg,
        history: messages,
        context: { spaces: [], recentFolders: [], recentFiles: [] }
      });

      if (res.data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: res.data.data }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Désolé, j'ai rencontré une erreur." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-container">
      <div className="ai-header">
        <h1><Sparkles size={24} className="text-primary" /> Arlong AI</h1>
        <p>Assistant Intelligent Gemma 4</p>
      </div>

      <div className="ai-chat-window glass-panel" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`chat-message ${m.role}`}>
            <div className="chat-icon">
              {m.role === 'user' ? <User size={18} /> : <Bot size={18} />}
            </div>
            <div className="chat-bubble">
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="chat-message assistant">
            <div className="chat-icon"><Loader2 className="animate-spin" size={18} /></div>
            <div className="chat-bubble">Réflexion en cours...</div>
          </div>
        )}
      </div>

      <form className="ai-input-area" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Posez une question sur vos documents..."
          value={input}
          onChange={e => setInput(e.target.value)}
          className="input-field"
        />
        <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()}>
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default AIAssistant;
