import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOrders } from '@/hooks/useOrders';
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Branch } from '@/types';
import { 
  Building2, 
  MapPin, 
  Phone, 
  ArrowRight,
  X,
  Edit2,
  Lock,
  Unlock,
  Check,
  AlertCircle
} from 'lucide-react';

export default function ProprietaireBranchesPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const { orders } = useOrders();
  const navigate = useNavigate();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  
  // Modal editor states
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Security Guard for owner/admin
  useEffect(() => {
    if (!authLoading) {
      if (!userProfile) {
        navigate('/pro/connexion');
      } else if (userProfile.role !== 'super_admin' && userProfile.role !== 'admin') {
        navigate('/pro/connexion');
      }
    }
  }, [userProfile, authLoading, navigate]);

  // Real-time listen on branches to keep states synced instantly
  useEffect(() => {
    if (userProfile && (userProfile.role === 'super_admin' || userProfile.role === 'admin')) {
      const q = query(collection(db, 'branches'), orderBy('sortOrder', 'asc'));
      const unsub = onSnapshot(q, (snapshot) => {
        const list: Branch[] = [];
        snapshot.forEach((snap) => {
          list.push({ id: snap.id, ...snap.data() } as Branch);
        });
        setBranches(list);
        setBranchesLoading(false);
      }, (err) => {
        console.error("Real-time branches fetch failed:", err);
        setBranchesLoading(false);
      });
      return () => unsub();
    }
  }, [userProfile]);

  // Update details form submit
  const handleUpdateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;
    setSubmitting(true);
    setSuccessMessage(null);
    try {
      const branchRef = doc(db, 'branches', editingBranch.id);
      await updateDoc(branchRef, {
        name: editingBranch.name,
        address: editingBranch.address,
        phone: editingBranch.phone,
        active: editingBranch.active
      });
      setSuccessMessage(`✓ Siège ${editingBranch.shortName} mis à jour avec succès.`);
      setEditingBranch(null);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error("Failed to update branch:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Fast toggle active status
  const handleToggleActive = async (branchId: string, currentActive: boolean) => {
    try {
      const branchRef = doc(db, 'branches', branchId);
      await updateDoc(branchRef, {
        active: !currentActive
      });
      setSuccessMessage("Statut du siège mis à jour.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Toggle active state failed:", err);
    }
  };

  if (authLoading || !userProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
        <svg className="animate-spin h-6 w-6 text-blue-500 mb-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-xs font-mono text-slate-450">Chargement de la feuille des sièges...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="owner-branches-registre">
      <div>
        <span className="text-[10px] uppercase font-black text-blue-400 tracking-widest bg-blue-500/10 border border-blue-500/25 px-2.5 py-1 rounded-full mb-2 inline-block">
          ADMINISTRATION DU RÉSEAU
        </span>
        <h1 className="text-2xl font-black text-white tracking-tight">Gestion des Sièges</h1>
        <p className="text-xs text-slate-400 mt-1">
          Supervisez l'activité commerciale générale, modifiez les coordonnées de contact et activez/désactivez instantanément les sièges Le Menu Service.
        </p>
      </div>

      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-300 p-4 rounded-xl text-xs font-bold" id="branches-success-alert">
          {successMessage}
        </div>
      )}

      {branchesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#111A36] h-60 border border-white/5 rounded-2xl"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="proprietaire-branches-matrix">
          {branches.map(branch => {
            const branchOrders = orders.filter(o => o.branchId === branch.id);
            const totalOrders = branchOrders.length;
            const newOrders = branchOrders.filter(o => o.status === 'nouveau').length;
            const processingOrders = branchOrders.filter(o => ['en_verification', 'devis_envoye', 'devis_accepte', 'en_production'].includes(o.status)).length;
            const completedOrders = branchOrders.filter(o => o.status === 'livre').length;

            return (
              <div 
                key={branch.id} 
                className={`border rounded-2xl p-6 shadow-xl space-y-6 flex flex-col justify-between transition-all duration-300 ${
                  branch.active 
                    ? 'bg-[#111A36] border-white/10 hover:border-blue-500/30' 
                    : 'bg-[#111225] border-red-500/10'
                }`}
              >
                {/* Branch branding title section */}
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] uppercase font-black px-2.5 py-1 rounded bg-blue-500/10 text-blue-305 border border-blue-500/15">
                      Code : {branch.shortName}
                    </span>
                    <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded border ${
                      branch.active 
                        ? 'bg-green-500/10 text-green-400 border-green-500/10' 
                        : 'bg-red-500/10 text-red-500 border-red-500/10'
                    }`}>
                      {branch.active ? 'Actif' : 'Désactivé'}
                    </span>
                  </div>

                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-black text-white">{branch.name}</h3>
                      <p className="text-xs text-blue-300 font-mono font-medium">Bénin, Afrique de l'Ouest</p>
                    </div>
                    {/* Pencil Edit button */}
                    <button
                      onClick={() => setEditingBranch({ ...branch })}
                      className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition-colors border border-white/5 cursor-pointer"
                      title="Modifier les coordonnées"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 pt-2 text-xs text-slate-300 border-t border-white/5">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span className="leading-normal">{branch.address}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{branch.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Micro-metrics stats summary */}
                <div className="bg-[#0e1735]/65 border border-white/5 rounded-xl p-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total</div>
                    <div className="text-base font-black text-white mt-0.5 font-mono">{totalOrders}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">En cours</div>
                    <div className="text-base font-black text-yellow-400 mt-0.5 font-mono">{processingOrders}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Livrées</div>
                    <div className="text-base font-black text-green-400 mt-0.5 font-mono">{completedOrders}</div>
                  </div>
                </div>

                {/* Action button bar */}
                <div className="flex gap-2">
                  {/* Status switcher button */}
                  <button
                    onClick={() => handleToggleActive(branch.id, branch.active)}
                    className={`flex-1 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition leading-none cursor-pointer border ${
                      branch.active 
                        ? 'bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border-red-500/20' 
                        : 'bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-white border-green-500/20'
                    }`}
                  >
                    {branch.active ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Désactiver</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Activer</span>
                      </>
                    )}
                  </button>

                  {/* Direct portal linker */}
                  <button 
                    onClick={() => navigate(`/pro/point/${branch.id}`)}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-[11px] uppercase tracking-wider flex items-center justify-center gap-1 leading-none shadow-md shadow-blue-900/30 cursor-pointer border border-blue-500/10"
                  >
                    <span>Superviser</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Editing dialog modal */}
      {editingBranch && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleUpdateBranch}
            className="bg-[#111A36] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-white text-xs"
          >
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                <h3 className="font-extrabold text-white text-base">Modifier le siège {editingBranch.shortName}</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingBranch(null)} 
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[10px]">Nom du siège</label>
                <input 
                  type="text" 
                  value={editingBranch.name}
                  onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0A1128] border border-white/10 rounded-xl text-white font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[10px]">Adresse physique</label>
                <textarea 
                  value={editingBranch.address}
                  onChange={(e) => setEditingBranch({ ...editingBranch, address: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0A1128] border border-white/10 rounded-xl text-white font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 h-20 resize-none leading-relaxed"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[10px]">Téléphone direct</label>
                <input 
                  type="text" 
                  value={editingBranch.phone}
                  onChange={(e) => setEditingBranch({ ...editingBranch, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0A1128] border border-white/10 rounded-xl text-white font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => setEditingBranch(null)}
                className="px-4 py-2 bg-white/5 text-slate-300 font-bold rounded-xl hover:bg-white/10 leading-none cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl leading-none shadow-md shadow-blue-900/40 flex items-center gap-1 cursor-pointer"
              >
                {submitting && <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>}
                <span>Enregistrer</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
