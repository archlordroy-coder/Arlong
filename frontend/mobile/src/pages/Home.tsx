import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Cloud, Smartphone, Monitor } from 'lucide-react';
import './Home.css';

const Home: React.FC = () => {
  return (
    <div className="home-container">
      {/* Arrière-plan animé */}
      <div className="home-bg-gradient"></div>
      
      <div className="home-content z-10 glass-panel animate-fade-in p-10 max-w-4xl mx-auto mt-20 text-center rounded-3xl shadow-2xl relative">
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
          <div className="w-32 h-32 bg-primary/20 backdrop-blur-md rounded-full flex items-center justify-center p-3 border border-primary/30 shadow-[0_0_30px_rgba(6,182,212,0.5)]">
            <img src="/logo.png" alt="Arlong Logo" className="w-full h-full object-contain filter drop-shadow-md" />
          </div>
        </div>

        <h1 className="text-5xl font-extrabold mt-16 mb-6 text-white tracking-tight">
          Bienvenue sur <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">ARLONG</span>
        </h1>
        
        <p className="text-xl text-gray-300 mb-12 leading-relaxed">
          La plateforme ultime de gestion d'archives sécurisée. <br />
          Synchronisez, protégez et accédez à vos documents de n'importe où.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
            <Shield className="w-10 h-10 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Chiffrement AES</h3>
            <p className="text-sm text-gray-400">Sécurité militaire de bout en bout pour vos fichiers.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
            <Cloud className="w-10 h-10 text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Google Drive</h3>
            <p className="text-sm text-gray-400">Synchronisation directe avec votre propre Drive.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
            <div className="flex justify-center gap-2 mb-4">
              <Monitor className="w-8 h-8 text-white/80" />
              <Smartphone className="w-8 h-8 text-white/80" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Multiplateforme</h3>
            <p className="text-sm text-gray-400">Disponible sur Web, Windows, Linux et Android.</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          <Link to="/login" className="btn btn-primary text-lg px-8 py-4 w-full md:w-auto shadow-lg shadow-primary/30 hover:scale-105 transition-transform">
            Accéder à mon espace
          </Link>
          <div className="flex gap-4 text-sm text-gray-400">
            <Link to="/privacy" className="hover:text-primary transition-colors">Confidentialité</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-primary transition-colors">Conditions</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
