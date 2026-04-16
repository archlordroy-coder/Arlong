// Type declarations for Electron preload APIs
declare global {
  interface Window {
    arlong: {
      // System
      getAppVersion: () => Promise<string>;
      onNetworkChange: (callback: (state: 'online' | 'offline') => void) => void;

      // Auth & Google
      google: {
        getStatus: () => Promise<{ connected: boolean; email?: string }>;
        connect: () => Promise<{ success: boolean; error?: string }>;
        disconnect: () => Promise<{ success: boolean }>;
        gmail: {
          send: (data: { to: string; subject: string; body: string }) => Promise<{ success: boolean }>;
          listInbox: (limit?: number) => Promise<any[]>;
        };
      };

      // Sharing
      share: {
        create: (data: any) => Promise<any>;
        listMine: () => Promise<any[]>;
      };

      // Files & Cache
      files: {
        compress: (data: any) => Promise<any>;
        decompress: (data: any) => Promise<any>;
        getQueueCount: () => Promise<number>;
      };

      // WhatsApp
      whatsapp: {
        connect: () => Promise<void>;
        getStatus: () => Promise<{ connected: boolean }>;
        getContacts: () => Promise<any[]>;
        sendFile: (data: any) => Promise<void>;
        onQR: (callback: (qr: string) => void) => void;
        onReady: (callback: () => void) => void;
      };

      // AI
      ai: {
        chat: (message: string, history: any[], context: any) => Promise<string>;
        photo: {
          describe: (archiveId: string) => Promise<string>;
          ocr: (archiveId: string) => Promise<string>;
        };
      };

      // Auto-updater
      updater?: {
        checkForUpdates: () => Promise<{ hasUpdate: boolean; version?: string; downloadUrl?: string; releaseDate?: string; releaseNotes?: string }>;
        downloadUpdate: () => Promise<void>;
        quitAndInstall: () => void;
        onUpdateAvailable: (callback: (info: { version: string; releaseDate?: string; releaseNotes?: string }) => void) => void;
        onDownloadProgress: (callback: (progress: number) => void) => void;
        onUpdateDownloaded: (callback: () => void) => void;
        onError: (callback: (error: string) => void) => void;
      };
    };
  }
}

export {};
