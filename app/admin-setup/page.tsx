import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc, 
  Timestamp, 
  limit 
} from 'firebase/firestore';
import { auth, db } from '../../lib/firebase/config';
import { handleFirestoreError, OperationType } from '../../lib/firebase/auth';
import { User as AppUser } from '../../types';
import { ShieldCheck, AlertTriangle, CheckCircle, Lock } from 'lucide-react';

export default function AdminSetupPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  
  const [isLocked, setIsLocked] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  // Check if an admin already exists in the system
  useEffect(() => {
    async function checkIfAdminExists() {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', '==', 'admin'), limit(1));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          setIsLocked(true);
        } else {
          setIsLocked(false);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de l'administrateur historique:", error);
        setIsLocked(false);
      }
    }
    checkIfAdminExists();
  }, []);

  const handleValidate = (): boolean => {
    if (!displayName.trim()) {
      setFormError('Le nom de l\'administrateur est requis.');
      return false;
    }
    if (!email.trim()) {
      setFormError('L\'adresse email est requise.');
      return false;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setFormError('L\'adresse email saisie est incorrecte.');
      return false;
    }
    if (!password || password.length < 8) {
      setFormError('Le mot de passe doit faire au moins 8 caractères.');
      return false;
    }
    if (!phone.trim()) {
      setFormError('Un numéro de téléphone de contact est requis.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (isLocked) {
      setFormError('L\'accès à cette configuration est désactivé : un administrateur existe déjà.');
      return;
    }

    if (!handleValidate()) return;

    setLoading(true);

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'admin'), limit(1));
      const checkSnap = await getDocs(q);
      if (!checkSnap.empty) {
        setIsLocked(true);
        throw new Error('Un administrateur principal existe déjà dans le système.');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      try {
        await updateProfile(firebaseUser, { displayName });
      } catch (authProfileErr) {
        console.warn("Prénom non mis à jour:", authProfileErr);
      }

      const appUser: AppUser = {
        uid: firebaseUser.uid,
        email,
        displayName,
        role: 'admin',
        phone,
        createdAt: Timestamp.now()
      };

      const userPath = `users/${firebaseUser.uid}`;
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid), appUser);
      } catch (fsError) {
        handleFirestoreError(fsError, OperationType.WRITE, userPath);
      }

      setSuccess(true);
      setIsLocked(true);

      setTimeout(() => {
        navigate('/admin');
      }, 2000);

    } catch (err: any) {
      setFormError(err?.message || 'Une erreur inattendue s\'est produite.');
    } finally {
      setLoading(false);
    }
  };

  // 1. Écran de chargement initial
  if (isLocked === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0E1735]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-200 text-sm font-mono tracking-wide animate-pulse">Contrôle de sécurité d'initialisation en cours...</p>
        </div>
      </div>
    );
  }

  // 2. Écran Échec / Sécurité verrouillée
  if (isLocked === true && !success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0E1735] text-center p-4">
        <div className="p-8 bg-slate-900/60 border border-red-500/30 rounded-2xl max-w-md space-y-4 shadow-2xl backdrop-blur-md">
          <Lock className="w-12 h-12 text-red-500 mx-auto animate-pulse" />
          <h2 className="text-xl font-black text-white tracking-tight uppercase">Accès Impératif Bloqué</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Un administrateur principal possède déjà les droits sur ce projet Firestore. Par mesure de cybersécurité, cette page d'initialisation unique est définitivement close.
          </p>
          <div className="pt-2">
            <button 
              type="button" 
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-red-950/40 cursor-pointer"
            >
              Aller vers la page de connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Formulaire principal d'initialisation
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0E1735] p-4">
      <div className="mb-6 text-center">
        <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-black tracking-tight mb-2 text-white">Initialisation Système</h1>
        <p className="text-slate-300 max-w-sm mx-auto text-sm leading-relaxed">
          Configurez l'unique compte d'administration racine pour gérer la plateforme de commandes au Bénin.
        </p>
      </div>

      <div className="w-full max-w-md bg-slate-900/70 border border-white/10 p-6 rounded-2xl shadow-2xl space-y-4 text-left backdrop-blur-md">
        
        <div className="text-xs text-amber-200 bg-amber-500/15 rounded-xl p-3.5 border border-amber-500/30 font-medium space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-450 uppercase tracking-wide">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Avertissement Critique</span>
          </div>
          <p className="text-slate-200 leading-relaxed">Cette action est irréversible. Dès validation, ce formulaire d'injection de compte racine s'autodétruira visuellement.</p>
        </div>

        {formError && (
          <div className="text-xs text-red-200 bg-red-500/15 border border-red-500/30 rounded-xl p-3 font-semibold">
            {formError}
          </div>
        )}

        {success && (
          <div className="text-xs text-emerald-200 bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-3.5 font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Compte d'administration initialisé avec succès ! Redirection...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">
              Nom Complet de l'Administrateur
            </label>
            <input 
              type="text" 
              placeholder="Ex: Chef d'Atelier Le Menu" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#0A0F24] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all" 
              disabled={loading || success}
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">
              Adresse Email Master
            </label>
            <input 
              type="email" 
              placeholder="admin@lemenuservice.bj" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#0A0F24] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all" 
              disabled={loading || success}
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">
              Contact Téléphonique Direct
            </label>
            <input 
              type="tel" 
              placeholder="+229 95 11 11 11" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#0A0F24] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all" 
              disabled={loading || success}
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">
              Mot de passe Sécurisé (Min. 8 car.)
            </label>
            <input 
              type="password" 
              placeholder="••••••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#0A0F24] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all" 
              disabled={loading || success}
              required
            />
          </div>

          <div className="pt-2">
            <button 
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-950/20 hover:-translate-y-0.5 active:translate-y-0 duration-150 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed cursor-pointer"
              disabled={loading || success}
            >
              {loading ? 'Création du profil racine...' : 'Créer l\'Administrateur Général'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}