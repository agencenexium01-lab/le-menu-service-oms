import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, getUserProfile, logoutUser } from '../../../../lib/firebase/auth';
import { useAuth } from '../../../../hooks/useAuth'; // On importe le hook global
import { auth } from '../../../../lib/firebase/config';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';

export default function ProConnexionPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Destructuration de useAuth pour suivre le cycle de vie global
  const { userProfile, loading: authLoading } = useAuth();

  // Password reset state
  const [resetting, setResetting] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);

  const navigate = useNavigate();

  // Redirection automatique si une session saine et valide est détectée globalement
  useEffect(() => {
    if (!authLoading && userProfile) {
      if (userProfile.role === 'chef_point' && userProfile.active !== false && userProfile.branchId) {
        navigate(`/pro/point/${userProfile.branchId}`, { replace: true });
      } else if ((userProfile.role === 'super_admin' || userProfile.role === 'admin') && userProfile.active !== false) {
        navigate('/pro/proprietaire', { replace: true });
      }
    }
  }, [userProfile, authLoading, navigate]);

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
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');
    
    if (!handleValidate()) return;

    setLoading(true);
    try {
      await loginUser(email, password);
      
      const currentUser = auth.currentUser;
      if (currentUser) {
        const profile = await getUserProfile(currentUser.uid);
        if (!profile) {
          setFormError('Profil professionnel introuvable.');
          await logoutUser();
          return;
        }

        if (profile.role === 'client') {
          setFormError('Ce portail est réservé au personnel Le Menu Service.');
          await logoutUser();
          return;
        } 
        
        if (profile.active === false) {
          setFormError('Votre accès a été désactivé. Veuillez contacter l\'administrateur.');
          await logoutUser();
          return;
        }

        if (profile.role === 'chef_point' && !profile.branchId) {
          setFormError('Erreur d\'affectation : Votre compte n\'est lié à aucun siège.');
          await logoutUser();
          return;
        }

        setSuccessMessage('Authentification réussie. Synchronisation du tableau de bord...');
        // La redirection est maintenant gérée de manière sûre par le useEffect ci-dessus
        
      } else {
        setFormError('Erreur lors de la récupération de la session.');
      }
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setFormError('Identifiants incorrects. Veuillez vérifier votre email et mot de passe.');
      } else {
        setFormError(err.message || 'Une erreur est survenue lors de la connexion.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');
    if (!resetEmail.trim()) {
      setFormError('Veuillez saisir votre adresse email pour la réinitialisation.');
      return;
    }

    setResetting(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setSuccessMessage('Un email de réinitialisation de mot de passe a été envoyé à l\'adresse indiquée.');
      setShowResetModal(false);
    } catch (err: any) {
      setFormError(err.message || 'Erreur lors de l\'envoi de l\'email de réinitialisation.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A1128] text-white p-4 font-sans">
      <div className="w-full max-w-md text-center mb-6">
        <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white mb-1 uppercase">Espace Professionnel</h1>
        <p className="text-slate-400 text-xs tracking-wide font-medium">
          Le Menu Service OMS — Console d'Impression Bénin
        </p>
      </div>

      <div className="w-full max-w-md bg-[#111A36]/80 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-2xl space-y-5">
        {formError && (
          <div className="text-xs text-red-200 bg-red-500/15 border border-red-500/20 rounded-xl p-3.5 font-semibold leading-relaxed animate-fade-in">
            {formError}
          </div>
        )}

        {successMessage && (
          <div className="text-xs text-green-200 bg-green-500/15 border border-green-500/20 rounded-xl p-3.5 font-semibold animate-fade-in">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">
              Identifiant Professionnel (Email)
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="email" 
                placeholder="collaborateur@lemenuservice.bj" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0A1128] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all duration-150" 
                disabled={loading}
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                Mot de passe
              </label>
              <button 
                type="button" 
                onClick={() => {
                  setResetEmail(email);
                  setShowResetModal(true);
                }}
                className="text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors"
              >
                Oublié ?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-[#0A1128] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all duration-150" 
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-950/20 hover:-translate-y-0.5 active:translate-y-0 duration-150 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Vérification...</span>
                </>
              ) : (
                <span>Accéder à la console</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#111A36] rounded-2xl border border-white/10 p-6 shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-white tracking-tight">Réinitialisation sécurisée</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Saisissez l'email de votre compte collaborateur répertorié. Un lien de récupération vous sera transmis.
            </p>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <input 
                type="email" 
                placeholder="collaborateur@lemenuservice.bj" 
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0A1128] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                required
              />
              <div className="flex justify-end gap-2 text-xs font-bold uppercase tracking-wider">
                <button 
                  type="button" 
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors cursor-pointer"
                  disabled={resetting}
                >
                  {resetting ? 'Envoi...' : 'Envoyer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}