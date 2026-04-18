const { google } = require('googleapis');
const stream = require('stream');

const MBOADRIVE_FOLDER_NAME = 'Mboa Drive';

/**
 * Service Google Drive pour le stockage des documents
 */
class GoogleDriveService {
  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID;
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  }

  getRedirectUri() {
    const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production';
    const rawUri = isProduction
      ? 'https://arlong-gamma.vercel.app/api/auth/google/callback'
      : (process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback');
    return rawUri.replace(/([^:])\/\//g, '$1/');
  }

  _getUserDriveClient(refreshToken) {
    if (!this.clientId || !this.clientSecret || !refreshToken) {
      throw new Error("L'intégration Google Drive n'est pas configurée pour cet utilisateur.");
    }

    const oauth2Client = new google.auth.OAuth2(this.clientId, this.clientSecret, this.getRedirectUri());
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    return google.drive({ version: 'v3', auth: oauth2Client });
  }

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

    await driveClient.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    return response.data;
  }

  async downloadFile(fileId, refreshToken) {
    const driveClient = this._getUserDriveClient(refreshToken);

    const response = await driveClient.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    );

    return Buffer.from(response.data);
  }

  async deleteFile(fileId, refreshToken) {
    const driveClient = this._getUserDriveClient(refreshToken);
    await driveClient.files.delete({ fileId });
  }

  async getFileMetadata(fileId, refreshToken) {
    const driveClient = this._getUserDriveClient(refreshToken);

    const response = await driveClient.files.get({
      fileId,
      fields: 'id, name, mimeType, size, webViewLink, webContentLink, createdTime',
    });

    return response.data;
  }

  getAuthUrl(userId, platform = 'web') {
    const oauth2Client = new google.auth.OAuth2(this.clientId, this.clientSecret, this.getRedirectUri());
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'openid'
      ],
      state: `${userId}:${platform}`,
    });
  }

  async getTokensFromCode(code) {
    const oauth2Client = new google.auth.OAuth2(this.clientId, this.clientSecret, this.getRedirectUri());
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  }
}

module.exports = new GoogleDriveService();
