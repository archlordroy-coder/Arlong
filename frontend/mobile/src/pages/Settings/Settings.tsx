import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/client';
import { User, Mail, Shield, Cloud, Save, Loader2, LogOut } from 'lucide-react';
import './Settings.css';

const Settings = () => {
  const { user, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  React.useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'drive-linked' && event.data?.success) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.success) {
            window.location.reload(); 
          }
        } catch (error) {}
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      const res = await api.put('/auth/profile', { name });
      if (res.data.success) {
        setSuccess(true);
      }
    } catch (error) {
      alert('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const linkDrive = async () => {
    try {
      const res = await api.get('/auth/google/url?platform=mobile');
      if (res.data.success && res.data.url) {
        window.open(res.data.url, 'ArlongDriveAuth', 'width=500,height=650');
      }
    } catch (error) {
      alert("Erreur lors de la liaison au Drive");
    }
  };

  return (
    <div className="mobile-settings">
      <header className="mobile-settings-header">
        <h1 className="mobile-settings-title">Paramètres</h1>
        <p className="mobile-settings-subtitle">Identité et intégrations</p>
      </header>

      <section className="mobile-settings-section">
        <div className="mobile-settings-card">
          <div className="mobile-profile-overview">
            <div className="mobile-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="mobile-profile-info">
              <h2>{user?.name}</h2>
              <p>{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="mobile-settings-form">
            <div className="mobile-form-group">
              <label><User size={14} /> Nom complet</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="mobile-form-group disabled">
              <label><Mail size={14} /> Email (Fixe)</label>
              <input 
                type="email" 
                value={user?.email}
                disabled
              />
            </div>

            <button type="submit" className="mobile-btn-save" disabled={loading}>
              {loading ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
              <span>{success ? 'Profil mis à jour !' : 'Enregistrer'}</span>
            </button>
          </form>
        </div>
      </section>

      <section className="mobile-settings-section">
        <div className="mobile-settings-card drive-card">
          <div className="mobile-card-header">
            <div className="mobile-card-icon warning">
              <Cloud size={20} />
            </div>
            <h3>Google Drive</h3>
          </div>
          
          <p className="mobile-card-desc">
            Indispensable pour archiver vos documents et activer la synchronisation.
          </p>

          {user?.googleRefreshToken ? (
            <div className="mobile-drive-status">
              <div className="mobile-badge-success">
                Compte Lié
              </div>
              <button className="mobile-btn-text" onClick={linkDrive}>
                Modifier le compte
              </button>
            </div>
          ) : (
            <button onClick={linkDrive} className="mobile-btn-connect">
              <Cloud size={18} />
              <span>Connecter Drive</span>
            </button>
          )}
        </div>
      </section>

      <section className="mobile-settings-section">
        <div className="mobile-settings-card">
          <div className="mobile-card-header">
            <div className="mobile-card-icon primary">
              <Shield size={20} />
            </div>
            <h3>Sécurité</h3>
          </div>
          <p className="mobile-card-desc">Chiffrement de bout en bout activé (AES-256).</p>
          <button onClick={logout} className="mobile-btn-logout">
            <LogOut size={16} />
            <span>Déconnexion</span>
          </button>
        </div>
      </section>
    </div>
  );
};

export default Settings;
