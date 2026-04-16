const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { google } = require('googleapis');

const GOOGLE_AUTH_PLATFORMS = new Set(['web', 'desktop']);

/**
 * Inscription d'un nouvel utilisateur
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log('🔵 Register called:', { name, email: email?.substring(0, 3) + '***' });

    if (!name || !email || !password) {
      console.log('❌ Missing fields');
      return res.status(400).json({ success: false, message: 'Tous les champs sont requis (name, email, password)' });
    }

    // Vérifier si l'utilisateur existe déjà
    console.log('🔵 Checking existing user...');
    const { data: existingUser, error: checkError } = await supabase
      .from('User')
      .select('email')
      .eq('email', email)
      .single();

    console.log('🔵 Check result:', { existingUser: !!existingUser, error: checkError?.message });

    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Cet email est déjà utilisé' });
    }

    console.log('🔵 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Création de l'utilisateur
    console.log('🔵 Creating user...');
    const { data: user, error: createError } = await supabase
      .from('User')
      .insert([{ name, email, password: hashedPassword }])
      .select('id, name, email, avatar, is_admin, created_at')
      .single();

    console.log('🔵 Create user result:', { user: !!user, error: createError?.message });

    if (createError) {
      console.error('❌ Create user error:', createError);
      throw createError;
    }

    // --- INITIALISATION DES DONNÉES PAR DÉFAUT ---
    console.log('🔵 Creating default space for user:', user.id);
    try {
    console.log("🔵 Initializing default data...");
      // 1. Créer un espace par défaut
      const { data: defaultEspace, error: espaceError } = await supabase
        .from('Espace')
        .insert([{ name: 'Mon Coffre', createdById: user.id }])
        .select('id')
        .single();
      
      console.log('🔵 Create space result:', { space: !!defaultEspace, error: espaceError?.message });

      if (!espaceError && defaultEspace) {
        // 2. Créer un dossier par défaut dans cet espace
        await supabase
          .from('Dossier')
          .insert([{ 
            name: 'Général', 
            espaceId: defaultEspace.id, 
            createdById: user.id 
          }]);
      }
    console.log("🔵 Default data initialization finished");
    } catch (initError) {
      console.error('Erreur lors de l’initialisation par défaut:', initError);
      // On continue quand même car l'utilisateur est bien créé
    }
    // ----------------------------------------------

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({ 
      success: true, 
      data: { 
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          avatar: user.avatar, 
          isAdmin: !!user.is_admin,
          createdAt: user.created_at 
        }, 
        token 
      } 
    });
    console.log("🔵 Register successful");
  } catch (error) {
    console.error('❌ Register error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'inscription: ' + error.message,
      error: error.message 
    });
  }
};

/**
 * Connexion d'un utilisateur
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
    }
    console.log("🔵 Login attempt for email:", email);

    const { data: user, error: findError } = await supabase
      .from('User')
      .select('*')
      .eq('email', email)
      .single();

    if (!user || findError) {
      return res.status(401).json({ success: false, message: 'Identifiants incorrects' });
    }
    console.log("🔵 User found, checking password...");

    // Compare password with bcrypt only
    let isValid = false;
    if (user.password && user.password.startsWith('$2')) {
      isValid = await bcrypt.compare(password, user.password);
    }
    
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Identifiants incorrects' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          isAdmin: !!user.is_admin
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la connexion' });
  }
};

/**
 * Obtenir le profil de l'utilisateur connecté
 */
const getProfile = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('User')
      .select('id, name, email, avatar, is_admin, google_refresh_token, created_at')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    // On renvoie les clés en camelCase pour le frontend
    const profile = {
        ...user,
        isAdmin: !!user.is_admin,
        googleRefreshToken: user.google_refresh_token,
        createdAt: user.created_at
    };
    delete profile.google_refresh_token;
    delete profile.created_at;

    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/**
 * Mettre à jour le profil
 */
const updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;

    const { data: user, error } = await supabase
      .from('User')
      .update({ name, avatar })
      .eq('id', req.user.id)
      .select('id, name, email, avatar, is_admin, created_at')
      .single();

    if (error) throw error;

    res.json({ 
        success: true, 
        data: { 
            ...user, 
            isAdmin: !!user.is_admin,
            createdAt: user.created_at 
        } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour' });
  }
};

/**
 * Supprimer le compte
 */
