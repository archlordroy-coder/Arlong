import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/client';
import { LogIn, Loader2, ArrowLeft } from 'lucide-react';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

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
        // Correction ici : res.data.data contient l'objet { user, token }
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
            disabled={loading}
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
        </form>

        <div className="auth-footer stagger-3 animate-fade-in" style={{opacity: 0}}>
          Pas encore de compte ? <Link to="/register">Créer un compte</Link>
        </div>

        <div className="auth-footer stagger-3 animate-fade-in" style={{opacity: 0, fontSize: '0.75rem', marginTop: '0.5rem'}}>
          <Link to="/privacy">Confidentialité</Link> • <Link to="/terms">Conditions d'utilisation</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
