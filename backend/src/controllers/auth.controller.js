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
      .insert([{ name, email, password: hashedPassword, is_admin: isAdmin }])
      .select('id, name, email, avatar, is_admin, created_at')
      .single();
    if (createError) throw createError;
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ success: true, data: { token, user } });
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
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...safeUser } = user;
    res.json({ success: true, data: { token, user: safeUser } });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const { data: user, error } = await supabase
      .from('User')
      .select('id, name, email, avatar, is_admin, created_at, google_refresh_token')
      .eq('id', req.user.id)
      .single();
    if (error) throw error;
    res.json({ success: true, data: user });
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
      .select('id, name, email, avatar, is_admin, created_at')
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
      if (tokens.refresh_token) {
        await supabase.from('User').update({ google_refresh_token: tokens.refresh_token }).eq('id', user.id);
      }
    } else {
      const isAdmin = ADMIN_EMAILS.has(email.toLowerCase());
      const { data: newUser } = await supabase
        .from('User')
        .insert([{ name: name || email.split('@')[0], email, password: crypto.randomBytes(16).toString('hex'), avatar: picture, google_refresh_token: tokens.refresh_token, is_admin: isAdmin }])
        .select('*')
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
