import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import './TopNavbar.css';

const TopNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // On ne montre pas le bouton retour si on est à la racine
  const canGoBack = location.pathname !== '/';

  return (
    <nav className="top-navbar">
      <div className="top-navbar-left">
        {canGoBack && (
          <button 
            type="button"
            className="top-navbar-back" 
            onClick={() => navigate(-1)}
            aria-label="Retour"
          >
            <ChevronLeft size={24} />
            <span className="top-navbar-back-label">Retour</span>
          </button>
        )}
      </div>
      
      <div className="top-navbar-center" onClick={() => navigate('/')}>
        <img src="/logo.png" alt="Arlong Logo" className="top-navbar-logo" />
        <span className="top-navbar-title">ARLONG</span>
      </div>

      <div className="top-navbar-right">
        {/* Placeholder div to perfectly center the middle block */}
      </div>
    </nav>
  );
};

export default TopNavbar;
