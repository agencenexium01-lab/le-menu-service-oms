import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBranches } from '@/hooks/useBranches';
import { createStaffAccount, getStaffAccounts, toggleStaffActive } from '@/lib/firebase/firestore';
import { User as AppUser } from '@/types';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import firebaseConfig from '@/firebase-applet-config.json';
import { 
  Users, 
  UserPlus, 
  Loader2, 
  UserCheck, 
  UserX,
  Phone
} from 'lucide-react';

export default function ProprietaireEquipePage() {
  const { userProfile, loading: authLoading } = useAuth();
  const { branches, loading: branchesLoading } = useBranches();
  const navigate = useNavigate();

  const [staffList, setStaffList] = useState<AppUser[]>([]);
  const [staffLoading, setStaffLoading] = useState(true);

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [branchId, setBranchId] = useState('');
  
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Security Guard
  useEffect(() => {
    if (!authLoading) {
      if (!userProfile) {
        navigate('/pro/connexion');
      } else if (userProfile.role !== 'super_admin' && userProfile.role !== 'admin') {
        navigate('/pro/connexion');
      }
    }
  }, [userProfile, authLoading, navigate]);

  // Load staff list
  const fetchStaffData = async () => {
    setStaffLoading(true);
    try {
      const data = await getStaffAccounts();
      setStaffList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setStaffLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile && (userProfile.role === 'super_admin' || userProfile.role === 'admin')) {
      fetchStaffData();
    }
  }, [userProfile]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!displayName.trim() || !email.trim() || !phone.trim() || !password || !branchId) {
      setErrorMsg('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setActionLoading(true);
    let tempApp = null;
    try {
      // 1. Provision Auth account via safe secondary app
      tempApp = initializeApp(firebaseConfig, "temp-staff-creation-" + Date.now());
      const tempAuth = getAuth(tempApp);
      
      const userCred = await createUserWithEmailAndPassword(tempAuth, email, password);
      const uid = userCred.user.uid;
      
      await signOut(tempAuth);

      // 2. Provision Firestore profile document
      await createStaffAccount({
        uid,
        email,
        displayName,
        phone,
        branchId
      });

      setSuccessMsg(`✓ Collaborateur ${displayName} inscrit avec succès !`);
      
      // Reset form
      setDisplayName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setBranchId('');

      // Reload
      await fetchStaffData();
    } catch (err: any) {
      console.error("Staff addition error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorMsg("Cette adresse email est déjà utilisée par un autre utilisateur.");
      } else {
        setErrorMsg(err.message || "Une erreur est survenue lors de la création du compte.");
      }
    } finally {
      setActionLoading(false);
      if (tempApp) {
        try {
          await tempApp.delete();
        } catch (e) {
          console.error("Temporary app cleanup error:", e);
        }
      }
    }
  };

  const handleToggleActive = async (uid: string, currentStatus: boolean | undefined) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const newStatus = currentStatus === false ? true : false;
    try {
      await toggleStaffActive(uid, newStatus);
      setSuccessMsg(`Statut mis à jour avec succès.`);
      await fetchStaffData();
    } catch (err: any) {
      setErrorMsg(err.message || "Impossible de modifier le statut de l'utilisateur.");
    }
  };

  const getFormattedDate = (createdAt: any) => {
    if (!createdAt) return 'Non défini';
    const date = typeof createdAt.toDate === 'function' ? createdAt.toDate() : new Date(createdAt);
    return date.toLocaleDateString('fr-BJ', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (authLoading || !userProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
        <svg className="animate-spin h-6 w-6 text-blue-500 mb-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-xs font-mono text-slate-450">Chargement de la feuille des collaborateurs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8" id="owner-team-registre">
      {/* Title block */}
      <div>
        <span className="text-[10px] uppercase font-black text-blue-400 tracking-widest bg-blue-500/10 border border-blue-500/25 px-2.5 py-1 rounded-full mb-2 inline-block">
          ORGANISATION & EXPLOITATION
        </span>
        <h1 className="text-2xl font-black text-white tracking-tight">Gestion de l'Équipe & Collaborateurs</h1>
        <p className="text-xs text-slate-400 mt-1">
          Inscrivez de nouveaux chefs de sièges et activez ou désactivez instantanément leurs privilèges d'accès au système.
        </p>
      </div>

      {/* Alert widgets */}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-4 text-sm text-red-200" id="team-error-banner">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="bg-green-500/10 border border-green-500/25 rounded-xl p-4 text-sm text-green-200" id="team-success-banner">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Creation form */}
        <div className="bg-[#111A36] border border-white/10 rounded-2xl p-6 shadow-xl space-y-5 h-fit text-white">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5">
            <UserPlus className="w-5 h-5 text-blue-400" />
            <h2 className="font-black text-white text-base">Inscrire un Collaborateur</h2>
          </div>

          <form onSubmit={handleCreateStaff} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs text-slate-300 font-semibold mb-1 uppercase tracking-wider">Nom Complet *</label>
              <input 
                type="text" 
                placeholder="Ex. Christian Soglo"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 bg-[#0A1128] border border-white/10 rounded-xl text-white placeholder-slate-550 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs font-semibold"
                required
                disabled={actionLoading}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 font-semibold mb-1 uppercase tracking-wider">Adresse Email *</label>
              <input 
                type="email" 
                placeholder="soglo@lemenuservice.bj"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-[#0A1128] border border-white/10 rounded-xl text-white placeholder-slate-550 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs font-semibold"
                required
                disabled={actionLoading}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 font-semibold mb-1 uppercase tracking-wider">Téléphone Professionnel *</label>
              <input 
                type="tel" 
                placeholder="+229 97 12 34 56"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-[#0A1128] border border-white/10 rounded-xl text-white placeholder-slate-550 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs font-semibold"
                required
                disabled={actionLoading}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 font-semibold mb-1 uppercase tracking-wider">Mot de passe d'accès *</label>
              <input 
                type="password" 
                placeholder="Minimum 8 caractères"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-[#0A1128] border border-white/10 rounded-xl text-white placeholder-slate-550 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs font-semibold"
                required
                disabled={actionLoading}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 font-semibold mb-1.5 uppercase tracking-wider">Siège de rattachement *</label>
              <select 
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-3 py-2 bg-[#0A1128] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs cursor-pointer font-bold"
                required
                disabled={actionLoading || branchesLoading}
              >
                <option value="">Sélectionner une de vos branches...</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.shortName})</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-blue-900/40 cursor-pointer disabled:opacity-50"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Inscription sécurisée...</span>
                </>
              ) : (
                'Ajouter à l\'équipe'
              )}
            </button>
          </form>
        </div>

        {/* Staff accounts list */}
        <div className="lg:col-span-2 bg-[#111A36] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5">
            <Users className="w-5 h-5 text-blue-400" />
            <h2 className="font-black text-white text-base">Comptes Collaborateurs Actifs</h2>
          </div>

          {staffLoading ? (
            <div className="space-y-2 py-4 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 bg-white/5 rounded-xl border border-white/5"></div>
              ))}
            </div>
          ) : staffList.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs leading-relaxed max-w-sm mx-auto">
              Aucun collaborateur n'est encore enregistré. Utilisez le formulaire adjacent pour créer le premier compte chef de siège.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="text-slate-400 font-extrabold uppercase border-b border-white/10 bg-white/2">
                    <th className="py-3.5 px-3">Nom / Contact</th>
                    <th className="py-3.5 px-3 font-mono">ID Email</th>
                    <th className="py-3.5 px-3">Siège assigné</th>
                    <th className="py-3.5 px-3 text-center">Status</th>
                    <th className="py-3.5 px-3 text-right">Actions de direction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {staffList.map((user) => {
                    const mappedBranch = branches.find(b => b.id === user.branchId);
                    const isActive = user.active !== false;

                    return (
                      <tr key={user.uid} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 px-3">
                          <div className="font-bold text-white text-sm">{user.displayName}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5" title="Téléphone">
                            <Phone className="w-2.5 h-2.5" />
                            <span>{user.phone}</span>
                          </div>
                        </td>
                        <td className="py-4 px-3 font-mono text-slate-300 font-semibold">
                          {user.email}
                        </td>
                        <td className="py-4 px-3">
                          {user.role === 'super_admin' || user.role === 'admin' ? (
                            <span className="px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-500 font-extrabold uppercase text-[9px] border border-yellow-500/15">
                              TOUTES LES BRANCHES (PROPRIO)
                            </span>
                          ) : (
                            <span className="font-bold text-blue-350 uppercase bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/15 text-[10px]">
                              {mappedBranch ? mappedBranch.name : (user.branchId || 'Non assigné').toUpperCase()}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-3 text-center">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-green-500/10 text-green-450 font-extrabold uppercase text-[9px] border border-green-500/15">
                              Actif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/10 text-red-500 font-extrabold uppercase text-[9px] border border-red-500/15">
                              Désactivé
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-3 text-right">
                          {user.role === 'super_admin' || user.role === 'admin' ? (
                            <span className="text-[10px] text-slate-500 italic">Protection Administrateur</span>
                          ) : (
                            <button
                              onClick={() => handleToggleActive(user.uid, user.active)}
                              className={`px-3 py-1.5 font-bold rounded-lg text-[10px] uppercase tracking-wider flex items-center gap-1 ml-auto border transition duration-150 cursor-pointer ${
                                isActive 
                                  ? 'bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border-red-500/25' 
                                  : 'bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-white border-green-500/25'
                              }`}
                            >
                              {isActive ? (
                                <>
                                  <UserX className="w-3.5 h-3.5" />
                                  <span>Désactiver</span>
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Activer</span>
                                </>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
