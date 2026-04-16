const { google } = require('googleapis');
const { getGoogleAuth } = require('./auth.service.cjs');

const sendEmail = async ({ to, subject, body, attachment }) => {
  const auth = getGoogleAuth();
  const gmail = google.gmail({ version: 'v1', auth });

  // Construction simplifiée du message MIME
  const boundary = 'arlong_desktop_boundary';
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

  if (attachment) {
    message += '--' + boundary + '\r\n';
    message += 'Content-Type: ' + attachment.mimeType + '; name="' + attachment.name + '"\r\n';
    message += 'Content-Disposition: attachment; filename="' + attachment.name + '"\r\n';
    message += 'Content-Transfer-Encoding: base64\r\n\r\n';
    message += attachment.content + '\r\n\r\n';
  }

  message += '--' + boundary + '--';

  const raw = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw }
  });
};

module.exports = { sendEmail };
