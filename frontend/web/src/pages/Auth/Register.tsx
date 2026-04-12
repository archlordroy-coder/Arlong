import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/client';
import { UserPlus, Loader2, ArrowLeft } from 'lucide-react';
import './Auth.css';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

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
          <p className="auth-subtitle">Créer un nouveau coffre-fort</p>
        </div>

        {error && <div className="auth-error animate-fade-in">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group stagger-1 animate-fade-in" style={{opacity: 0}}>
            <label className="input-label" htmlFor="name">Nom complet</label>
            <input
              id="name"
              type="text"
              className="input-field"
              placeholder="Votre nom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>

          <div className="input-group stagger-1 animate-fade-in" style={{opacity: 0}}>
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

          <div className="input-group stagger-2 animate-fade-in" style={{opacity: 0}}>
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
            className="btn btn-primary stagger-3 animate-fade-in" 
            style={{opacity: 0, width: '100%', marginTop: '0.5rem'}}
            disabled={loading}
          >
            <span className="flex items-center gap-2" translate="no">
              <span className="flex shrink-0">
                {loading ? (
                  <Loader2 key="reg-loader-icon" className="animate-spin" size={20} />
                ) : (
                  <UserPlus key="reg-user-icon" size={20} />
                )}
              </span>
              <span>{loading ? 'Inscription...' : "S'inscrire"}</span>
            </span>
          </button>
        </form>

        <div className="auth-footer stagger-3 animate-fade-in" style={{opacity: 0}}>
          Vous avez déjà un compte ? <Link to="/login">Se connecter</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
