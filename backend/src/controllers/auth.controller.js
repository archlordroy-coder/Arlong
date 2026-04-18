const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { google } = require('googleapis');
const crypto = require('crypto');

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Nom, email et mot de passe requis' });
    }
    
    console.log('🔵 Register attempt:', { name, email: email?.substring(0, 3) + '***' });
    
    // Use maybeSingle() to avoid 406 error when no user found
    const { data: existingUser, error: findError } = await supabase.from('User').select('id').eq('email', email).maybeSingle();
    
    if (findError) {
      console.error('❌ Database error checking existing user:', findError);
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur base de données: ' + findError.message,
        details: 'Vérifiez que la table User existe'
      });
    }
    
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Cet email est déjà utilisé' });
    }
    
    console.log('🔵 Creating new user...');
    const hashedPassword = await bcrypt.hash(password, 10);
    const { data: user, error: createError } = await supabase
      .from('User')
      .insert([{ 
        name, 
        email, 
        password: hashedPassword
      }])
      .select('*')
      .single();

    if (createError) {
      console.error('❌ Error creating user:', createError);
      return res.status(500).json({
        success: false,
        message: 'Erreur création utilisateur: ' + createError.message,
        details: 'Vérifiez que toutes les colonnes existent dans la table User'
      });
    }
    
    console.log('✅ User created:', user.id);

    // Initialisation données par défaut
    try {
      const { data: espace } = await supabase.from('Espace').insert([{ name: 'Mon Coffre', createdById: user.id }]).select('id').single();
      if (espace) {
        await supabase.from('Dossier').insert([{ name: 'Général', espaceId: espace.id, createdById: user.id }]);
      }
    } catch (e) { console.error('Default data init fail', e); }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });

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
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { data: user, error } = await supabase.from('User').select('*').eq('email', email).single();
    
    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Identifiants incorrects' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Identifiants incorrects' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
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
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isAdmin: !!user.is_admin,
        createdAt: user.created_at,
        googleRefreshToken: user.google_refresh_token
      }
    });
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
      .select('*')
      .single();

    if (error) throw error;
    res.json({ success: true, data: user });
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

// Google Auth Logic
const getRedirectUri = () => {
  const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production';
  const rawUri = isProduction
    ? 'https://arlong-gamma.vercel.app/api/auth/google/callback'
    : (process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback');
  return rawUri.replace(/([^:])\/\//g, '$1/');
};

const googleAuth = async (req, res) => {
  try {
    console.log('🔵 Google Auth started');
    const { code, platform } = req.body;
    
    // Validation des credentials Google
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error('❌ Missing Google OAuth credentials');
      return res.status(500).json({ 
        success: false, 
        message: 'Configuration OAuth incomplète' 
      });
    }
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      getRedirectUri()
    );

    console.log('🔵 Exchanging code for tokens...');
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    console.log('🔵 Verifying ID token...');
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;
    
    console.log('🔵 Google user:', { email, name, googleId });
    
    // Vérifier si l'utilisateur existe déjà avec gestion d'erreur améliorée
    console.log('🔵 Checking existing user...');
    let { data: user, error: findError } = await supabase
      .from('User')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (findError) {
      console.error('❌ Database error when finding user:', findError);
      return res.status(500).json({
        success: false,
        message: 'Erreur base de données: ' + findError.message,
        details: 'Vérifiez que le schéma SQL est appliqué sur Supabase'
      });
    }

    if (user) {
      console.log('🔵 Existing user found, updating...');
      const updates = {
        name: user.name || name,
        avatar: user.avatar || picture
      };
      if (tokens.refresh_token) updates.google_refresh_token = tokens.refresh_token;
      
      const { error: updateError } = await supabase
        .from('User')
        .update(updates)
        .eq('id', user.id);
        
      if (updateError) {
        console.error('❌ Error updating user:', updateError);
      }
      
      // Re-fetch user
      const { data: updatedUser } = await supabase
        .from('User')
        .select('*')
        .eq('id', user.id)
        .single();
      user = updatedUser;
    } else {
      console.log('🔵 Creating new user...');
      const userData = {
        name: name || email.split('@')[0],
        email: email,
        password: crypto.randomBytes(16).toString('hex'),
        avatar: picture,
        google_refresh_token: tokens.refresh_token
      };

      console.log('🔵 Inserting user data...');
      const { data: newUser, error: insertError } = await supabase
        .from('User')
        .insert([userData])
        .select('*')
        .single();
        
      if (insertError) {
        console.error('❌ Error inserting user:', insertError);
        return res.status(500).json({
          success: false,
          message: 'Erreur création utilisateur: ' + insertError.message,
          details: 'Vérifiez que la table User existe avec toutes les colonnes requises'
        });
      }
      user = newUser;
      console.log('✅ User created successfully:', user.id);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email }, 
      process.env.JWT_SECRET, 
      { expiresIn: '30d' }
    );
    
    console.log('✅ Google Auth completed');
    res.json({ 
      success: true, 
      data: { 
        token, 
        user: { 
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          isAdmin: !!user.is_admin,
          googleRefreshToken: user.google_refresh_token,
          createdAt: user.created_at
        } 
      } 
    });
  } catch (err) {
    console.error('❌ Google Auth Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur Google Auth: ' + err.message,
      details: err.stack
    });
  }
};

const getGoogleAuthUrl = (req, res) => {
  const { platform } = req.query;
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    getRedirectUri()
  );

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/drive.file'
    ],
    state: `auth:${platform || 'web'}`,
    prompt: 'consent'
  });

  res.json({ success: true, url });
};

module.exports = { register, login, googleAuth, getGoogleAuthUrl, getProfile, updateProfile, deleteAccount };
