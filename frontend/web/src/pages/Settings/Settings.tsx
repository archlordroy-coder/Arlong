import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/client';
import { User, Mail, Shield, Cloud, Save, Loader2, LogOut } from 'lucide-react';
import './Settings.css';

const Settings = () => {
  const { user, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
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

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      const res = await api.put('/auth/profile', { name });
      if (res.data.success) {
        setSuccess(true);
        // On pourrait recharger le contexte ici, mais le localStorage sera mis à jour au prochain refresh
      }
    } catch (error) {
      alert('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const linkDrive = async () => {
    try {
      const res = await api.get('/auth/google/url?platform=web');
      if (res.data.success && res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (error) {
      alert("Erreur lors de la liaison au Drive");
    }
  };

  return (
    <div className="settings-container animate-fade-in">
      <div className="settings-header mb-10">
        <h1 className="text-3xl font-bold mb-2">Paramètres de sécurité</h1>
        <p className="text-secondary">Gérez votre identité et vos intégrations cloud.</p>
      </div>

      <div className="settings-grid grid md:grid-cols-[1.5fr_1fr] gap-8">
        <div className="profile-section glass-panel p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="avatar-large bg-primary text-2xl font-bold flex items-center justify-center w-20 h-20 rounded-2xl shadow-lg ring-4 ring-primary/10">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold">{user?.name}</h2>
              <p className="text-secondary text-sm">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleUpdate}>
            <div className="input-group mb-6">
              <label className="input-label flex items-center gap-2">
                <User size={16} /> Nom complet
              </label>
              <input 
                type="text" 
                className="input-field" 
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="input-group mb-8 opacity-50 cursor-not-allowed">
              <label className="input-label flex items-center gap-2">
                <Mail size={16} /> Adresse Email (Non modifiable)
              </label>
              <input 
                type="email" 
                className="input-field" 
                value={user?.email}
                disabled
              />
            </div>

            <button type="submit" className="btn btn-primary flex items-center gap-2" disabled={loading}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              <span>{success ? 'Profil mis à jour !' : 'Enregistrer les modifications'}</span>
            </button>
          </form>
        </div>

        <div className="integrations-section flex flex-col gap-8">
          <div className="drive-link-card glass-panel p-8 border-l-4 border-warning">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-warning/10 rounded-xl text-warning">
                <Cloud size={24} />
              </div>
              <h3 className="text-lg font-bold">Google Drive</h3>
            </div>
            
            <p className="text-sm text-secondary mb-8">
              L'intégration Drive permet de sauvegarder vos archives sur votre propre espace Google. 
              C'est indispensable pour le mode **synchronisé**.
            </p>

            {user?.googleRefreshToken ? (
              <div className="flex flex-col gap-4">
                <div className="badge success py-3 px-4 flex items-center justify-center gap-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 font-bold uppercase text-xs tracking-widest">
                  Compte Lié avec succès
                </div>
                <button className="btn btn-ghost text-secondary text-xs hover:text-white" onClick={linkDrive}>
                  Relier un autre compte
                </button>
              </div>
            ) : (
              <button onClick={linkDrive} className="btn btn-primary w-full flex items-center justify-center gap-2 py-4">
                <Cloud size={20} />
                <span>Connecter mon Google Drive</span>
              </button>
            )}
          </div>

          <div className="security-card glass-panel p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-primary/10 rounded-xl text-primary">
                <Shield size={24} />
              </div>
              <h3 className="text-lg font-bold">Sécurité</h3>
            </div>
            <p className="text-sm text-secondary mb-6">Votre compte est protégé par chiffrement AES-256 à la source.</p>
            <button onClick={logout} className="btn btn-secondary w-full flex items-center justify-center gap-2">
              <LogOut size={18} />
              <span>Se déconnecter de l'appareil</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
