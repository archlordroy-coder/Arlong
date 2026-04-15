const { google } = require('googleapis');
const Store = require('electron-store');
const store = new Store();

const getGoogleAuth = () => {
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'arlong-desktop://oauth/callback'
  );

  const tokens = store.get('google_tokens');
  if (tokens) {
    oauth2.setCredentials(tokens);
  }

  oauth2.on('tokens', (t) => {
    const currentTokens = store.get('google_tokens') || {};
    store.set('google_tokens', { ...currentTokens, ...t });
  });

  return oauth2;
};

module.exports = { getGoogleAuth };
