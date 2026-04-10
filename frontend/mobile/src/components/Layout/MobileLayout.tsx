import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Settings, Camera } from 'lucide-react';
import './MobileLayout.css';

interface MobileLayoutProps {
  children: React.ReactNode;
}

const TABS = [
  { to: '/dashboard', icon: Home, label: 'Accueil' },
  { to: '/scanner', icon: Camera, label: 'Scanner' },
  { to: '/settings', icon: Settings, label: 'Paramètres' },
];

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  return (
    <div className="mobile-layout">
      {/* Contenu principal */}
      <main className="mobile-main">
        {children}
      </main>

      {/* Barre de navigation en bas */}
      <nav className="mobile-bottom-nav">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `mobile-tab-item ${isActive ? 'active' : ''}`
              }
            >
              <div className="mobile-tab-icon-wrap">
                <Icon size={22} />
              </div>
              <span className="mobile-tab-label">{tab.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default MobileLayout;
