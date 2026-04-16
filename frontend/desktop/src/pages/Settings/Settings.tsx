import WhatsAppQR from '../WhatsApp/WhatsAppQR';
import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../api/client';
import { User, Mail, Shield, Cloud, Save, Loader2, LogOut, Sun, Moon, RefreshCw, CheckCircle, Download } from 'lucide-react';
import './Settings.css';

const Settings = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [latestVersion, setLatestVersion] = useState<any>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [allowBeta, setAllowBeta] = useState(localStorage.getItem("mboadrive_beta") === "true");
  const [currentVersion, setCurrentVersion] = useState("");

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


  useEffect(() => {
    const fetchCurrentVersion = async () => {
      const v = await (window as any).arlong.getAppVersion();
      setCurrentVersion(v);
    };
    fetchCurrentVersion();
  }, []);

  const checkUpdate = async () => {
    setCheckingUpdate(true);
    try {
      const res = await api.get(`/versions/latest?platform=desktop&allow_beta=${allowBeta}`);
      if (res.data.success && res.data.data) {
        setLatestVersion(res.data.data);
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleUpdate = async () => {
    if ((window as any).arlong?.updater) {
      await (window as any).arlong.updater.downloadUpdate();
    } else {
      window.open(latestVersion.download_url, '_blank');
    }
  };

  const handleProfileUpdate = async (e: FormEvent) => {
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
      const res = await api.get('/auth/google/url?platform=desktop');
      if (res.data.success && res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (error) {
      alert('Erreur lors de la liaison au Drive');
    }
  };

  return (
    <div className='settings-container animate-fade-in'>
      <div className='settings-header mb-10'>
        <h1 className='text-3xl font-bold mb-2'>Paramètres de sécurité</h1>
        <p className='text-secondary'>Gérez votre identité et vos intégrations cloud.</p>
      </div>

      <div className='settings-grid grid md:grid-cols-[1.5fr_1fr] gap-8'>
        <div className='profile-section glass-panel p-8'>
          <div className='flex items-center gap-4 mb-8'>
            <div className='avatar-large bg-primary text-2xl font-bold flex items-center justify-center w-20 h-20 rounded-2xl shadow-lg ring-4 ring-primary/10'>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className='text-xl font-bold'>{user?.name}</h2>
              <p className='text-secondary text-sm'>{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleProfileUpdate}>
            <div className='input-group mb-6'>
              <label className='input-label flex items-center gap-2'>
                <User size={16} /> Nom complet
              </label>
              <input 
                type='text'
                className='input-field'
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className='input-group mb-8 opacity-50 cursor-not-allowed'>
              <label className='input-label flex items-center gap-2'>
                <Mail size={16} /> Adresse Email (Non modifiable)
              </label>
              <input 
                type='email'
                className='input-field'
                value={user?.email}
                disabled
              />
            </div>

            <button type='submit' className='btn btn-primary flex items-center gap-2' disabled={loading}>
              {loading ? <Loader2 size={18} className='animate-spin' /> : <Save size={18} />}
              <span>{success ? 'Profil mis à jour !' : 'Enregistrer les modifications'}</span>
            </button>
          </form>

          <div className='mt-10'>
             <WhatsAppQR />
          </div>
        </div>


          <div className='update-card glass-panel p-8'>
            <div className='flex items-center gap-4 mb-6'>
              <div className='p-3 bg-primary/10 rounded-xl text-primary'>
                <RefreshCw size={24} />
              </div>
              <h3 className='text-lg font-bold'>Mise à jour</h3>
            </div>
            <p className='text-sm text-secondary mb-4'>Version actuelle : <strong>{currentVersion}</strong></p>

            {latestVersion ? (
              <div className='animate-fade-in'>
                {latestVersion.version_name !== currentVersion ? (
                  <div className='bg-primary/10 p-4 rounded-lg mb-6 border border-primary/20'>
                    <h4 className='font-bold text-primary mb-1'>Nouvelle version disponible : {latestVersion.version_name}</h4>
                    <p className='text-xs text-secondary mb-4'>{latestVersion.notes}</p>
                    <button onClick={handleUpdate} className='btn btn-primary w-full flex items-center justify-center gap-2'>
                      <Download size={18} />
                      <span>Mettre à jour maintenant</span>
                    </button>
                  </div>
                ) : (
                  <div className='flex items-center gap-2 text-green-400 text-sm mb-6'>
                    <CheckCircle size={16} />
                    <span>Vous utilisez la dernière version</span>
                  </div>
                )}
              </div>
            ) : null}


            <div className='checkbox-group mb-6 p-4 bg-primary/5 rounded-xl border border-primary/10'>
              <div className='flex items-center justify-between w-full'>
                <div>
                  <label htmlFor='betaToggle' className='font-bold text-sm block mb-1'>Beta Updates</label>
                  <span className='text-xs text-secondary'>Recevoir les versions expérimentales</span>
                </div>
                <input
                  type='checkbox'
                  id='betaToggle'
                  className='toggle-switch'
                  checked={allowBeta}
                  onChange={e => {
                    const val = e.target.checked;
                    setAllowBeta(val);
                    localStorage.setItem("mboadrive_beta", String(val));
                  }}
                />
              </div>
            </div>
<button
              onClick={checkUpdate}
              className='btn btn-secondary w-full flex items-center justify-center gap-2'
              disabled={checkingUpdate}
            >
              {checkingUpdate ? <Loader2 size={18} className='animate-spin' /> : <RefreshCw size={18} />}
              <span>Vérifier les mises à jour</span>
            </button>
          </div>
<div className='integrations-section flex flex-col gap-8'>
          <div className='theme-card glass-panel p-8'>
            <div className='flex items-center gap-4 mb-6'>
              <div className='p-3 bg-primary/10 rounded-xl text-primary'>
                {theme === 'dark' ? <Moon size={24} /> : <Sun size={24} />}
              </div>
              <h3 className='text-lg font-bold'>Apparence</h3>
            </div>
            <p className='text-sm text-secondary mb-6'>Personnalisez le thème de l'application.</p>

            <div className='flex bg-black/20 p-1 rounded-xl'>
              <button
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${theme === 'dark' ? 'bg-primary text-white shadow-lg' : 'text-secondary hover:text-white'}`}
                onClick={() => theme !== 'dark' && toggleTheme()}
              >
                <Moon size={18} />
                <span className='font-medium'>Sombre</span>
              </button>
              <button
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${theme === 'light' ? 'bg-primary text-white shadow-lg' : 'text-secondary hover:text-white'}`}
                onClick={() => theme !== 'light' && toggleTheme()}
              >
                <Sun size={18} />
                <span className='font-medium'>Clair</span>
              </button>
            </div>
          </div>

          <div className='drive-link-card glass-panel p-8 border-l-4 border-warning'>
            <div className='flex items-center gap-4 mb-6'>
              <div className='p-3 bg-warning/10 rounded-xl text-warning'>
                <Cloud size={24} />
              </div>
              <h3 className='text-lg font-bold'>Google Drive</h3>
            </div>
            
            <p className='text-sm text-secondary mb-8'>
              L'intégration Drive permet de sauvegarder vos archives sur votre propre espace Google. 
              C'est indispensable pour le mode **synchronisé**.
            </p>

            {user?.googleRefreshToken ? (
              <div className='flex flex-col gap-4'>
                <div className='badge success py-3 px-4 flex items-center justify-center gap-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 font-bold uppercase text-xs tracking-widest'>
                  Compte Lié avec succès
                </div>
                <button className='btn btn-ghost text-secondary text-xs hover:text-white' onClick={linkDrive}>
                  Relier un autre compte
                </button>
              </div>
            ) : (
              <button onClick={linkDrive} className='btn btn-primary w-full flex items-center justify-center gap-2 py-4'>
                <Cloud size={20} />
                <span>Connecter mon Google Drive</span>
              </button>
            )}
          </div>

          <div className='security-card glass-panel p-8'>
            <div className='flex items-center gap-4 mb-6'>
              <div className='p-3 bg-primary/10 rounded-xl text-primary'>
                <Shield size={24} />
              </div>
              <h3 className='text-lg font-bold'>Sécurité</h3>
            </div>
            <p className='text-sm text-secondary mb-6'>Votre compte est protégé par chiffrement AES-256 à la source.</p>
            <button onClick={logout} className='btn btn-secondary w-full flex items-center justify-center gap-2'>
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
