import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Download, X, Loader2, RefreshCw, CheckCircle } from 'lucide-react';

const CURRENT_VERSION_CODE = 101; // 1.0.1

type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error';

interface UpdateInfo {
  version?: string;
  version_name?: string;
  download_url?: string;
  releaseNotes?: string;
  releaseDate?: string;
}

const UpdateChecker = () => {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [isVisible, setIsVisible] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for updates via API on component mount
    checkForUpdate();

    // Listen for auto-updater events from Electron
    if (window.arlong?.updater) {
      window.arlong.updater.onUpdateAvailable((info) => {
        setUpdateInfo(info);
        setStatus('available');
        setIsVisible(true);
      });

      window.arlong.updater.onDownloadProgress((progress: number) => {
        setStatus('downloading');
        setDownloadProgress(Math.round(progress));
      });

      window.arlong.updater.onUpdateDownloaded(() => {
        setStatus('ready');
      });

      window.arlong.updater.onError((err) => {
        setStatus('error');
        setError(err);
      });
    }
  }, []);

  const checkForUpdate = async () => {
    setStatus('checking');
    try {
      // First try the native auto-updater
      if (window.arlong?.updater) {
        const result = await window.arlong.updater.checkForUpdates();
        if (result.hasUpdate) {
          setUpdateInfo(result);
          setStatus('available');
          setIsVisible(true);
          return;
        }
      }

      // Fallback to API check
      const res = await api.get('/versions/latest?platform=desktop');
      if (res.data.success && res.data.data) {
        const latest = res.data.data;
        if (latest.version_code > CURRENT_VERSION_CODE) {
          setUpdateInfo({
            version: latest.version_name,
            version_name: latest.version_name,
            download_url: latest.download_url,
            releaseNotes: latest.notes,
            releaseDate: latest.created_at
          });
          setStatus('available');
          setIsVisible(true);
        } else {
          setStatus('idle');
        }
      }
    } catch (err) {
      console.error('Update check failed:', err);
      setStatus('idle');
    }
  };

  const handleDownload = async () => {
    if (window.arlong?.updater) {
      setStatus('downloading');
      try {
        await window.arlong.updater.downloadUpdate();
      } catch (err) {
        setStatus('error');
        setError('Erreur lors du téléchargement');
      }
    } else if (updateInfo?.download_url) {
      // Fallback: open download URL in browser
      window.open(updateInfo.download_url, '_blank');
    }
  };

  const handleInstall = () => {
    if (window.arlong?.updater) {
      window.arlong.updater.quitAndInstall();
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="update-banner animate-slide-up">
      <div className="update-content">
        <span className="update-badge">
          {status === 'checking' && <Loader2 size={14} className="animate-spin" />}
          {status === 'downloading' && <Loader2 size={14} className="animate-spin" />}
          {status === 'ready' && <CheckCircle size={14} />}
          {status === 'available' && <RefreshCw size={14} />}
          {status === 'error' && <X size={14} />}
          <span className="ml-2">
            {status === 'checking' && 'Vérification...'}
            {status === 'downloading' && `Téléchargement ${downloadProgress}%`}
            {status === 'ready' && 'Prêt à installer'}
            {status === 'available' && 'Mise à jour disponible'}
            {status === 'error' && 'Erreur'}
            {status === 'idle' && 'Mise à jour'}
          </span>
        </span>
        <span className="update-text">
          {updateInfo?.version_name || updateInfo?.version ? (
            <>Version <strong>{updateInfo.version_name || updateInfo.version}</strong> disponible</>
          ) : (
            'Une nouvelle version est disponible'
          )}
          {status === 'downloading' && (
            <span className="ml-2">({downloadProgress}%)</span>
          )}
          {error && <span className="text-red-400 ml-2">{error}</span>}
        </span>
      </div>
      <div className="update-actions">
        {status === 'available' && (
          <>
            <button onClick={handleDownload} className="btn btn-primary btn-sm">
              <Download size={14} /> Télécharger
            </button>
            {updateInfo?.download_url && (
              <a
                href={updateInfo.download_url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
              >
                Site web
              </a>
            )}
          </>
        )}
        {status === 'downloading' && (
          <button className="btn btn-secondary btn-sm" disabled>
            <Loader2 size={14} className="animate-spin" /> {downloadProgress}%
          </button>
        )}
        {status === 'ready' && (
          <button onClick={handleInstall} className="btn btn-success btn-sm">
            <CheckCircle size={14} /> Installer maintenant
          </button>
        )}
        {(status === 'available' || status === 'error') && (
          <button onClick={handleDismiss} className="btn btn-ghost btn-sm">
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default UpdateChecker;
