import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderOpen, Camera, Clock, Settings } from 'lucide-react';
import './MobileLayout.css';

interface MobileLayoutProps {
  children: React.ReactNode;
}

const TABS = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Accueil'    },
  { to: '/espaces',    icon: FolderOpen,       label: 'Espaces'    },
  { to: '/scanner',    icon: Camera,           label: 'Scanner'    },
  { to: '/history',    icon: Clock,            label: 'Historique' },
  { to: '/settings',  icon: Settings,         label: 'Réglages'  },
];

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  return (
    <div className="mobile-layout">
      <main className="mobile-main">
        {children}
      </main>

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
                <Icon size={20} />
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
