import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, CheckCircle, RefreshCw } from 'lucide-react';

const WhatsAppQR = () => {
  const [qr, setQr] = useState<string>('');
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'ready'>('disconnected');

  useEffect(() => {
    // Écouter le flux QR via l'IPC exposé dans preload
    const handleQR = (qrData: string) => {
      setQr(qrData);
      setStatus('connecting');
    };

    const handleReady = () => {
      setStatus('ready');
      setQr('');
    };

    if (window.arlong?.whatsapp) {
      window.arlong.whatsapp.onQR(handleQR);
      window.arlong.whatsapp.onReady(handleReady);

      // Vérifier le statut initial
      window.arlong.whatsapp.getStatus().then((res: any) => {
        if (res.connected) setStatus('ready');
      });
    }
  }, []);

  const connect = async () => {
    setStatus('connecting');
    await window.arlong.whatsapp.connect();
  };

  return (
    <div className="whatsapp-qr-container glass-panel">
      <h3>Connexion WhatsApp</h3>

      {status === 'disconnected' && (
        <div className="flex flex-col items-center gap-4 p-6">
          <p>Scannez le code QR pour lier votre compte WhatsApp et activer l'envoi de documents.</p>
          <button className="btn btn-primary" onClick={connect}>
            Générer le Code QR
          </button>
        </div>
      )}

      {status === 'connecting' && (
        <div className="flex flex-col items-center gap-4 p-6">
          {qr ? (
            <div className="qr-wrapper bg-white p-4 rounded-lg">
              <QRCodeSVG value={qr} size={256} />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="animate-spin" size={40} />
              <p>Génération du code QR...</p>
            </div>
          )}
          <p className="text-sm opacity-70">Ouvrez WhatsApp sur votre téléphone {'>'} Appareils connectés</p>
        </div>
      )}

      {status === 'ready' && (
        <div className="flex flex-col items-center gap-4 p-6 text-success">
          <CheckCircle size={60} />
          <p>WhatsApp est connecté et prêt !</p>
          <button className="btn btn-ghost btn-sm" onClick={() => window.arlong.whatsapp.connect()}>
            <RefreshCw size={14} /> Reconnecter
          </button>
        </div>
      )}
    </div>
  );
};

export default WhatsAppQR;
