import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Camera, CloudSync } from 'lucide-react';
import './Home.css';

const Home: React.FC = () => {
  return (
    <div className="home-container">
      <div className="home-bg-gradient"></div>
      
      <div className="home-content z-10 glass-panel animate-fade-in p-6 w-11/12 max-w-sm mx-auto mt-10 text-center rounded-3xl shadow-2xl relative">
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
          <div className="w-24 h-24 bg-primary/20 backdrop-blur-md rounded-full flex items-center justify-center p-3 border border-primary/30 shadow-[0_0_20px_rgba(6,182,212,0.5)]">
            <img src="/logo.png" alt="Arlong Logo" className="w-full h-full object-contain filter drop-shadow-md" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold mt-14 mb-4 text-white tracking-tight">
          ARLONG <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Mobile</span>
        </h1>
        
        <p className="text-sm text-gray-300 mb-8 leading-relaxed">
          Vos archives sécurisées dans votre poche.<br/>
          Numérisez et synchronisez en temps réel.
        </p>

        <div className="flex flex-col gap-4 mb-8 text-left">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
            <Camera className="w-8 h-8 text-primary flex-shrink-0" />
            <div>
              <h3 className="text-md font-bold text-white">Scanner Intégré</h3>
              <p className="text-xs text-gray-400">Numérisez vos documents instantanément.</p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
            <CloudSync className="w-8 h-8 text-secondary flex-shrink-0" />
            <div>
              <h3 className="text-md font-bold text-white">Synchro Drive</h3>
              <p className="text-xs text-gray-400">Directement dans votre espace cloud.</p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
            <Shield className="w-8 h-8 text-white/80 flex-shrink-0" />
            <div>
              <h3 className="text-md font-bold text-white">Coffre-fort</h3>
              <p className="text-xs text-gray-400">Verrouillé par chiffrement fort.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Link to="/login" className="btn btn-primary text-base px-6 py-3 w-full shadow-lg shadow-primary/30">
            Démarrer
          </Link>
          <div className="flex justify-center gap-4 text-xs text-gray-400 mt-2">
            <Link to="/privacy" className="hover:text-primary">Confidentialité</Link>
            <Link to="/terms" className="hover:text-primary">Conditions</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
