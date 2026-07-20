import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, getUserProfile } from '../../../lib/firebase/auth';
import { auth } from '../../../lib/firebase/config';

export default function LoginPage() {
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
        setSuccess(true);
        if (profile && profile.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/client');
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
      <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-white">Connexion OMS</h1>
      <p className="text-slate-400 max-w-sm mb-6 text-sm">
        Connectez-vous à votre espace Le Menu Service OMS pour gérer vos travaux d\'impression grand format au Bénin.
      </p>
      
      <div className="w-full max-w-md backdrop-blur-xl bg-white/5 p-6 rounded-2xl border border-white/10 shadow-xl space-y-4 text-left">
        <p className="text-xs text-yellow-300 bg-yellow-500/10 rounded-xl p-3 border border-yellow-500/20 font-medium">
          Authentification sécurisée par Firebase Auth & Firestore.
        </p>

        {formError && (
          <div className="text-xs text-red-200 bg-red-500/15 border border-red-500/30 rounded-xl p-3 font-semibold">
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
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Connexion en cours...
              </>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-400">
          Vous n\'avez pas encore de compte ?{' '}
          <Link to="/register" className="text-green-400 font-bold hover:underline">
            Inscrivez-vous ici
          </Link>
        </div>
      </div>
    </div>
  );
}
