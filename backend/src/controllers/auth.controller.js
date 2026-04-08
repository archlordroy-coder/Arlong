const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

/**
 * Inscription d'un nouvel utilisateur
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Tous les champs sont requis (name, email, password)' });
    }

    // Vérifier si l'utilisateur existe déjà
    const { data: existingUser, error: checkError } = await supabase
      .from('User')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Cet email est déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Création de l'utilisateur
    const { data: user, error: createError } = await supabase
      .from('User')
      .insert([{ name, email, password: hashedPassword }])
      .select('id, name, email, avatar, created_at')
      .single();

    if (createError) throw createError;

    // --- INITIALISATION DES DONNÉES PAR DÉFAUT ---
    try {
      // 1. Créer un espace par défaut
      const { data: defaultEspace, error: espaceError } = await supabase
        .from('Espace')
        .insert([{ name: 'Mon Coffre', createdById: user.id }])
        .select('id')
        .single();

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
    } catch (initError) {
      console.error('Erreur lors de l’initialisation par défaut:', initError);
      // On continue quand même car l'utilisateur est bien créé
    }
    // ----------------------------------------------

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    res.status(201).json({ 
      success: true, 
      data: { 
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          avatar: user.avatar, 
          createdAt: user.created_at 
        }, 
        token 
      } 
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'inscription' });
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

    const { data: user, error: findError } = await supabase
      .from('User')
      .select('*')
      .eq('email', email)
      .single();

    if (!user || findError) {
      return res.status(401).json({ success: false, message: 'Identifiants incorrects' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Identifiants incorrects' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    res.json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar },
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
      .select('id, name, email, avatar, google_refresh_token, created_at')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    // On renvoie les clés en camelCase pour le frontend
    const profile = {
        ...user,
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
      .select('id, name, email, avatar, created_at')
      .single();

    if (error) throw error;

    res.json({ 
        success: true, 
        data: { 
            ...user, 
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

module.exports = { register, login, getProfile, updateProfile, deleteAccount };
