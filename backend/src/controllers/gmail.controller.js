const { google } = require('googleapis');
const supabase = require('../config/supabase');

/**
 * NOTE IMPORTANTE: Fonctionnalité Gmail désactivée par défaut
 *
 * Pour éviter le processus de vérification Google complexe (scopes restreints),
 * nous n'incluons pas le scope 'gmail.send' dans l'authentification OAuth standard.
 *
 * L'envoi d'emails via Gmail nécessite le scope restreint 'gmail.send' qui
 * provoque l'avertissement "Google n'a pas validé cette application".
 *
 * Alternatives recommandées:
 * 1. Utiliser un service d'email tiers (SendGrid, AWS SES, etc.)
 * 2. Créer un brouillon Gmail (scope 'gmail.compose' - non restreint)
 * 3. Demander une autorisation Gmail séparée uniquement si l'utilisateur
 *    active explicitement la fonctionnalité
 */

/**
 * Récupérer le client OAuth2 pour un utilisateur
 */
const getOAuth2Client = async (userId) => {
  const { data: user, error } = await supabase
    .from('User')
    .select('google_refresh_token')
    .eq('id', userId)
    .single();

  if (error || !user || !user.google_refresh_token) {
    throw new Error('Compte Google non lié');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: user.google_refresh_token
  });

  return oauth2Client;
};

/**
 * Envoyer un email avec pièces jointes
 * NOTE: Cette fonction nécessite le scope 'gmail.send' (RESTREINT).
 * Elle retourne une erreur si le token OAuth n'a pas les permissions Gmail.
 */
const sendEmailWithAttachments = async (req, res) => {
  try {
    // Vérifier si la fonctionnalité est disponible
    return res.status(403).json({
      success: false,
      message: "L'envoi d'emails via Gmail est temporairement désactivé pour maintenir une authentification sécurisée sans vérification Google. Utilisez le partage de liens Drive à la place.",
      alternative: "share_drive_link"
    });

    /* Code original commenté - nécessite scope 'gmail.send' (RESTREINT)
    const { to, subject, body, archiveIds, cc, bcc } = req.body;

    const oauth2Client = await getOAuth2Client(req.user.id);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    */

    // 1. Récupérer les métadonnées et le contenu des archives
    const attachments = [];
    if (archiveIds && archiveIds.length > 0) {
      for (const id of archiveIds) {
        // Récupérer les infos du document dans la BDD (on suppose que c'est stocké dans 'Document')
        const { data: doc, error } = await supabase
          .from('Document')
          .select('name, drive_id, mime_type')
          .eq('id', id)
          .single();

        if (doc) {
          // Télécharger le fichier depuis Google Drive
          const driveRes = await drive.files.get({
            fileId: doc.drive_id,
            alt: 'media'
          }, { responseType: 'arraybuffer' });

          attachments.push({
            filename: doc.name,
            content: Buffer.from(driveRes.data).toString('base64'),
            contentType: doc.mime_type
          });
        }
      }
    }

    // 2. Construire le message MIME (format simpliste ici, idéalement utiliser une lib comme mimetext)
    const boundary = 'arlong_boundary';
    let message = [
      'Content-Type: multipart/mixed; boundary=' + boundary,
      'MIME-Version: 1.0',
      'To: ' + (Array.isArray(to) ? to.join(', ') : to),
      'Subject: ' + subject,
      ''
    ].join('\r\n');

    message += '--' + boundary + '\r\n';
    message += 'Content-Type: text/html; charset="UTF-8"\r\n\r\n';
    message += body + '\r\n\r\n';

    for (const att of attachments) {
      message += '--' + boundary + '\r\n';
      message += 'Content-Type: ' + att.contentType + '; name="' + att.filename + '"\r\n';
      message += 'Content-Description: ' + att.filename + '\r\n';
      message += 'Content-Disposition: attachment; filename="' + att.filename + '"; size=' + att.content.length + ';\r\n';
      message += 'Content-Transfer-Encoding: base64\r\n\r\n';
      message += att.content + '\r\n\r\n';
    }
    message += '--' + boundary + '--';

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error('SendEmail error:', error);
    res.status(500).json({ success: false, message: error.message || "Erreur lors de l'envoi de l'email" });
  }
};

/**
 * Lister les emails (Inbox)
 * NOTE: Désactivé car nécessite des scopes Gmail restreints
 */
const listInbox = async (req, res) => {
  return res.status(403).json({
    success: false,
    message: "L'accès à Gmail est temporairement désactivé pour maintenir une authentification sécurisée."
  });
};

module.exports = {
  sendEmailWithAttachments,
  listInbox
};
