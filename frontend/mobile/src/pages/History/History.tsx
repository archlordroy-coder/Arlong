import { useState, useEffect, useRef } from 'react';
import api from '../../api/client';
import { Clock, User, FileText, Download, Import, Trash2, Shield, MoreVertical, X, AlertTriangle, Loader2 } from 'lucide-react';
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
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<HistoryItem | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const handleDeleteItem = async () => {
    if (!showDeleteModal) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/historique/${showDeleteModal.id}`);
      if (res.data.success) {
        setHistory(history.filter(h => h.id !== showDeleteModal.id));
        setShowDeleteModal(null);
      }
    } catch (error) {
      alert('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearAll = async () => {
    setIsClearingAll(true);
    try {
      const res = await api.delete('/historique/clear-all');
      if (res.data.success) {
        setHistory([]);
        setShowClearAllModal(null);
      }
    } catch (error) {
      alert('Erreur lors de la suppression');
    } finally {
      setIsClearingAll(false);
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
        <div className="history-header-content">
          <h1>Historique</h1>
          <p>{history.length} action{history.length !== 1 ? 's' : ''}</p>
        </div>
        {history.length > 0 && (
          <button 
            className="history-clear-btn"
            onClick={() => setShowClearAllModal(true)}
          >
            <Trash2 size={16} />
            Tout effacer
          </button>
        )}
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

                <div className="history-item-actions">
                  <button 
                    className="history-menu-btn"
                    onClick={() => setActiveMenu(activeMenu === item.id ? null : item.id)}
                  >
                    <MoreVertical size={18} />
                  </button>

                  {activeMenu === item.id && (
                    <div className="history-options-menu" ref={menuRef}>
                      <button 
                        className="history-option danger"
                        onClick={() => {
                          setShowDeleteModal(item);
                          setActiveMenu(null);
                        }}
                      >
                        <Trash2 size={16} />
                        <span>Supprimer</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="history-empty">
              <Shield size={48} className="history-empty-icon" />
              <h3>Aucun historique</h3>
              <p>Vos activités seront enregistrées ici.</p>
            </div>
          )}
        </div>
      )}

      {/* Delete Single Item Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => !isDeleting && setShowDeleteModal(null)}>
          <div className="delete-modal" onClick={e => e.stopPropagation()}>
            <div className="delete-modal-icon">
              <Trash2 size={32} />
            </div>
            <h3>Supprimer cette entrée ?</h3>
            <p>Cette action de l'historique sera définitivement supprimée.</p>
            <div className="delete-modal-actions">
              <button 
                className="btn-cancel"
                onClick={() => setShowDeleteModal(null)}
                disabled={isDeleting}
              >
                Annuler
              </button>
              <button 
                className="btn-delete-confirm"
                onClick={handleDeleteItem}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Supprimer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Modal */}
      {showClearAllModal && (
        <div className="modal-overlay" onClick={() => !isClearingAll && setShowClearAllModal(null)}>
          <div className="delete-modal" onClick={e => e.stopPropagation()}>
            <div className="delete-modal-icon warning">
              <AlertTriangle size={32} />
            </div>
            <h3>Tout effacer ?</h3>
            <p>
              Les {history.length} entrées de l'historique seront <strong>définitivement supprimées</strong>. 
              Cette action est irréversible.
            </p>
            <div className="delete-modal-actions">
              <button 
                className="btn-cancel"
                onClick={() => setShowClearAllModal(null)}
                disabled={isClearingAll}
              >
                Annuler
              </button>
              <button 
                className="btn-delete-confirm"
                onClick={handleClearAll}
                disabled={isClearingAll}
              >
                {isClearingAll ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Tout supprimer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
