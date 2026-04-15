import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Trash2, Edit2, CheckCircle, XCircle, Download, ExternalLink, Loader2 } from 'lucide-react';
import './Admin.css';

interface AppVersion {
  id: string;
  version_name: string;
  version_code: number;
  platform: string;
  download_url: string;
  notes: string;
  is_valid: boolean;
  created_at: string;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVersion, setEditingVersion] = useState<AppVersion | null>(null);

  const [formData, setFormData] = useState({
    version_name: '',
    version_code: 0,
    platform: 'desktop',
    download_url: '',
    notes: '',
    is_valid: true
  });

  const adminEmails = ['ravel@mboa.com', 'tchinda@mboa.com', 'william@mboa.com'];
  const isAdmin = user && adminEmails.includes(user.email);

  useEffect(() => {
    if (isAdmin) {
      fetchVersions();
    }
  }, [isAdmin]);

  const fetchVersions = async () => {
    try {
      const res = await api.get('/versions');
      if (res.data.success) {
        setVersions(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching versions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVersion) {
        await api.put(`/versions/${editingVersion.id}`, formData);
      } else {
        await api.post('/versions', formData);
      }
      setIsModalOpen(false);
      setEditingVersion(null);
      fetchVersions();
    } catch (err) {
      alert('Erreur lors de l’opération');
    }
  };

  const deleteVersion = async (id: string) => {
    if (window.confirm('Supprimer cette version ?')) {
      try {
        await api.delete(`/versions/${id}`);
        fetchVersions();
      } catch (err) {
        alert('Erreur lors de la suppression');
      }
    }
  };

  const openEdit = (v: AppVersion) => {
    setEditingVersion(v);
    setFormData({
      version_name: v.version_name,
      version_code: v.version_code,
      platform: v.platform,
      download_url: v.download_url,
      notes: v.notes,
      is_valid: v.is_valid
    });
    setIsModalOpen(true);
  };

  if (!isAdmin) {
    return (
      <div className="admin-forbidden">
        <h1>403 - Accès Interdit</h1>
        <p>Vous n'avez pas les droits pour accéder à cette page.</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Administration des Versions</h1>
        <button className="btn btn-primary" onClick={() => {
          setEditingVersion(null);
          setFormData({ version_name: '', version_code: 0, platform: 'desktop', download_url: '', notes: '', is_valid: true });
          setIsModalOpen(true);
        }}>
          <Plus size={20} /> Nouvelle Version
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="animate-spin" size={40} /></div>
      ) : (
        <div className="glass-panel admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Version</th>
                <th>Plateforme</th>
                <th>Code</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {versions.map(v => (
                <tr key={v.id}>
                  <td><strong>{v.version_name}</strong></td>
                  <td><span className={`platform-badge ${v.platform}`}>{v.platform}</span></td>
                  <td>{v.version_code}</td>
                  <td>
                    {v.is_valid ? (
                      <span className="status-valid"><CheckCircle size={16} /> Valide</span>
                    ) : (
                      <span className="status-invalid"><XCircle size={16} /> Obsolète</span>
                    )}
                  </td>
                  <td>{new Date(v.created_at).toLocaleDateString()}</td>
                  <td className="admin-actions">
                    <button onClick={() => openEdit(v)} title="Modifier"><Edit2 size={18} /></button>
                    <button onClick={() => deleteVersion(v.id)} title="Supprimer" className="delete"><Trash2 size={18} /></button>
                    <a href={v.download_url} target="_blank" rel="noreferrer" title="Télécharger"><Download size={18} /></a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="glass-panel admin-modal">
            <h2>{editingVersion ? 'Modifier la version' : 'Ajouter une version'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Nom de version (ex: 2.0.0)</label>
                <input type="text" className="input-field" value={formData.version_name} onChange={e => setFormData({...formData, version_name: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>Code de version (entier, ex: 200)</label>
                <input type="number" className="input-field" value={formData.version_code} onChange={e => setFormData({...formData, version_code: parseInt(e.target.value)})} required />
              </div>
              <div className="input-group">
                <label>Plateforme</label>
                <select className="input-field" value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value})}>
                  <option value="desktop">Desktop (Windows/Linux)</option>
                  <option value="web">Web</option>
                  <option value="mobile">Mobile (Android)</option>
                </select>
              </div>
              <div className="input-group">
                <label>URL de téléchargement</label>
                <input type="url" className="input-field" value={formData.download_url} onChange={e => setFormData({...formData, download_url: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>Notes de version</label>
                <textarea className="input-field" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={3}></textarea>
              </div>
              <div className="checkbox-group">
                <input type="checkbox" id="isValid" checked={formData.is_valid} onChange={e => setFormData({...formData, is_valid: e.target.checked})} />
                <label htmlFor="isValid">Cette version est valide et recommandée</label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
