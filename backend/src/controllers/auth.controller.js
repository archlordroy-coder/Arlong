const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { google } = require('googleapis');
const crypto = require('crypto');

const ADMIN_EMAILS = new Set(['ravel@mboa.com', 'tchinda@mboa.com', 'william@mboa.com']);

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      const error = new Error('Nom, email et mot de passe requis');
      error.status = 400;
      throw error;
    }
    const isAdmin = ADMIN_EMAILS.has(email.toLowerCase());
    const { data: existingUser } = await supabase.from('User').select('id').eq('email', email).single();
    if (existingUser) {
      const error = new Error('Cet email est déjà utilisé');
      error.status = 409;
      throw error;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const { data: user, error: createError } = await supabase
      .from('User')
      .insert([{ 
        name, 
        email, 
        password: hashedPassword,
        isAdmin: isAdmin
      }])
      .select('id, name, email, avatar, isAdmin, createdAt')
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
      expiresIn: '30d',
    });

    res.status(201).json({ 
      success: true, 
      data: { 
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          avatar: user.avatar, 
          isAdmin: !!user.isAdmin,
          createdAt: user.createdAt 
        }, 
        token 
      } 
    });
    console.log("🔵 Register successful");
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { data: user, error: findError } = await supabase.from('User').select('*').eq('email', email).single();
    if (findError || !user) {
      const error = new Error('Identifiants incorrects');
      error.status = 401;
      throw error;
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const error = new Error('Identifiants incorrects');
      error.status = 401;
      throw error;
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
      expiresIn: '30d',
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          isAdmin: !!user.isAdmin
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const { data: user, error } = await supabase
      .from('User')
      .select('id, name, email, avatar, isAdmin, createdAt')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    // On renvoie les clés en camelCase pour le frontend
    const profile = {
        ...user,
        isAdmin: !!user.isAdmin,
        createdAt: user.createdAt
    };
    delete profile.createdAt;

    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const { data: user, error } = await supabase
      .from('User')
      .update({ name, avatar })
      .eq('id', req.user.id)
      .select('id, name, email, avatar, isAdmin, createdAt')
      .single();
    if (error) throw error;

    res.json({ 
        success: true, 
        data: { 
            ...user, 
            isAdmin: !!user.isAdmin,
            createdAt: user.createdAt 
        } 
    });
  } catch (error) {
    next(error);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    const { error } = await supabase.from('User').delete().eq('id', req.user.id);
    if (error) throw error;
    res.json({ success: true, message: 'Compte supprimé' });
  } catch (error) {
    next(error);
  }
};

const googleAuth = async (req, res, next) => {
  try {
    const { code, platform = 'web' } = req.body;
    const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production';
    const redirectUri = isProduction
      ? 'https://arlong-gamma.vercel.app/api/auth/google/callback'
      : (process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback');
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: googleUser } = await oauth2.userinfo.get();
    const { email, name, picture } = googleUser;
    const { data: existingUser } = await supabase.from('User').select('*').eq('email', email).single();
    let user;
    if (existingUser) {
      user = existingUser;

      // S'assurer que le statut admin est à jour pour les emails pré-configurés
      const isAdmin = ADMIN_EMAILS.has(email.toLowerCase());
      
      const updates = {};
      if (user.isAdmin !== isAdmin) {
        updates.isAdmin = isAdmin;
      }
      if (tokens.refresh_token) {
        updates.googleRefreshToken = tokens.refresh_token;
      }

      if (Object.keys(updates).length > 0) {
        const { data: updatedUser } = await supabase
          .from('User')
          .update(updates)
          .eq('id', user.id)
          .select('*')
          .single();
        if (updatedUser) user = updatedUser;
      }
    } else {
      const isAdmin = ADMIN_EMAILS.has(email.toLowerCase());
      const { data: newUser } = await supabase
        .from('User')
        .insert([{
          name: name || email.split('@')[0],
          email: email,
          password: Math.random().toString(36).slice(-10), // Google accounts don't use local password
          avatar: picture,
          isAdmin: isAdmin,
          googleRefreshToken: tokens.refresh_token
        }])
        .select('id, name, email, avatar, isAdmin, createdAt, googleRefreshToken')
        .single();
      user = newUser;
    }
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, data: { token, user } });
  } catch (error) {
    next(error);
  }
};

const getGoogleAuthUrl = async (req, res, next) => {
  try {
    const { platform = 'web' } = req.query;
    const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production';
    const redirectUri = isProduction
      ? 'https://arlong-gamma.vercel.app/api/auth/google/callback'
      : (process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback');
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/drive.file', 'openid'],
      state: `auth:${platform}`,
    });
    res.json({ success: true, url });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getProfile, updateProfile, deleteAccount, googleAuth, getGoogleAuthUrl };
