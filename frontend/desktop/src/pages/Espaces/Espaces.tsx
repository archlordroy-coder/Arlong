import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  Plus, Search, FolderOpen, MoreVertical, Pencil, Trash2,
  Users, Calendar, X, Check, Loader2
} from 'lucide-react';
import './Espaces.css';

interface Espace {
  id: number;
  name: string;
  createdById: string;
  created_at?: string;
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

  const [showOptionsMenu, setShowOptionsMenu] = useState<number | null>(null);
  const [showRenameModal, setShowRenameModal] = useState<Espace | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<Espace | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

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

  const handleRename = async () => {
    if (!showRenameModal || !newName.trim()) return;
    try {
      const res = await api.put(`/espaces/${showRenameModal.id}`, { name: newName.trim() });
      if (res.data.success) {
        setEspaces(espaces.map(e => e.id === showRenameModal.id ? { ...e, name: newName.trim() } : e));
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
              className="folder-card glass-panel group hover:scale-105 transition-all cursor-pointer relative"
              onClick={() => window.location.href = `/explorer?espaceId=${espace.id}`}
            >
              <div className="absolute top-4 right-4 z-10">
                <button
                  className="p-1 hover:bg-white/10 rounded-full text-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOptionsMenu(showOptionsMenu === espace.id ? null : espace.id);
                  }}
                >
                  <MoreVertical size={18} />
                </button>
                {showOptionsMenu === espace.id && (
                  <div className="absolute right-0 mt-1 bg-secondary/90 backdrop-blur-xl border border-white/10 rounded-xl p-1 shadow-2xl min-w-[140px] z-20">
                    <button
                      className="w-full flex items-center gap-2 p-2 hover:bg-white/10 rounded-lg text-xs"
                      onClick={(e) => { e.stopPropagation(); openRenameModal(espace); }}
                    >
                      <Pencil size={14} /> Renommer
                    </button>
                    <button
                      className="w-full flex items-center gap-2 p-2 hover:bg-red-500/20 text-red-400 rounded-lg text-xs"
                      onClick={(e) => { e.stopPropagation(); setShowDeleteModal(espace); setShowOptionsMenu(null); }}
                    >
                      <Trash2 size={14} /> Supprimer
                    </button>
                  </div>
                )}
              </div>
              <div className="folder-icon blue">
                <FolderOpen size={40} />
              </div>
              <div className="folder-name">{espace.name}</div>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-secondary">
                <span className="flex items-center gap-1"><Users size={12} /> {(espace.users?.length || 0) + 1}</span>
                {espace.created_at && (
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(espace.created_at).toLocaleDateString()}
                  </span>
                )}
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Nouvel Espace</h2>
              <button onClick={() => setShowModal(false)} className="text-secondary hover:text-white"><X size={20} /></button>
            </div>
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

      {/* Modal Renommage */}
      {showRenameModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowRenameModal(null)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Renommer l'espace</h2>
              <button onClick={() => setShowRenameModal(null)} className="text-secondary hover:text-white"><X size={20} /></button>
            </div>
            <div className="input-group mb-6">
              <label className="input-label">Nouveau nom</label>
              <input
                type="text"
                className="input-field"
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <button type="button" className="btn btn-secondary flex-1" onClick={() => setShowRenameModal(null)}>Annuler</button>
              <button
                type="button"
                className="btn btn-primary flex-1"
                onClick={handleRename}
                disabled={!newName.trim() || newName === showRenameModal.name}
              >
                <Check size={18} /> Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmation Suppression */}
      {showDeleteModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => !isDeleting && setShowDeleteModal(null)}>
          <div className="modal-content glass-panel max-w-sm text-center" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h2 className="text-xl font-bold mb-2">Supprimer l'espace ?</h2>
            <p className="text-secondary text-sm mb-8">
              L'espace <strong>"{showDeleteModal.name}"</strong> sera définitivement supprimé.
            </p>
            <div className="flex gap-4">
              <button
                className="btn btn-secondary flex-1"
                onClick={() => setShowDeleteModal(null)}
                disabled={!!isDeleting}
              >
                Annuler
              </button>
              <button
                className="btn bg-red-500 hover:bg-red-600 text-white flex-1"
                onClick={handleDelete}
                disabled={!!isDeleting}
              >
                {isDeleting ? <Loader2 size={18} className="animate-spin" /> : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Espaces;
