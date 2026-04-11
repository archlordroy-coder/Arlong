import { useState, useEffect, useRef, type FormEvent } from 'react';
import api from '../../api/client';
import { Plus, Search, FolderOpen, MoreVertical, Pencil, Trash2, Users, Calendar, X, Check } from 'lucide-react';
import { SkeletonCard } from '../../components/Common/Skeleton';
import './Espaces.css';

interface Espace {
  id: number;
  name: string;
  createdById: string;
  isDeleted: boolean;
  created_at?: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  users: Array<{
    user: {
      id: string;
      name: string;
      email: string;
      avatar: string | null;
    }
  }>;
}

const Espaces = () => {
  const [espaces, setEspaces] = useState<Espace[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState<number | null>(null);
  const [showRenameModal, setShowRenameModal] = useState<Espace | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<Espace | null>(null);
  const [newName, setNewName] = useState('');
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchEspaces();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setShowOptionsMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchEspaces = async () => {
    try {
      const res = await api.get('/espaces');
      if (res.data.success) {
        setEspaces(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching espaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    try {
      const res = await api.post('/espaces', { name: newName.trim() });
      if (res.data.success) {
        setEspaces([res.data.data, ...espaces]);
        setShowCreateModal(false);
        setNewName('');
      }
    } catch (error) {
      alert('Erreur lors de la création');
    }
  };

  const handleRename = async () => {
    if (!showRenameModal || !newName.trim()) return;
    
    try {
      const res = await api.put(`/espaces/${showRenameModal.id}`, { name: newName.trim() });
      if (res.data.success) {
        setEspaces(espaces.map(e => 
          e.id === showRenameModal.id ? { ...e, name: newName.trim() } : e
        ));
        setShowRenameModal(null);
        setNewName('');
      }
    } catch (error) {
      alert('Erreur lors du renommage');
    }
  };

  const handleDelete = async () => {
    if (!showDeleteModal) return;
    
    setIsDeleting(showDeleteModal.id);
    try {
      const res = await api.delete(`/espaces/${showDeleteModal.id}`);
      if (res.data.success) {
        setEspaces(espaces.filter(e => e.id !== showDeleteModal.id));
        setShowDeleteModal(null);
      }
    } catch (error) {
      alert('Erreur lors de la suppression');
    } finally {
      setIsDeleting(null);
      setShowOptionsMenu(null);
    }
  };

  const openRenameModal = (espace: Espace) => {
    setNewName(espace.name);
    setShowRenameModal(espace);
    setShowOptionsMenu(null);
  };

  const filteredEspaces = espaces.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="espaces-container">
      <header className="espaces-header">
        <div className="espaces-title-group">
          <h1>Mes Espaces</h1>
          <p>{espaces.length} espace{espaces.length !== 1 ? 's' : ''} disponible{espaces.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="espaces-btn-add" onClick={() => setShowCreateModal(true)}>
          <Plus size={20} />
          <span>Nouveau</span>
        </button>
      </header>

      <div className="search-bar-container glass-panel">
        <Search className="search-icon" size={20} />
        <input 
          type="text" 
          placeholder="Rechercher un espace..." 
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="folder-grid">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredEspaces.length > 0 ? (
        <div className="espace-list">
          {filteredEspaces.map((espace, index) => (
            <div 
              key={espace.id} 
              className="espace-card glass-panel"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div 
                className="espace-card-main"
                onClick={() => window.location.href = `/explorer?espaceId=${espace.id}`}
              >
                <div className={`espace-icon-wrapper color-${(espace.id % 5) + 1}`}>
                  <FolderOpen size={24} />
                </div>
                <div className="espace-info">
                  <h3 className="espace-name">{espace.name}</h3>
                  <div className="espace-meta">
                    <span className="meta-item">
                      <Users size={12} />
                      {(espace.users?.length || 0) + 1}
                    </span>
                    {espace.created_at && (
                      <span className="meta-item">
                        <Calendar size={12} />
                        {new Date(espace.created_at).toLocaleDateString('fr-FR', { 
                          day: '2-digit', month: 'short' 
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="espace-actions" ref={showOptionsMenu === espace.id ? optionsMenuRef : null}>
                <button 
                  className="espace-menu-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOptionsMenu(showOptionsMenu === espace.id ? null : espace.id);
                  }}
                  disabled={isDeleting === espace.id}
                >
                  {isDeleting === espace.id ? (
                    <div className="spinner" />
                  ) : (
                    <MoreVertical size={20} />
                  )}
                </button>

                {showOptionsMenu === espace.id && (
                  <div className="espace-options-menu glass-panel">
                    <button 
                      className="espace-option"
                      onClick={(e) => {
                        e.stopPropagation();
                        openRenameModal(espace);
                      }}
                    >
                      <Pencil size={16} />
                      <span>Renommer</span>
                    </button>
                    <button 
                      className="espace-option danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteModal(espace);
                        setShowOptionsMenu(null);
                      }}
                    >
                      <Trash2 size={16} />
                      <span>Supprimer</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="folder-empty glass-panel">
          <div className="espace-empty-icon">
            <FolderOpen size={48} />
          </div>
          {searchTerm ? (
            <>
              <h3>Aucun résultat</h3>
              <p>Aucun espace ne correspond à "{searchTerm}"</p>
            </>
          ) : (
            <>
              <h3>Aucun espace</h3>
              <p>Créez votre premier espace pour commencer à archiver vos documents.</p>
              <button 
                className="espace-empty-btn"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={18} />
                Créer un espace
              </button>
            </>
          )}
        </div>
      )}

      {/* Modal Création */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h2>Créer un espace</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="input-group">
                <label className="input-label">Nom de l'espace</label>
                <input 
                  type="text" 
                  className="input-field" 
                  autoFocus
                  placeholder="ex: Projets, Factures, Famille..." 
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowCreateModal(false)}>Annuler</button>
                <button type="submit" className="btn-confirm" disabled={!newName.trim()}>Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Renommage */}
      {showRenameModal && (
        <div className="modal-overlay" onClick={() => setShowRenameModal(null)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h2>Renommer l'espace</h2>
              <button className="modal-close" onClick={() => setShowRenameModal(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="input-group">
              <label className="input-label">Nouveau nom</label>
              <input 
                type="text" 
                className="input-field" 
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowRenameModal(null)}>Annuler</button>
              <button 
                className="btn-confirm" 
                onClick={handleRename}
                disabled={!newName.trim() || newName === showRenameModal.name}
              >
                <Check size={16} />
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmation Suppression */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => !isDeleting && setShowDeleteModal(null)}>
          <div className="delete-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="delete-confirm-icon">
              <Trash2 size={32} />
            </div>
            <h2>Supprimer l'espace ?</h2>
            <p>
              <strong>"{showDeleteModal.name}"</strong> sera définitivement supprimé. 
              Cette action est irréversible.
            </p>
            <div className="delete-confirm-actions">
              <button 
                className="btn-cancel"
                onClick={() => setShowDeleteModal(null)}
                disabled={!!isDeleting}
              >
                Annuler
              </button>
              <button 
                className="btn-delete-confirm"
                onClick={handleDelete}
                disabled={!!isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="spinner" />
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
    </div>
  );
};

export default Espaces;