const deleteAccount = async (req, res) => {
  try {
    const { error } = await supabase
      .from('User')
      .delete()
      .eq('id', req.user.id);

    if (error) throw error;

    res.json({ success: true, message: 'Compte supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
  }
};

/**
 * Connexion/Inscription via Google OAuth
 * Crée un compte automatiquement si l'utilisateur n'existe pas
 */
const googleAuth = async (req, res) => {
  try {
    const { code, platform = 'web' } = req.body;
    console.log('🔵 Google Auth - Code received:', code?.substring(0, 10) + '...');
    console.log('🔵 Platform:', platform);

    if (!code) {
      return res.status(400).json({ success: false, message: 'Code Google manquant' });
    }

    if (!GOOGLE_AUTH_PLATFORMS.has(platform)) {
      return res.status(403).json({
        success: false,
        message: 'La connexion Google est disponible uniquement sur les versions web et desktop'
      });
    }

    // Vérifier les credentials
    console.log('🔵 GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing');
    console.log('🔵 GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
    console.log('🔵 GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI);

    // Configuration OAuth2

    const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production';
    const redirectUri = isProduction
      ? 'https://arlong-gamma.vercel.app/api/auth/google/callback'
      : (process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback');

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    // Échanger le code contre les tokens
    console.log('🔵 Exchanging code for tokens...');
    const { tokens } = await oauth2Client.getToken(code);
    console.log('✅ Tokens received:', tokens.access_token ? 'access_token OK' : 'no access_token');

    if (!tokens.access_token) {
      return res.status(400).json({ success: false, message: 'Échec de l\'authentification Google' });
    }

    // Obtenir les informations utilisateur Google
    console.log('🔵 Getting user info from Google...');
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: googleUser } = await oauth2.userinfo.get();
    console.log('✅ Google user:', googleUser.email);

    const { email, name, picture } = googleUser;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email Google non disponible' });
    }

    // Vérifier si l'utilisateur existe déjà
    console.log('🔵 Checking Supabase for existing user...');
    const { data: existingUser, error: findError } = await supabase
      .from('User')
      .select('*')
      .eq('email', email)
      .single();
    console.log('🔵 Supabase find result:', existingUser ? 'User found' : 'User not found', findError ? 'Error:' + findError.message : 'No error');

    let user;
    let isNewUser = false;

    if (existingUser) {
      // Utilisateur existant - mise à jour du token Google si nécessaire
      user = existingUser;

      // Mettre à jour le refresh token Google si fourni
      if (tokens.refresh_token) {
        await supabase
          .from('User')
          .update({ google_refresh_token: tokens.refresh_token })
          .eq('id', user.id);
      }
    } else {
      // Nouvel utilisateur - création automatique
      isNewUser = true;
      console.log('🔵 Creating new user from Google OAuth...');

      // Générer un mot de passe unique basé sur l'email + timestamp
      // Format: google_[email_hash]_[unique_id]
      // Cela permet d'identifier la méthode de connexion et d'avoir un mot de passe unique
      const crypto = require('crypto');
      const emailHash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex').substring(0, 8);
      const uniqueId = Date.now().toString(36).substring(0, 4);
      const defaultPassword = `google_${emailHash}_${uniqueId}`;
      
      console.log('🔵 Generated password for Google user:', `google_${emailHash}_****`);

      const { data: newUser, error: createError } = await supabase
        .from('User')
        .insert([{
          name: name || email.split('@')[0],
          email: email,
          password: defaultPassword,
          avatar: picture,
          google_refresh_token: tokens.refresh_token || null
        }])
        .select('id, name, email, avatar, is_admin, created_at')
        .single();
      
      console.log('🔵 Create user result:', newUser ? 'Success' : 'Failed', createError ? 'Error:' + createError.message : 'No error');

      if (createError) throw createError;

      user = newUser;

      // Créer les données par défaut (espace et dossier)
      try {
        console.log('🔵 Creating default Espace for user:', user.id);
        
        const espaceData = { name: 'Mon Coffre', createdById: user.id };
        console.log('🔵 Espace data:', espaceData);
        
        const { data: defaultEspace, error: espaceError } = await supabase
          .from('Espace')
          .insert([espaceData])
          .select('id')
          .single();
        
        console.log('🔵 Espace creation result:', { defaultEspace, espaceError });

        if (espaceError) {
          console.error('❌ Espace creation error:', espaceError);
          throw espaceError;
        }

        if (defaultEspace) {
          console.log('🔵 Creating default Dossier in espace:', defaultEspace.id);
          const { error: dossierError } = await supabase
            .from('Dossier')
            .insert([{
              name: 'Général',
              espaceId: defaultEspace.id,
              createdById: user.id
            }]);
          
          if (dossierError) {
            console.error('❌ Dossier creation error:', dossierError);
          }
        }
      } catch (initError) {
        console.error('❌ Erreur initialisation données par défaut:', initError);
        console.error('❌ Error details:', JSON.stringify(initError, null, 2));
      }
    }

    // Générer le JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Rediriger vers le frontend avec le token
    const redirectUrl = `${process.env.FRONTEND_URL || 'https://arlong-gamma.vercel.app'}/auth/callback?token=${token}&success=true`;
    console.log('🔵 Redirecting to frontend:', redirectUrl);
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('Google Auth error:', error);
    // Rediriger vers le frontend avec l'erreur
    const errorUrl = `${process.env.FRONTEND_URL || 'https://arlong-gamma.vercel.app'}/login?error=google_auth_failed&message=${encodeURIComponent(error.message)}`;
    res.redirect(errorUrl);
  }
};

/**
 * Génère l'URL d'autorisation Google pour connexion/inscription
 */
const getGoogleAuthUrl = async (req, res) => {
  try {
    const { platform = 'web' } = req.query;

    if (!GOOGLE_AUTH_PLATFORMS.has(platform)) {
      return res.status(403).json({
        success: false,
        message: 'La connexion Google est disponible uniquement sur les versions web et desktop'
      });
    }

    // Vérifier si les credentials Google sont configurés
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.log('⚠️ Google OAuth not configured - missing env vars');
      return res.status(200).json({
        success: false,
        message: 'La connexion Google n\'est pas configurée. Utilisez l\'authentification par email/mot de passe.',
        code: 'GOOGLE_AUTH_NOT_CONFIGURED',
        configured: false
      });
    }

    // Construire l'URI de redirection dynamiquement
    const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production';
    const redirectUri = isProduction
      ? 'https://arlong-gamma.vercel.app/api/auth/google/callback'
      : (process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback');
    console.log('🔵 Using redirect URI:', redirectUri);

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'openid'
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
      state: `auth:${platform}`,
      include_granted_scopes: true
    });

    res.json({ success: true, url });

  } catch (error) {
    console.error('Get Google Auth URL error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la génération de l\'URL' });
  }
};

module.exports = { register, login, googleAuth, getGoogleAuthUrl, getProfile, updateProfile, deleteAccount };
