import React from 'react';
import './SplashScreen.css';

const SplashScreen: React.FC = () => {
  return (
    <div className="splash-screen">
      <div className="splash-logo-container">
        <img src="/logo.png" alt="Arlong Logo" className="splash-logo" />
      </div>
      <div className="splash-text">Arlong</div>
      <div className="progress-container">
        <div className="progress-bar"></div>
      </div>
    </div>
  );
};

export default SplashScreen;
