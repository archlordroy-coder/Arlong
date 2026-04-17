import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/client';
import { LogIn, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
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

const Login = () => {
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
        // If 503 error, Google auth is not configured
        setGoogleAuthAvailable(err.response?.status !== 503);
      }
    };
    checkGoogleAuth();
  }, []);

  // Handle Google OAuth callback — React StrictMode double-invoke guard
  const googleCallbackHandled = useRef(false);
  useEffect(() => {
    if (googleCallbackHandled.current) return;

    const handleGoogleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');

      if (code && state?.startsWith('auth:')) {
        googleCallbackHandled.current = true;
        setGoogleLoading(true);
        setError('');

        // Clean URL immediately to prevent re-use
        window.history.replaceState({}, document.title, '/login');

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
        }
      }
    };

    handleGoogleCallback();
  }, [login, navigate]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const { token, user } = res.data.data;
        login(token, user);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la connexion');
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
        // Redirect to Google OAuth page
        window.location.href = res.data.url;
      } else {
        setError('Impossible d\'initialiser la connexion Google');
        setGoogleLoading(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'initialisation Google');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-bg-shape shape-1"></div>
      <div className="auth-bg-shape shape-2"></div>
      
      <div className="glass-panel auth-card animate-slide-up">
        <button className="auth-back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
        </button>
        <div className="auth-header">
          <h1 className="auth-title">Mboa Drive</h1>
          <p className="auth-subtitle">Accédez à vos archives sécurisées</p>
        </div>

        {error && <div className="auth-error animate-fade-in">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group stagger-1 animate-fade-in" style={{opacity: 1}}>
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

          <div className="input-group stagger-2 animate-fade-in" style={{opacity: 1}}>
            <label className="input-label" htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary stagger-3 animate-fade-in"
            style={{opacity: 1, width: '100%', marginTop: '0.5rem'}}
            disabled={loading || googleLoading}
          >
            <span className="flex items-center gap-2" translate="no">
              <span className="flex shrink-0">
                {loading ? (
                  <Loader2 key="loader-icon" className="animate-spin" size={20} />
                ) : (
                  <LogIn key="login-icon" size={20} />
                )}
              </span>
              <span>{loading ? 'Connexion...' : 'Se connecter'}</span>
            </span>
          </button>

          {/* Google Sign In - Only show if configured on backend */}
          {googleAuthAvailable !== false && (
            <>
              <div className="auth-divider">
                <span>ou</span>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="btn btn-google stagger-4 animate-fade-in"
                style={{width: '100%'}}
                disabled={loading || googleLoading}
              >
                <span className="flex items-center gap-2" translate="no">
                  <span className="flex shrink-0">
                    {googleLoading ? (
                      <Loader2 key="google-loader" className="animate-spin" size={20} />
                    ) : (
                      <GoogleIcon />
                    )}
                  </span>
                  <span>{googleLoading ? 'Connexion...' : 'Se connecter avec Google'}</span>
                </span>
              </button>
            </>
          )}
        </form>

        {/* Google OAuth Tips */}
        <div className="auth-google-tips stagger-5 animate-fade-in">
          <div className="auth-google-tips-title">
            <AlertCircle size={16} />
            <span>Problème avec Google ?</span>
          </div>
          <div className="auth-google-tips-content">
            <p className="auth-google-tips-intro">
              <strong>� Réinitialiser la Connexion :</strong>
            </p>
            <ol className="auth-google-tips-steps">
              <li>Allez sur <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">https://myaccount.google.com/permissions</a></li>
              <li>Trouvez "Mboa Drive" ou votre app</li>
              <li>Cliquez sur l'app → "Supprimer l'accès"</li>
              <li>Revenez sur ce site et reconnectez-vous avec Google</li>
            </ol>
            <p className="auth-google-tips-note">
              💡 L'avertissement disparaîtra si les scopes sont non-sensibles.
            </p>
          </div>
        </div>

        <div className="auth-footer stagger-6 animate-fade-in" style={{opacity: 0}}>
          Pas encore de compte ? <Link to="/register">Créer un compte</Link>
        </div>

        <div className="auth-footer stagger-6 animate-fade-in" style={{opacity: 0, fontSize: '0.75rem', marginTop: '0.5rem'}}>
          <Link to="/privacy">Confidentialité</Link> • <Link to="/terms">Conditions d'utilisation</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
