const { google } = require('googleapis');
const stream = require('stream');

const MBOADRIVE_FOLDER_NAME = 'Mboa Drive';

/**
 * Service Google Drive pour le stockage des documents
 * Chaque utilisateur possède son propre espace de stockage ("Mboa Drive" sur son compte Drive personnel)
 */
class GoogleDriveService {
  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID;
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    // Détermination dynamique de l'URL de redirection
    // Si on est sur Vercel ou que l'URL locale n'est pas définie, on utilise le domaine de production
    const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production';
    this.redirectUri = isProduction 
      ? 'https://arlong-gamma.vercel.app/api/auth/google/callback'
      : (process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback');
  }

  /**
   * Crée un client Drive sécurisé pour un utilisateur spécifique
   * @param {string} refreshToken - Le token de l'utilisateur stocké en BD
   */
  _getUserDriveClient(refreshToken) {
    if (!this.clientId || !this.clientSecret || !refreshToken) {
      throw new Error("L'intégration Google Drive n'est pas configurée pour cet utilisateur.");
    }

    const oauth2Client = new google.auth.OAuth2(this.clientId, this.clientSecret, this.redirectUri);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    return google.drive({ version: 'v3', auth: oauth2Client });
  }

  /**
   * S'assure qu'un chemin de dossiers existe sur Google Drive et retourne l'ID du dernier dossier.
   * @param {string} refreshToken 
   * @param {string[]} segments - ex: ['Mboa Drive', 'Espace A', 'Dossier 1']
   */
  async _ensurePath(refreshToken, segments) {
    const driveClient = this._getUserDriveClient(refreshToken);
    let parentId = null;

    for (const segmentName of segments) {
      const q = parentId 
        ? `name='${segmentName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
        : `name='${segmentName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

      const searchRes = await driveClient.files.list({
        q,
        fields: 'files(id, name)',
        spaces: 'drive',
      });

      if (searchRes.data.files && searchRes.data.files.length > 0) {
        parentId = searchRes.data.files[0].id;
      } else {
        // Créer le dossier s'il n'existe pas
        const createRes = await driveClient.files.create({
          requestBody: {
            name: segmentName,
            mimeType: 'application/vnd.google-apps.folder',
            ...(parentId && { parents: [parentId] })
          },
          fields: 'id',
        });
        parentId = createRes.data.id;
      }
    }

    return parentId;
  }

  /**
   * Upload un fichier vers le Google Drive de l'utilisateur avec un chemin précis
   * @param {Buffer} fileBuffer
   * @param {string} fileName
   * @param {string} mimeType
   * @param {string} refreshToken
   * @param {string[]} pathSegments - ex: ['Mboa Drive', 'Espace', 'Dossier']
   */
  async uploadFile(fileBuffer, fileName, mimeType, refreshToken, pathSegments = [MBOADRIVE_FOLDER_NAME]) {
    const driveClient = this._getUserDriveClient(refreshToken);
    const parentId = await this._ensurePath(refreshToken, pathSegments);

    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileBuffer);

    const fileMetadata = {
      name: fileName,
      parents: parentId ? [parentId] : [],
    };

    const media = {
      mimeType: mimeType,
      body: bufferStream,
    };

    const response = await driveClient.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink, webContentLink, mimeType, size',
    });

    // Rendre optionnellement le fichier consultable via le lien public généré
    await driveClient.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    return response.data;
  }

  /**
   * Télécharger un fichier depuis le profil de l'utilisateur
   */
  async downloadFile(fileId, refreshToken) {
    const driveClient = this._getUserDriveClient(refreshToken);

    const response = await driveClient.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    );

    return Buffer.from(response.data);
  }

  /**
   * Supprimer un fichier du Google Drive
   */
  async deleteFile(fileId, refreshToken) {
    const driveClient = this._getUserDriveClient(refreshToken);
    await driveClient.files.delete({ fileId });
  }

  /**
   * Obtenir les métadonnées pour affichage
   */
  async getFileMetadata(fileId, refreshToken) {
    const driveClient = this._getUserDriveClient(refreshToken);

    const response = await driveClient.files.get({
      fileId,
      fields: 'id, name, mimeType, size, webViewLink, webContentLink, createdTime',
    });

    return response.data;
  }

  /**
   * Génère l'URL d'autorisation OAuth2 envoyée au client pour attacher son compte
   * @param {string} userId - id interne pour sécuriser le callback (state)
   * @param {string} platform - plateforme d'origine (web, mobile, desktop)
   *
   * NOTE: Les scopes correspondent EXACTEMENT à ceux configurés dans
   * Google Cloud Console ( section "Accès aux données" ) :
   * - drive.file : Gérer les fichiers de l'application
   * - drive.appdata : Données de configuration
   * - drive.install : Connexion à Drive
   * - userinfo.email : Email utilisateur
   * - userinfo.profile : Informations profil
   * - openid : Authentification OpenID
   *
   * Tous ces scopes sont NON SENSIBLES/NON RESTREINTS.
   */
  getAuthUrl(userId, platform = 'web') {
    const oauth2Client = new google.auth.OAuth2(this.clientId, this.clientSecret, this.redirectUri);
    return oauth2Client.generateAuthUrl({
      access_type: 'offline', // Demande explicitement le refresh_token (pour background uploads)
      prompt: 'consent', // Force le consentement pour un nouveau refresh_token permanent
      scope: [
        'https://www.googleapis.com/auth/drive.file',      // Gérer les fichiers créés par l'app (NON SENSIBLE)
        'https://www.googleapis.com/auth/userinfo.email',  // Email utilisateur
        'https://www.googleapis.com/auth/userinfo.profile', // Profil utilisateur
        'openid'                                           // Authentification OpenID
      ],
      state: `${userId}:${platform}`, // On encode l'ID et la plateforme
    });
  }

  /**
   * Échange un code d'autorisation contre le refresh_token définitif de l'utilisateur
   */
  async getTokensFromCode(code) {
    const oauth2Client = new google.auth.OAuth2(this.clientId, this.clientSecret, this.redirectUri);
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  }
}

module.exports = new GoogleDriveService();
