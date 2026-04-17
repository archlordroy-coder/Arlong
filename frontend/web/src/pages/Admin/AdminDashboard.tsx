import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Trash2, Edit2, CheckCircle, XCircle, Download, Loader2, GitBranch, AlertCircle } from 'lucide-react';
import './Admin.css';

interface AppVersion {
  id: string;
  version_name: string;
  version_code: number;
  platform: string;
  download_url: string;
  notes: string;
  is_valid: boolean;
  is_beta: boolean;
  github_sha?: string;
  created_at: string;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVersion, setEditingVersion] = useState<AppVersion | null>(null);
  const [commits, setCommits] = useState<any[]>([]);
  const [loadingCommits, setLoadingCommits] = useState(false);

  const [formData, setFormData] = useState({
    version_name: '',
    version_code: 0,
    platform: 'desktop',
    download_url: '',
    notes: '',
    is_valid: true,
    is_beta: false,
    github_sha: ''
  });

  const isAdmin = !!user?.isAdmin;

  const fetchCommits = async () => {
    setLoadingCommits(true);
    try {
      const res = await api.get('/versions/github/commits');
      if (res.data.success) {
        setCommits(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching commits:', err);
    } finally {
      setLoadingCommits(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchVersions();
      fetchCommits();
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
      is_valid: v.is_valid,
      is_beta: v.is_beta || false,
      github_sha: v.github_sha || ''
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

  const getCheckStatus = (commit: any) => {
    if (!commit.check_runs) return null;
    const runs = commit.check_runs.check_runs;
    if (runs.length === 0) return null;

    const allSuccess = runs.every((run: any) => run.conclusion === 'success');
    const anyFailure = runs.some((run: any) => run.conclusion === 'failure' || run.conclusion === 'cancelled');

    if (allSuccess) return <CheckCircle size={14} className="text-success" title="Build OK" />;
    if (anyFailure) return <XCircle size={14} className="text-danger" title="Build Failed" />;
    return <Loader2 size={14} className="animate-spin text-warning" title="In Progress" />;
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Administration des Versions</h1>
        <button className="btn btn-primary" onClick={() => {
          setEditingVersion(null);
          setFormData({ version_name: '', version_code: 0, platform: 'desktop', download_url: '', notes: '', is_valid: true, is_beta: false, github_sha: '' });
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
                <th>Type</th>
                <th>Statut</th>
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
                    {v.is_beta ? (
                      <span className="badge beta">BETA</span>
                    ) : (
                      <span className="badge stable">STABLE</span>
                    )}
                  </td>
                  <td>
                    {v.is_valid ? (
                      <span className="status-valid text-success flex items-center gap-1"><CheckCircle size={16} /> Valide</span>
                    ) : (
                      <span className="status-invalid text-muted flex items-center gap-1"><XCircle size={16} /> Inactif</span>
                    )}
                  </td>
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

      <div className="admin-header mt-12">
        <h2 className="flex items-center gap-2"><GitBranch /> Commits GitHub Récents</h2>
        <button className="btn btn-sm btn-ghost" onClick={fetchCommits} disabled={loadingCommits}>
          <span className="flex items-center gap-2">
            {loadingCommits ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            Actualiser
          </span>
        </button>
      </div>

      <div className="glass-panel admin-table-container mt-4">
        {loadingCommits ? (
          <div className="flex justify-center p-10"><Loader2 className="animate-spin" size={30} /></div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Commit</th>
                <th>Status</th>
                <th>Auteur</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {commits.slice(0, 10).map(c => (
                <tr key={c.sha}>
                  <td>
                    <div className="flex flex-col">
                      <span className="font-bold truncate max-w-xs">{c.commit.message.split('\n')[0]}</span>
                      <span className="text-xs text-muted font-mono">{c.sha.substring(0, 7)}</span>
                    </div>
                  </td>
                  <td>{getCheckStatus(c) || <AlertCircle size={14} className="text-muted" title="No check info" />}</td>
                  <td>{c.commit.author.name}</td>
                  <td>{new Date(c.commit.author.date).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-sm btn-secondary" onClick={() => {
                      setEditingVersion(null);
                      setFormData({
                        version_name: 'v2.1.' + c.sha.substring(0, 7),
                        version_code: Math.floor(new Date(c.commit.author.date).getTime() / 1000),
                        platform: 'desktop',
                        download_url: 'https://github.com/archlordroy-coder/Arlong/releases/download/' + c.sha.substring(0, 7) + '/Arlong-Setup-' + c.sha.substring(0, 7) + '.exe',
                        notes: c.commit.message,
                        is_valid: true,
                        is_beta: true,
                        github_sha: c.sha
                      });
                      setIsModalOpen(true);
                    }}>
                      Déployer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="glass-panel admin-modal">
            <h2>{editingVersion ? 'Modifier la version' : 'Ajouter une version'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="input-group">
                  <label>Nom de version</label>
                  <input type="text" className="input-field" value={formData.version_name} onChange={e => setFormData({...formData, version_name: e.target.value})} placeholder="ex: 2.0.1" required />
                </div>
                <div className="input-group">
                  <label>Code de version (entier)</label>
                  <input type="number" className="input-field" value={formData.version_code} onChange={e => setFormData({...formData, version_code: parseInt(e.target.value)})} required />
                </div>
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

              <div className="flex gap-6 mt-4">
                <div className="checkbox-group">
                  <input type="checkbox" id="isValid" checked={formData.is_valid} onChange={e => setFormData({...formData, is_valid: e.target.checked})} />
                  <label htmlFor="isValid">Activée</label>
                </div>
                <div className="checkbox-group">
                  <input type="checkbox" id="isBeta" checked={formData.is_beta} onChange={e => setFormData({...formData, is_beta: e.target.checked})} />
                  <label htmlFor="isBeta" className="text-warning font-bold">Version BETA</label>
                </div>
              </div>

              <div className="modal-actions mt-8">
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

// Missing RefreshCw in lucide-react? Let's check imports.
import { RefreshCw } from 'lucide-react';

export default AdminDashboard;
