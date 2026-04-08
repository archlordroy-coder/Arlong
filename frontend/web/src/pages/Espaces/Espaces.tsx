import React, { useState, useEffect } from 'react';
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

  const handleCreate = async (e: React.FormEvent) => {
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
    <div className="espaces-container animate-fade-in text-white">
      <div className="espaces-header">
        <div>
          <h1 className="text-3xl font-bold mb-2">Espaces de travail</h1>
          <p className="text-secondary">Gérez vos coffres-forts partagés et collaborez en toute sécurité.</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          <span>Nouvel Espace</span>
        </button>
      </div>

      <div className="search-bar-container glass-panel mb-8">
        <Search className="text-secondary" size={20} />
        <input 
          type="text" 
          placeholder="Rechercher un espace..." 
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="loader"></div>
        </div>
      ) : (
        <div className="folder-grid">
          {filteredEspaces.map(espace => (
            <div 
              key={espace.id} 
              className="folder-card glass-panel hover:scale-105 transition-all cursor-pointer"
              onClick={() => window.location.href = `/explorer?espaceId=${espace.id}`}
            >
              <div className="folder-icon blue">
                <FolderOpen size={40} />
              </div>
              <div className="folder-name">{espace.name}</div>
              <div className="text-[10px] text-secondary mt-1">
                {(espace.users?.length || 0) + 1} membres
              </div>
            </div>
          ))}

          {filteredEspaces.length === 0 && (
            <div className="col-span-full py-20 text-center text-secondary glass-panel">
              <FolderOpen size={48} className="mx-auto mb-4 opacity-10" />
              <p>Aucun espace trouvé.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Création */}
      {showModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowModal(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Nouvel Espace</h2>
            <form onSubmit={handleCreate}>
              <div className="input-group mb-6">
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
              <div className="flex gap-4">
                <button type="button" className="btn btn-secondary flex-1" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary flex-1">Créer l'Espace</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Espaces;
