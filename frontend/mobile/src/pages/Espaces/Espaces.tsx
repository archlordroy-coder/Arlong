import { useState, useEffect, type FormEvent } from 'react';
import api from '../../api/client';
import { Plus, Search, FolderOpen } from 'lucide-react';
import './Espaces.css';

interface Espace {
  id: number;
  name: string;
  createdById: string;
  isDeleted: boolean;
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
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    fetchEspaces();
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
    if (!newName) return;
    
    try {
      const res = await api.post('/espaces', { name: newName });
      if (res.data.success) {
        setEspaces([res.data.data, ...espaces]);
        setShowModal(false);
        setNewName('');
      }
    } catch (error) {
      alert('Erreur lors de la création');
    }
  };

  const filteredEspaces = espaces.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="espaces-container">
      <header className="espaces-header">
        <div className="espaces-title-group">
          <h1>Espaces de travail</h1>
          <p>Gérez vos coffres-forts partagés et collaborez en toute sécurité.</p>
        </div>
        <button className="espaces-btn-add" onClick={() => setShowModal(true)}>
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
        <div className="espaces-loader-wrapper">
          <div className="loader"></div>
        </div>
      ) : (
        <div className="folder-grid">
          {filteredEspaces.map(espace => (
            <div 
              key={espace.id} 
              className="folder-card glass-panel"
              onClick={() => window.location.href = `/explorer?espaceId=${espace.id}`}
            >
              <div className="folder-icon blue">
                <FolderOpen size={40} />
              </div>
              <div className="folder-name">{espace.name}</div>
              <div className="folder-members">
                {(espace.users?.length || 0) + 1} membres
              </div>
            </div>
          ))}

          {filteredEspaces.length === 0 && (
            <div className="folder-empty glass-panel">
              <FolderOpen size={48} className="folder-empty-icon" />
              <p>Aucun espace trouvé.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Création */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Nouvel Espace</h2>
            <form onSubmit={handleCreate}>
              <div className="input-group">
                <label className="input-label">Nom de l'espace</label>
                <input 
                  type="text" 
                  className="input-field" 
                  autoFocus
                  placeholder="ex: Projet X, Famille, Factures..." 
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn-confirm">Créer l'Espace</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Espaces;
