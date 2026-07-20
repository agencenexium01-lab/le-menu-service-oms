import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBranches } from '@/hooks/useBranches';
import { seedBranches, subscribeAllOrders } from '@/lib/firebase/firestore';
import StatusBadge from '@/components/admin/StatusBadge';
import { StatCardSkeleton } from '@/components/shared/Skeleton';
import { getServiceTypeLabel } from '@/components/admin/OrderCard';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Order, Quote } from '@/types';
import { 
  Users, 
  TrendingUp, 
  Inbox, 
  ArrowRight, 
  ClipboardList, 
  CheckCircle,
  Building,
  Activity,
  X
} from 'lucide-react';

export default function ProprietaireDashboardPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const { branches, loading: branchesLoading } = useBranches();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(true);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Security Guard : Redirection si non connecté ou non admin
  useEffect(() => {
    if (!authLoading) {
      if (!userProfile) {
        navigate('/pro/connexion');
      } else if (userProfile.role !== 'super_admin' && userProfile.role !== 'admin') {
        navigate('/pro/connexion');
      }
    }
  }, [userProfile, authLoading, navigate]);

  // Seeding and orders sync (Sécurisé avec garde-fou et dépendances)
  useEffect(() => {
    async function initSeeding() {
      // 🛡️ GARDE-FOU : On n'exécute seedBranches que si l'admin est authentifié et reconnu par Firebase
      if (!authLoading && userProfile && (userProfile.role === 'super_admin' || userProfile.role === 'admin')) {
        try {
          await seedBranches();
        } catch (err) {
          console.error("Auto seeding branches in page.tsx failed:", err);
        }
      }
    }
    initSeeding();

    // Activation de l'écoute temps réel des commandes
    const unsubscribeAll = subscribeAllOrders((syncedOrders) => {
      setOrders(syncedOrders);
      setOrdersLoading(false);
    });

    // Sub to quotes pour le calcul du Chiffre d'Affaires de la Zone A
    const quotesRef = collection(db, 'quotes');
    const unsubQuotes = onSnapshot(quotesRef, (snap) => {
      const list: Quote[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Quote);
      });
      setQuotes(list);
    }, (err) => {
      console.error("Quotes sub error inside dashboard:", err);
    });

    return () => {
      unsubscribeAll();
      unsubQuotes();
    };
  }, [authLoading, userProfile]); // Dépendances requises pour déclencher le code au moment opportun

  // ZONE A Computations
  const countActiveOrders = useMemo(() => {
    return orders.filter(o => o.status !== 'livre' && o.status !== 'annule').length;
  }, [orders]);

  const countNewOrders = useMemo(() => {
    return orders.filter(o => o.status === 'nouveau').length;
  }, [orders]);

  const countDeliveredThisMonth = useMemo(() => {
    return orders.filter(o => {
      if (o.status !== 'livre' || !o.createdAt) return false;
      const date = typeof o.createdAt.toDate === 'function' ? o.createdAt.toDate() : new Date(o.createdAt as any);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
  }, [orders]);

  const currentMonthRevenue = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return quotes
      .filter(q => {
        if (q.status !== 'accepted') return false;
        const date = q.respondedAt 
          ? (typeof q.respondedAt.toDate === 'function' ? q.respondedAt.toDate() : new Date(q.respondedAt as any))
          : (typeof q.createdAt.toDate === 'function' ? q.createdAt.toDate() : new Date(q.createdAt as any));
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, q) => sum + (q.amount || 0), 0);
  }, [quotes]);

  // ZONE C Computation: Top 10 des dernières commandes
  const latestTenOrders = useMemo(() => {
    return orders.slice(0, 10);
  }, [orders]);

  const getFormattedDate = (createdAt: any) => {
    if (!createdAt) return 'Date inconnue';
    const date = typeof createdAt.toDate === 'function' ? createdAt.toDate() : new Date(createdAt);
    return date.toLocaleDateString('fr-BJ', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Écran d'attente pendant la vérification du profil
  if (authLoading || !userProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <svg className="animate-spin h-8 w-8 text-blue-500 mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-xs font-mono text-slate-400">Initialisation de la console propriétaire...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8" id="owner-dashboard-container">
      
      {/* Header Block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <span className="text-[10px] uppercase font-black text-blue-400 tracking-widest bg-blue-500/10 border border-blue-500/25 px-2.5 py-1 rounded-full mb-2 inline-block">
            Super-Administration Le Menu Service
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight">Supervision Globale Réseau</h1>
          <p className="text-slate-400 text-xs mt-1">
            Indicateurs financiers de l'atelier OMS, gestion de la fabrication grand format et des 3 sièges.
          </p>
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A6E] text-blue-300 border border-blue-500/25 rounded-xl text-xs font-extrabold shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping"></span>
            Supervision Live
          </span>
        </div>
      </div>

      {/* ZONE A — KPIs globaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="zone-a-kpis">
        {ordersLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            {/* Commandes Actives */}
            <div className="bg-[#111A36] border border-white/5 p-6 rounded-2xl space-y-3 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Activity className="w-16 h-16 text-blue-500" />
              </div>
              <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest block font-sans">
                Commandes Actives
              </div>
              <div className="text-3xl font-black text-white">
                {countActiveOrders}
              </div>
              <p className="text-[11px] text-slate-400 leading-none">Fabrications non livrées</p>
            </div>

            {/* Nouvelles — Non Traitées */}
            <div className="bg-gradient-to-br from-rose-950/20 to-slate-900/40 border border-rose-500/20 p-6 rounded-2xl space-y-3 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <ClipboardList className="w-16 h-16 text-rose-500" />
              </div>
              <div className="text-rose-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                Nouvelles demandes
              </div>
              <div className="text-3xl font-black text-rose-500">
                {countNewOrders}
              </div>
              <p className="text-[11px] text-slate-400 leading-none">En attente de devis OMS</p>
            </div>

            {/* Livrées ce mois */}
            <div className="bg-[#111A36] border border-white/5 p-6 rounded-2xl space-y-3 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest block font-sans">
                Livrées ce mois
              </div>
              <div className="text-3xl font-black text-green-400">
                {countDeliveredThisMonth}
              </div>
              <p className="text-[11px] text-slate-400 leading-none">Production et retraits clos</p>
            </div>

            {/* Chiffre d'affaires estimé du mois */}
            <div className="bg-gradient-to-br from-blue-950/20 to-slate-900/40 border border-blue-500/20 p-6 rounded-2xl space-y-3 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <TrendingUp className="w-16 h-16 text-blue-400" />
              </div>
              <div className="text-blue-350 text-[10px] font-black uppercase tracking-widest block font-sans">
                Chiffre d'Affaires Mensuel
              </div>
              <div className="text-2xl font-black text-[#60A5FA]">
                {currentMonthRevenue.toLocaleString('fr-BJ')} XOF
              </div>
              <p className="text-[11px] text-slate-400 leading-none">Somme des devis acceptés</p>
            </div>
          </>
        )}
      </div>

      {/* ZONE B — Tableau de bord par siège */}
      <div className="space-y-4" id="zone-b-annexes">
        <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Building className="w-4 h-4 text-blue-400" />
          <span>Matrice Opérationnelle des Sièges</span>
        </h3>
        {branchesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-56 bg-[#111A36] rounded-2xl border border-white/5"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {branches.map(branch => {
              const branchOrders = orders.filter(o => o.branchId === branch.id || o.assignedBranchId === branch.id);
              const branchNew = branchOrders.filter(o => o.status === 'nouveau').length;
              const branchInProgress = branchOrders.filter(o => ['en_verification', 'devis_envoye', 'devis_accepte', 'en_production'].includes(o.status)).length;
              const branchReady = branchOrders.filter(o => o.status === 'pret').length;
              const branchDelivered = branchOrders.filter(o => o.status === 'livre').length;

              const totalForProgression = branchOrders.length;
              const progressPct = totalForProgression > 0 
                ? Math.min(100, Math.round((branchDelivered / totalForProgression) * 100))
                : 0;

              return (
                <div 
                  key={branch.id} 
                  className={`border rounded-2xl p-5 flex flex-col justify-between shadow-xl relative overflow-hidden transition-all duration-300 ${
                    branch.active 
                      ? 'bg-[#111A36] border-white/5 hover:border-blue-500/30' 
                      : 'bg-[#111225] border-red-500/10'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] tracking-wider uppercase font-extrabold bg-[#1A1A6E] text-blue-350 px-2 py-0.5 rounded border border-blue-500/10">
                          {branch.shortName}
                        </span>
                        <h4 className="font-bold text-white text-sm line-clamp-1">{branch.name}</h4>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.2 rounded ${
                        branch.active 
                          ? 'bg-green-500/10 text-green-400 border border-green-500/10' 
                          : 'bg-red-500/10 text-red-500 border border-red-500/10'
                      }`}>
                        {branch.active ? 'Actif' : 'Inactif'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-white/3 p-2.5 rounded-xl border border-white/5 text-center">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Nouveaux</div>
                        <div className={`text-base font-black ${branchNew > 0 ? 'text-rose-550' : 'text-slate-300'}`}>
                          {branchNew}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">En cours</div>
                        <div className="text-base font-black text-yellow-400">
                          {branchInProgress}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Prêtes</div>
                        <div className="text-base font-black text-green-400">
                          {branchReady}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400 font-bold uppercase tracking-wide">Taux de clôture</span>
                        <span className="text-blue-300 font-black">{progressPct}%</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
                        <div 
                          className="bg-blue-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        ></div>
                      </div>
                      <div className="text-[9px] text-slate-500 text-right">
                        {branchDelivered} livrée(s) / {totalForProgression} commande(s)
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/5 mt-4 pt-3">
                    <Link
                      to={`/pro/proprietaire/commandes?branchId=${branch.id}`}
                      className="w-full py-1.5 bg-blue-500/10 text-blue-350 hover:bg-blue-500 text-white font-black text-center text-[11px] rounded-lg tracking-wider block transition-colors border border-blue-500/10"
                    >
                      Voir les commandes de ce siège
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ZONE C — Flux live (10 dernières commandes) */}
      <div className="backdrop-blur-xl bg-[#111A36]/60 border border-white/5 rounded-2xl p-6 space-y-4 shadow-xl" id="zone-c-livefeed">
        <div className="flex items-center justify-between gap-4 flex-wrap border-b border-white/5 pb-4">
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-wider"> Flux Live Réseau (10 dernières)</h3>
            <p className="text-xs text-slate-400">Suivi en direct de la production grand format et du façonnage.</p>
          </div>
          <Link 
            to="/pro/proprietaire/commandes" 
            className="text-xs font-bold text-blue-400 inline-flex items-center gap-1 hover:underline hover:text-blue-350 transition-all font-mono"
          >
            <span>Ouvrir l'intégralité du registre</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {ordersLoading ? (
          <div className="space-y-2.5 pt-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-11 bg-white/5 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : latestTenOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
            <div className="p-4 bg-white/5 border border-white/5 rounded-full text-slate-400">
              <Inbox className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-300">Flux d'enregistrement vide</h4>
              <p className="text-xs text-slate-500">Aucune commande n'a encore transité sur le réseau.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="text-slate-450 font-black uppercase border-b border-white/5 pb-2 text-[10px]">
                  <th className="py-3 px-3">N° Commande</th>
                  <th className="py-3 px-3">Siège</th>
                  <th className="py-3 px-3">Client</th>
                  <th className="py-3 px-3">Service</th>
                  <th className="py-3 px-3 text-center">Statut</th>
                  <th className="py-3 px-3">Date d'édition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {latestTenOrders.map((order) => {
                  const correlatedBranch = branches.find(b => b.id === order.branchId);
                  
                  return (
                    <tr 
                      key={order.id} 
                      onClick={() => setSelectedOrder(order)}
                      className={`hover:bg-white/5 transition-all cursor-pointer ${
                        order.status === 'nouveau' ? 'bg-rose-500/5' : ''
                      }`}
                    >
                      <td className="py-3.5 px-3">
                        <span className="font-mono text-xs text-yellow-550 font-extrabold bg-yellow-500/10 px-2.5 py-0.5 rounded border border-yellow-500/15 shadow-sm">
                          #{order.orderNumber}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[9px] font-black bg-blue-500/10 text-blue-350 border border-blue-500/20 shadow-sm uppercase">
                          {correlatedBranch ? correlatedBranch.shortName : (order.branchId || 'OMS').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-white">
                        <span>{order.clientName}</span>
                        {order.clientEmail && (
                          <span className="text-[10px] text-slate-400 block font-normal">{order.clientEmail}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-slate-200">
                        <span className="font-semibold">{getServiceTypeLabel(order.serviceType)}</span>
                        <span className="text-[10px] text-slate-500 block font-mono">
                          {order.dimensions?.width}x{order.dimensions?.height} {order.dimensions?.unit || 'm'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-3.5 px-3 text-slate-400 font-semibold font-mono">
                        {getFormattedDate(order.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111A36] border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative text-xs">
            <button 
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-xs text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/15">
                #{selectedOrder.orderNumber}
              </span>
              <span className="text-slate-450 uppercase font-black text-[10px]">Détails du transit</span>
            </div>
            
            <div className="space-y-3 pt-2 text-white">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 font-bold block uppercase pb-1 text-[10px]">Client</label>
                  <p className="font-bold text-white text-sm">{selectedOrder.clientName}</p>
                  <p className="text-slate-400 text-[11px] font-mono">{selectedOrder.clientEmail}</p>
                </div>
                <div>
                  <label className="text-slate-400 font-bold block uppercase pb-1 text-[10px]">Prestation</label>
                  <p className="font-bold text-white text-sm">{getServiceTypeLabel(selectedOrder.serviceType)}</p>
                  <p className="text-slate-400 text-[11px]">
                    Dimensions : {selectedOrder.dimensions?.width}x{selectedOrder.dimensions?.height} {selectedOrder.dimensions?.unit || 'm'} (Qté: {selectedOrder.quantity || 1})
                  </p>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold block uppercase pb-1 text-[10px]">Description technique</label>
                <div className="bg-white/3 p-3 rounded-xl border border-white/5 text-slate-300">
                  {selectedOrder.description || "Aucune description fournie par le client."}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 font-bold block uppercase pb-1 text-[10px]">Siège de réception</label>
                  <span className="inline-block px-2.5 py-1 rounded font-black text-[10px] bg-blue-500/15 text-blue-300 border border-blue-500/15 uppercase">
                    {branches.find(b => b.id === selectedOrder.branchId)?.name || (selectedOrder.branchId || 'Non spécifié').toUpperCase()}
                  </span>
                </div>
                <div>
                  <label className="text-slate-400 font-bold block uppercase pb-1 text-[10px]">Atelier Assigné</label>
                  <span className="inline-block px-2.5 py-1 rounded font-black text-[10px] bg-yellow-500/15 text-yellow-450 border border-yellow-500/15 uppercase">
                    {branches.find(b => b.id === selectedOrder.assignedBranchId)?.name || (selectedOrder.assignedBranchId || selectedOrder.branchId || 'Non spécifié').toUpperCase()}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold block uppercase pb-1 text-[10px]">Statut actuel</label>
                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedOrder.status} />
                  <span className="text-slate-400 text-[11px] font-mono">
                    Enregistré le {getFormattedDate(selectedOrder.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
              <Link
                to={`/pro/proprietaire/commandes?branchId=${selectedOrder.branchId}`}
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-[#1A1A6E] text-blue-300 font-extrabold rounded-xl hover:bg-blue-900 leading-none"
              >
                Gérer les commandes liées
              </Link>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-white/5 text-slate-300 font-bold rounded-xl hover:bg-white/10 leading-none cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}