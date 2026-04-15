import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Download, X } from 'lucide-react';

const CURRENT_VERSION_CODE = 101; // 1.0.1

const UpdateChecker = () => {
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const res = await api.get('/versions/latest?platform=desktop');
        if (res.data.success && res.data.data) {
          const latest = res.data.data;
          if (latest.version_code > CURRENT_VERSION_CODE) {
            setUpdateInfo(latest);
            setIsVisible(true);
          }
        }
      } catch (err) {
        console.error('Update check failed:', err);
      }
    };

    checkUpdate();
  }, []);

  if (!isVisible || !updateInfo) return null;

  return (
    <div className="update-banner animate-slide-up">
      <div className="update-content">
        <span className="update-badge">Mise à jour disponible</span>
        <span className="update-text">
          Une nouvelle version <strong>{updateInfo.version_name}</strong> est disponible !
        </span>
      </div>
      <div className="update-actions">
        <a href={updateInfo.download_url} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
          <Download size={14} /> Télécharger
        </a>
        <button onClick={() => setIsVisible(false)} className="btn btn-ghost btn-sm">
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default UpdateChecker;
