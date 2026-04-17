import { useState, useEffect } from 'react';
import api from '../api/client';

interface AppVersion {
  id: string;
  versionName: string;
  versionCode: number;
  downloadUrl: string;
  notes: string;
}

declare global {
  interface Window {
    arlong: any;
  }
}

export const useUpdater = () => {
  const [updateAvailable, setUpdateAvailable] = useState<AppVersion | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentVersion, setCurrentVersion] = useState('1.0.1');

  useEffect(() => {
    if (window.arlong?.getAppVersion) {
      window.arlong.getAppVersion().then(setCurrentVersion);
    }
  }, []);

  const currentVersionCode = parseInt(currentVersion.replace(/\./g, ''));

  const checkUpdate = async () => {
    try {
      const res = await api.get('/versions/latest', { params: { platform: 'desktop' } });
      if (res.data.success && res.data.data) {
        const latest = res.data.data;
        if (latest.versionCode > currentVersionCode) {
          setUpdateAvailable(latest);
          return latest;
        }
      }
    } catch (err) {
      console.error('Update check failed:', err);
    }
    return null;
  };

  useEffect(() => {
    checkUpdate();
    const interval = setInterval(checkUpdate, 3600000);
    return () => clearInterval(interval);
  }, [currentVersionCode]);

  const startUpdate = async () => {
    if (!updateAvailable) return;
    
    setIsUpdating(true);
    setProgress(0);
    
    try {
      if (window.arlong?.updater) {
        // Mode Natif Electron (electron-updater)
        console.log('Starting native update...');
        window.arlong.updater.onDownloadProgress((p: any) => {
          setProgress(Math.round(p.percent));
        });
        
        window.arlong.updater.onUpdateDownloaded(() => {
          setProgress(100);
          setIsUpdating(false);
          if (confirm('Mise à jour prête. Redémarrer maintenant ?')) {
            window.arlong.updater.quitAndInstall();
          }
        });

        window.arlong.updater.onError((err: string) => {
          console.error('Updater error:', err);
          setIsUpdating(false);
          alert('Erreur lors de la mise à jour : ' + err);
        });

        await window.arlong.updater.downloadUpdate();
      } else {
        // Mode Simulation pour le web ou dev
        for (let i = 0; i <= 100; i += 5) {
          setProgress(i);
          await new Promise(r => setTimeout(r, 200));
        }
        alert('Mise à jour installée avec succès (Simulation). Redémarrage...');
        window.location.reload();
      }
    } catch (err) {
      console.error('Update failed:', err);
      setIsUpdating(false);
      alert('Échec de la mise à jour');
    }
  };

  return { updateAvailable, isUpdating, progress, startUpdate, currentVersion };
};
