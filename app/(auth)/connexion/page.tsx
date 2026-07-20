import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, getUserProfile } from '../../../lib/firebase/auth';
import { auth } from '../../../lib/firebase/config';

export default function ConnexionPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const handleValidate = (): boolean => {
    if (!email.trim()) {
      setFormError('L\'adresse email est obligatoire.');
      return false;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setFormError('L\'adresse email saisie est invalide.');
      return false;
    }
    if (!password) {
      setFormError('Le mot de passe est obligatoire.');
      return false;
    }
    if (password.length < 8) {
      setFormError('Le mot de passe doit contenir au moins 8 caractères.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    if (!handleValidate()) return;

    setLoading(true);
    try {
      await loginUser(email, password);
      
      const currentUser = auth.currentUser;
      if (currentUser) {
        const profile = await getUserProfile(currentUser.uid);
        if (!profile) {
          setFormError('Aucun profil associé à ce compte.');
          return;
        }

        // ROLE CHECKING ACCORDING TO TASK 3 GUIDELINES:
        if (profile.role === 'client') {
          setSuccess(true);
          setTimeout(() => {
            navigate('/client');
          }, 1000);
        } else if (profile.role === 'chef_point' || profile.role === 'super_admin' || profile.role === 'admin') {
          // Reject staff / admin access here
          setFormError('⛔ Ce portail est réservé aux clients. Si vous êtes un collaborateur, utilisez le lien qui vous a été fourni.');
          // Log out immediately from firebase auth to clean up dirty session
          const { logoutUser } = await import('../../../lib/firebase/auth');
          await logoutUser();
        } else {
          // fallback if role is undefined
          setSuccess(true);
          setTimeout(() => {
            navigate('/client');
          }, 1000);
        }
      } else {
        setFormError('Erreur lors de la récupération de la session.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Une erreur est survenue lors de la connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-2">
      <div className="mb-6">
        <img 
          src="/logo.png" 
          className="h-16 mx-auto mb-3" 
          alt="Le Menu Service" 
          referrerPolicy="no-referrer" 
          onError={(e) => {
            // Native fallback if image is missing
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1">Connexion à mon espace</h1>
        <p className="text-slate-400 max-w-sm mx-auto text-sm">
          Gérez vos commandes d'impression en ligne
        </p>
      </div>
      
      <div className="w-full max-w-md backdrop-blur-xl bg-white/5 p-6 rounded-2xl border border-white/10 shadow-xl space-y-4 text-left">
        {formError && (
          <div className="text-xs text-red-200 bg-red-500/15 border border-red-500/30 rounded-xl p-3 font-semibold leading-relaxed">
            {formError}
          </div>
        )}

        {success && (
          <div className="text-xs text-green-200 bg-green-500/15 border border-green-500/30 rounded-xl p-3 font-semibold">
            Connexion réussie ! Redirection en cours...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-350 mb-1.5 uppercase tracking-wider">Adresse Email</label>
            <input 
              type="email" 
              placeholder="client@lemenuservice.bj" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all duration-200" 
              disabled={loading}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-350 mb-1.5 uppercase tracking-wider">Mot de passe</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all duration-200" 
              disabled={loading}
              required
            />
          </div>
          <button 
            type="submit"
            className={`w-full py-2.5 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
              loading 
                ? 'bg-green-700 cursor-not-allowed opacity-80' 
                : 'bg-green-600 hover:bg-green-500 shadow-green-900/40 hover:-translate-y-0.5 duration-200 active:translate-y-0'
            }`}
            disabled={loading}
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-400">
          Pas encore de compte ?{' '}
          <Link to="/inscription" className="text-green-400 font-bold hover:underline">
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
}
