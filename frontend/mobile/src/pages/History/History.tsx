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
      case 'Importation': return <Import size={18} className="icon-import" />;
      case 'Consultation': return <FileText size={18} className="icon-view" />;
      case 'Téléchargement': return <Download size={18} className="icon-download" />;
      case 'Suppression': return <Trash2 size={18} className="icon-delete" />;
      default: return <Clock size={18} className="icon-default" />;
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
    <div className="history-container">
      <header className="history-header">
        <h1>Historique d'audit</h1>
        <p>Suivi complet des actions effectuées sur vos archives sécurisées.</p>
      </header>

      {loading ? (
        <div className="history-loader-wrapper">
          <div className="loader"></div>
        </div>
      ) : (
        <div className="history-list glass-panel">
          {history.length > 0 ? (
            history.map((item) => (
              <div key={item.id} className="history-item">
                <div className="history-action-icon">
                  {getActionIcon(item.actionType)}
                </div>

                <div className="history-content">
                  <div className="history-text">
                    <span className="history-user-name">{item.user?.name || "Utilisateur inconnu"}</span> 
                    <span className="history-verb">a effectué une</span> 
                    <span className="history-type">{item.actionType}</span>
                    
                    {item.document && (
                      <>
                        <span className="history-verb">sur</span>
                        <span className="history-doc-name">{item.document?.name || "Document inconnu"}</span>
                      </>
                    )}
                  </div>
                  <div className="history-meta">
                    <Clock size={12} />
                    <span>{formatDate(item.created_at)}</span>
                  </div>
                </div>

                <div className="history-user-email">
                  <User size={12} />
                  <span>{item.user.email}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="history-empty">
              <HistoryIcon size={48} className="history-empty-icon" />
              <p>Aucune activité enregistrée pour le moment.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default History;
