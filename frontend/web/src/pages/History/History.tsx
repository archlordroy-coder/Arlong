import { useState, useEffect } from 'react';
import api from '../../api/client';
import { History as HistoryIcon, Clock, User, FileText, Download, Import, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import './History.css';

interface HistoryItem {
  id: number;
  actionType: string;
  docId: number | null;
  userId: string;
  created_at: string;
  user: {
    name: string;
    email: string;
  };
  document: {
    name: string;
    type: string;
  } | null;
}

const History = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/historique');
      if (res.data.success) {
        setHistory(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'Importation': return <Import size={18} className="text-primary" />;
      case 'Consultation': return <FileText size={18} className="text-blue-400" />;
      case 'Téléchargement': return <Download size={18} className="text-green-400" />;
      case 'Suppression': return <Trash2 size={18} className="text-red-400" />;
      default: return <Clock size={18} className="text-secondary" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Date inconnue";
      return format(date, "eeee d MMMM yyyy 'à' HH:mm", { locale: fr });
    } catch (e) {
      return "Date invalide";
    }
  };

  return (
    <div className="history-container animate-fade-in">
      <div className="history-header mb-8">
        <h1 className="text-3xl font-bold mb-2">Historique d'audit</h1>
        <p className="text-secondary">Suivi complet des actions effectuées sur vos archives sécurisées.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="loader"></div>
        </div>
      ) : (
        <div className="history-list-container glass-panel">
          <div className="history-rows">
            {history.map((item) => (
              <div key={item.id} className="history-row flex items-center gap-6 p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                <div className="action-icon-wrapper p-3 rounded-full bg-white/5">
                  {getActionIcon(item.actionType)}
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-bold text-white">{item.user?.name || "Utilisateur inconnu"}</span>
                    <span className="text-secondary text-sm">a effectué une</span>
                    <span className="font-semibold text-primary">{item.actionType}</span>
                    {item.document && (
                      <>
                        <span className="text-secondary text-sm">sur</span>
                        <span className="text-white italic underline decoration-white/20">{item.document?.name || "Document inconnu"}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-secondary">
                    <Clock size={12} />
                    {formatDate(item.created_at)}
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-2 text-xs text-secondary opacity-50 px-3 py-1 bg-white/5 rounded-full">
                  <User size={12} />
                  {item.user.email}
                </div>
              </div>
            ))}

            {history.length === 0 && (
              <div className="py-20 text-center text-secondary">
                <HistoryIcon size={48} className="mx-auto mb-4 opacity-10" />
                <p>Aucune activité enregistrée pour le moment.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
