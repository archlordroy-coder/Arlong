import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/client';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/register', { email, password });
      login(res.data.data.token, res.data.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
        const res = await api.get('/auth/google/url?platform=web');
        window.location.href = res.data.url;
    } catch (err) {
        setError('Impossible d\'initialiser la connexion Google');
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
          <p>Rejoignez-nous pour commencer à vos archives sécurisées.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
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
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : "S'inscrire"}
          </button>

          <div className="auth-divider"><span>ou</span></div>

          <button type="button" onClick={handleGoogleLogin} className="btn btn-secondary w-full">
            Continuer avec Google
          </button>
        </form>

        <div className="auth-footer">
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
