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
    

    const { data: existingUser } = await supabase.from('User').select('id').eq('email', email).single();
    
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Cet email est déjà utilisé' });
    }
    
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

    if (createError) throw createError;

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
          isAdmin: !!(user.isAdmin || user.is_admin),
          createdAt: user.createdAt || user.created_at 
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
          isAdmin: !!(user.isAdmin || user.is_admin),
          createdAt: user.createdAt || user.created_at
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
        isAdmin: !!(user.isAdmin || user.is_admin),
        createdAt: user.createdAt || user.created_at,
        googleRefreshToken: user.googleRefreshToken || user.google_refresh_token
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

// Google Auth Logic (simplified but robust)
const googleAuth = async (req, res) => {
  try {
    const { code, platform } = req.body;
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;
    console.log('🔵 Payload Google complet :', JSON.stringify(payload));
    
    let { data: user } = await supabase.from('User').select('*').eq('email', email).single();

    if (user) {
      // Mettre à jour le nom et l'avatar s'ils ont changé ou sont manquants
      const profileUpdates = {};
      if (!user.name || user.name === user.email.split('@')[0]) profileUpdates.name = name;
      if (!user.avatar) profileUpdates.avatar = picture;
      
      if (Object.keys(profileUpdates).length > 0) {
        await supabase.from('User').update(profileUpdates).eq('id', user.id);
        console.log(`🔵 Profil mis à jour pour ${user.email} (Nom/Avatar)`);
      }

      if (tokens.refresh_token) {
        console.log('🔵 Tentative de sauvegarde du Refresh Token...');
        const tokenCols = ['googleRefreshToken', 'google_refresh_token', 'googlerefreshtoken'];
        let success = false;
        
        for (const col of tokenCols) {
          try {
            const updateObj = {};
            updateObj[col] = tokens.refresh_token;
            const { error: updateError } = await supabase.from('User').update(updateObj).eq('id', user.id);
            
            if (!updateError) {
              console.log(`✅ Succès : Token sauvegardé dans la colonne '${col}'`);
              success = true;
              break;
            }
          } catch (e) {
            // Ignorer l'erreur et essayer la colonne suivante
          }
        }
        
        if (!success) {
          console.warn('⚠️ Attention : Aucune colonne de token reconnue. Liaison Drive impossible.');
        }
      }
    } else {

      const userData = {
        name: name || email.split('@')[0],
        email: email,
        password: crypto.randomBytes(16).toString('hex'),
        avatar: picture
      };

      // Tenter d'insérer avec le token, avec fallback si la colonne manque
      let { data: newUser, error } = await supabase.from('User').insert([{ ...userData, googleRefreshToken: tokens.refresh_token }]).select('*').single();
      
      if (error && error.code === 'PGRST204') {
        console.warn('⚠️ googleRefreshToken non trouvé lors de l\'insertion, essai avec google_refresh_token');
        const res2 = await supabase.from('User').insert([{ ...userData, google_refresh_token: tokens.refresh_token }]).select('*').single();
        newUser = res2.data;
        error = res2.error;
      }
      
      if (error && error.code === 'PGRST204') {
         console.warn('⚠️ Aucun champ de token trouvé, insertion sans token');
         const res3 = await supabase.from('User').insert([userData]).select('*').single();
         newUser = res3.data;
         error = res3.error;
      }

      if (error) throw error;
      user = newUser;
    }

    console.log(`✅ Authentification prête pour : ${user.email}`);
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ success: true, data: { token, user: { ...user, isAdmin: !!(user.isAdmin || user.is_admin) } } });
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const getGoogleAuthUrl = (req, res) => {
  const { platform } = req.query;
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
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
