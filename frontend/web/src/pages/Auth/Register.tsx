import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/client';
import { UserPlus, Loader2, ArrowLeft, AlertCircle, Shield, Lock, Cloud } from 'lucide-react';
import './Auth.css';

// Google logo SVG component
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// Left side branding component (shared with Login)
const BrandingSection = () => (
  <div className="auth-branding">
    <div className="auth-branding-content">
      <div className="auth-logo">
        <div className="auth-logo-icon">
          <Shield size={48} strokeWidth={1.5} />
        </div>
        <h1 className="auth-logo-text">Mboa Drive</h1>
      </div>
      
      <div className="auth-tagline">
        <h2>Rejoignez-nous</h2>
        <p>Créez votre compte et commencez à sécuriser vos archives dès aujourd'hui</p>
      </div>

      <div className="auth-features">
        <div className="auth-feature">
          <Lock size={24} />
          <span>Inscription gratuite</span>
        </div>
        <div className="auth-feature">
          <Cloud size={24} />
          <span>Stockage sécurisé</span>
        </div>
        <div className="auth-feature">
          <Shield size={24} />
          <span>Connexion Google</span>
        </div>
      </div>
    </div>
  </div>
);

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleAuthAvailable, setGoogleAuthAvailable] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Check if Google auth is configured on backend
  useEffect(() => {
    const checkGoogleAuth = async () => {
      try {
        const res = await api.get('/auth/google/login-url?platform=web');
        setGoogleAuthAvailable(res.data.success === true);
      } catch (err: any) {
        setGoogleAuthAvailable(err.response?.status !== 503);
      }
    };
    checkGoogleAuth();
  }, []);

  // Handle Google OAuth callback (same as Login)
  useEffect(() => {
    const handleGoogleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');

      if (code && state?.startsWith('auth:')) {
        setGoogleLoading(true);
        setError('');

        try {
          const res = await api.post('/auth/google/callback', { code, platform: 'web' });

          if (res.data.success) {
            const { token, user } = res.data.data;
            login(token, user);
            navigate('/dashboard');
          }
        } catch (err: any) {
          setError(err.response?.data?.message || 'Erreur lors de la connexion Google');
        } finally {
          setGoogleLoading(false);
          window.history.replaceState({}, document.title, '/register');
        }
      }
    };

    handleGoogleCallback();
  }, [login, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/register', { name, email, password });
      if (res.data.success) {
        const { token, user } = res.data.data;
        login(token, user);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');

    try {
      const res = await api.get('/auth/google/login-url?platform=web');

      if (res.data.success && res.data.url) {
        window.location.href = res.data.url;
      } else {
        setError('Impossible d\'initialiser l\'inscription Google');
        setGoogleLoading(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'initialisation Google');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="auth-split-container">
      {/* Left Side - Branding */}
      <BrandingSection />

      {/* Right Side - Form */}
      <div className="auth-form-section">
        <div className="auth-form-wrapper">
          <button className="auth-back-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
          </button>

          <div className="auth-form-header">
            <div className="auth-form-logo">
              <Shield size={32} />
              <span>Mboa Drive</span>
            </div>
            <h2>Créer un compte</h2>
            <p>Rejoignez Mboa Drive dès maintenant</p>
          </div>

          {error && <div className="auth-error animate-fade-in">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label" htmlFor="name">Nom complet</label>
              <input
                id="name"
                type="text"
                className="input-field"
                placeholder="Jean Dupont"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="email">Adresse e-mail</label>
              <input
                id="email"
                type="email"
                className="input-field"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="password">Mot de passe</label>
              <input
                id="password"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || googleLoading}
            >
              <span className="flex items-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
                <span>{loading ? 'Création...' : 'Créer un compte'}</span>
              </span>
            </button>

            {googleAuthAvailable !== false && (
              <>
                <div className="auth-divider">
                  <span>ou</span>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="btn btn-google"
                  disabled={loading || googleLoading}
                >
                  <span className="flex items-center gap-2">
                    {googleLoading ? <Loader2 className="animate-spin" size={20} /> : <GoogleIcon />}
                    <span>{googleLoading ? 'Connexion...' : 'S\'inscrire avec Google'}</span>
                  </span>
                </button>
              </>
            )}
          </form>

          <div className="auth-google-tips">
            <div className="auth-google-tips-title">
              <AlertCircle size={16} />
              <span>Problème avec Google ?</span>
            </div>
            <div className="auth-google-tips-content">
              <p className="auth-google-tips-intro">
                <strong>Réinitialiser la Connexion :</strong>
              </p>
              <ol className="auth-google-tips-steps">
                <li>Allez sur <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">myaccount.google.com/permissions</a></li>
                <li>Trouvez "Mboa Drive"</li>
                <li>Cliquez → "Supprimer l'accès"</li>
                <li>Reconnectez-vous</li>
              </ol>
            </div>
          </div>

          <div className="auth-footer">
            Déjà un compte ? <Link to="/login">Se connecter</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
