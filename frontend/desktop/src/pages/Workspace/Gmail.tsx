import { useState, useEffect } from 'react';
import api from '../../api/client';
import { Mail, Send, Loader2 } from 'lucide-react';
import './Workspace.css';

const Gmail = () => {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [formData, setFormData] = useState({ to: '', subject: '', body: '' });

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      const res = await api.get('/gmail/inbox');
      if (res.data.success) {
        setEmails(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching gmail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/gmail/send', formData);
      setComposing(false);
      setFormData({ to: '', subject: '', body: '' });
      alert('Email envoyé !');
    } catch (err) {
      alert('Erreur lors de l’envoi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="workspace-container">
      <div className="workspace-header">
        <h1><Mail size={24} /> Gmail Intégré</h1>
        <button className="btn btn-primary" onClick={() => setComposing(true)}>Composer</button>
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="animate-spin" size={40} /></div>
      ) : (
        <div className="email-list glass-panel">
          {emails.length === 0 ? (
            <p className="p-10 text-center opacity-50">Aucun message trouvé.</p>
          ) : (
            emails.map((m: any) => (
              <div key={m.id} className="email-item">
                <div className="email-sender">ID: {m.id}</div>
                <div className="email-snippet">Fil d'actualité Google...</div>
              </div>
            ))
          )}
        </div>
      )}

      {composing && (
        <div className="admin-modal-overlay">
          <div className="glass-panel admin-modal">
            <h2>Nouveau Message</h2>
            <form onSubmit={handleSend}>
              <div className="input-group">
                <label>À</label>
                <input type="email" className="input-field" value={formData.to} onChange={e => setFormData({...formData, to: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>Objet</label>
                <input type="text" className="input-field" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>Message</label>
                <textarea className="input-field" rows={5} value={formData.body} onChange={e => setFormData({...formData, body: e.target.value})} required></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setComposing(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary"><Send size={16} /> Envoyer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gmail;
