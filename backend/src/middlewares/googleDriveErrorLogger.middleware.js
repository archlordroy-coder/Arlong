/**
 * Middleware de logging détaillé pour les erreurs Google Drive
 * Capture et loggue toutes les erreurs liées à l'authentification et aux opérations Drive
 */

// Logger simple (remplace l'import externe)
const logger = {
  error: (msg, data) => console.error(`[ERROR] ${msg}`, data),
  warn: (msg, data) => console.warn(`[WARN] ${msg}`, data),
  info: (msg, data) => console.info(`[INFO] ${msg}`, data)
};

/**
 * Détermine si une erreur est liée à Google Drive
 */
const isGoogleDriveError = (error) => {
  if (!error) return false;
  
  const driveKeywords = [
    'google', 'drive', 'oauth', 'refresh_token', 'access_token',
    'gapi', 'googleapi', 'drive.file', 'authorization', 'credentials'
  ];
  
  const errorString = JSON.stringify(error).toLowerCase();
  return driveKeywords.some(keyword => errorString.includes(keyword));
};

/**
 * Extrait les informations pertinentes d'une erreur Google
 */
const extractGoogleErrorInfo = (error) => {
  const info = {
    type: 'UNKNOWN',
    code: null,
    message: error.message || 'No message',
    stack: error.stack || null,
    timestamp: new Date().toISOString(),
    requestId: Math.random().toString(36).substring(2, 15),
    endpoint: null,
    userId: null,
    action: null
  };

  // Détection du type d'erreur
  if (error.message?.includes('invalid_grant')) {
    info.type = 'INVALID_GRANT';
    info.code = 'TOKEN_EXPIRED_OR_REVOKED';
    info.description = 'Le refresh token a expiré ou été révoqué. L\'utilisateur doit se reconnecter.';
  } else if (error.message?.includes('insufficient_permissions')) {
    info.type = 'INSUFFICIENT_PERMISSIONS';
    info.code = 'PERMISSION_DENIED';
    info.description = 'Permissions insuffisantes pour accéder à Google Drive.';
  } else if (error.message?.includes('Rate Limit Exceeded')) {
    info.type = 'RATE_LIMIT';
    info.code = 'QUOTA_EXCEEDED';
    info.description = 'Quota Google Drive dépassé. Attendre avant de réessayer.';
  } else if (error.message?.includes('invalid_request')) {
    info.type = 'INVALID_REQUEST';
    info.code = 'BAD_REQUEST';
    info.description = 'Requête invalide vers l\'API Google.';
  } else if (error.message?.includes('unauthorized')) {
    info.type = 'UNAUTHORIZED';
    info.code = 'UNAUTHORIZED';
    info.description = 'Non autorisé. Token invalide ou manquant.';
  } else if (error.code === 'PGRST204' || error.message?.includes('column')) {
    info.type = 'DATABASE_SCHEMA';
    info.code = 'SCHEMA_ERROR';
    info.description = 'Erreur de schéma base de données. Vérifier les colonnes.';
  }

  return info;
};

/**
 * Middleware pour logger les erreurs Google Drive
 */
const googleDriveErrorLogger = (err, req, res, next) => {
  // Vérifier si c'est une erreur Google Drive
  if (isGoogleDriveError(err) || req.path.includes('google') || req.path.includes('drive')) {
    const errorInfo = extractGoogleErrorInfo(err);
    
    // Ajouter les informations de contexte
    errorInfo.endpoint = req.originalUrl || req.path;
    errorInfo.method = req.method;
    errorInfo.userId = req.user?.id || 'anonymous';
    errorInfo.ip = req.ip;
    errorInfo.userAgent = req.get('user-agent');
    
    // Déterminer l'action en cours
    if (req.path.includes('/callback')) {
      errorInfo.action = 'OAUTH_CALLBACK';
    } else if (req.path.includes('/url')) {
      errorInfo.action = 'GET_AUTH_URL';
    } else if (req.path.includes('/sync')) {
      errorInfo.action = 'SYNC_FILES';
    } else if (req.path.includes('/upload')) {
      errorInfo.action = 'UPLOAD_FILE';
    } else if (req.path.includes('/download')) {
      errorInfo.action = 'DOWNLOAD_FILE';
    }

    // Logger détaillé
    console.error('\n' + '='.repeat(80));
    console.error('🚨 ERREUR GOOGLE DRIVE DÉTECTÉE');
    console.error('='.repeat(80));
    console.error(`📋 Request ID: ${errorInfo.requestId}`);
    console.error(`⏰ Timestamp: ${errorInfo.timestamp}`);
    console.error(`🔧 Type: ${errorInfo.type}`);
    console.error(`🔢 Code: ${errorInfo.code}`);
    console.error(`📝 Action: ${errorInfo.action || 'UNKNOWN'}`);
    console.error(`🔗 Endpoint: ${errorInfo.method} ${errorInfo.endpoint}`);
    console.error(`👤 User ID: ${errorInfo.userId}`);
    console.error(`💬 Message: ${errorInfo.message}`);
    if (errorInfo.description) {
      console.error(`📖 Description: ${errorInfo.description}`);
    }
    console.error('\n🔍 Stack Trace:');
    console.error(errorInfo.stack || 'Non disponible');
    console.error('='.repeat(80) + '\n');

    // Logger aussi dans le fichier de logs
    if (logger && logger.error) {
      logger.error('Google Drive Error', {
        ...errorInfo,
        stack: undefined // Ne pas dupliquer la stack dans les logs structurés
      });
    }

    // Ajouter l'info à la réponse pour le debug (en développement uniquement)
    if (process.env.NODE_ENV === 'development') {
      err.googleDriveDebugInfo = {
        requestId: errorInfo.requestId,
        type: errorInfo.type,
        code: errorInfo.code,
        action: errorInfo.action
      };
    }
  }

  next(err);
};

/**
 * Fonction utilitaire pour logger manuellement une opération Google Drive
 */
const logGoogleDriveOperation = (operation, details) => {
  const timestamp = new Date().toISOString();
  const requestId = Math.random().toString(36).substring(2, 15);
  
  console.log('\n' + '-'.repeat(80));
  console.log(`🔵 GOOGLE DRIVE OPERATION: ${operation}`);
  console.log('-'.repeat(80));
  console.log(`📋 Request ID: ${requestId}`);
  console.log(`⏰ Timestamp: ${timestamp}`);
  console.log(`📊 Details:`, JSON.stringify(details, null, 2));
  console.log('-'.repeat(80) + '\n');
  
  return requestId;
};

/**
 * Middleware pour logger le début des opérations Google Drive
 */
const googleDriveRequestLogger = (req, res, next) => {
  if (req.path.includes('google') || req.path.includes('drive')) {
    const startTime = Date.now();
    
    console.log(`\n🌐 [${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    console.log(`   User: ${req.user?.id || 'anonymous'}`);
    console.log(`   IP: ${req.ip}`);
    
    // Intercepter la réponse
    const originalSend = res.send;
    res.send = function(body) {
      const duration = Date.now() - startTime;
      const status = res.statusCode;
      
      const icon = status >= 400 ? '❌' : status >= 300 ? '⚠️' : '✅';
      console.log(`${icon} [${duration}ms] Response ${status}\n`);
      
      return originalSend.call(this, body);
    };
  }
  next();
};

module.exports = {
  googleDriveErrorLogger,
  googleDriveRequestLogger,
  logGoogleDriveOperation,
  isGoogleDriveError,
  extractGoogleErrorInfo
};
