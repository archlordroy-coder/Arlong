import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, Loader2, ArrowLeft, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/client';
import './Auth.css';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

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

        // Clean URL immediately to prevent re-use of the code
        window.history.replaceState({}, document.title, '/register');

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
    setError('');

    if (!name.trim()) {
      setError('Le nom est requis');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', { name: name.trim(), email, password });
      login(res.data.data.token, res.data.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const res = await api.get('/auth/google/login-url?platform=web');
      if (res.data.success && res.data.url) {
        window.location.href = res.data.url;
      } else {
        setError('Impossible d\'initialiser la connexion Google');
        setGoogleLoading(false);
      }
    } catch (err) {
      setError('Impossible d\'initialiser la connexion Google');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass-panel animate-slide-up">
        <button className="back-home" onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
        </button>
        <div className="auth-header">
          <div className="auth-logo">
            <Shield size={32} className="text-primary" />
          </div>
          <h2>Créer un compte</h2>
          <p>Rejoignez MboaDrive pour sécuriser vos archives.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label className="input-label">Nom complet</label>
            <div className="input-with-icon">
              <User size={18} />
              <input
                type="text"
                className="input-field"
                placeholder="Jean Dupont"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Email</label>
            <div className="input-with-icon">
              <Mail size={18} />
              <input
                type="email"
                className="input-field"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Mot de passe</label>
            <div className="input-with-icon">
              <Lock size={18} />
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={6}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Confirmer le mot de passe</label>
            <div className="input-with-icon">
              <Lock size={18} />
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading || googleLoading}>
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Créer mon compte'}
          </button>

          <div className="auth-divider"><span>ou</span></div>

          <button
            type="button"
            onClick={handleGoogleRegister}
            className="btn btn-secondary w-full"
            disabled={loading || googleLoading}
          >
            {googleLoading ? <Loader2 className="animate-spin" size={20} /> : 'S\'inscrire avec Google'}
          </button>
        </form>

        <div className="auth-footer">
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
