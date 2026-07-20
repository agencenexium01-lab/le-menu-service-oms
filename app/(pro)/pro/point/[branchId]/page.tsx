import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBranches } from '@/hooks/useBranches';
import { subscribeOrdersByBranch } from '@/lib/firebase/firestore';
import { Order } from '@/types';
import StatusBadge from '@/components/admin/StatusBadge';
import { getServiceTypeLabel } from '@/components/admin/OrderCard';
import { 
  Building, 
  MapPin, 
  Phone, 
  FileText, 
  Sparkles, 
  Inbox, 
  Hourglass, 
  CheckCircle, 
  ClipboardList,
  ArrowRight,
  MapPinned,
  Loader2
} from 'lucide-react';

export default function ChefPointDashboard() {
  const { branchId } = useParams<{ branchId: string }>();
  const { userProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { branches, loading: branchesLoading } = useBranches();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Security guard implementation
  useEffect(() => {
    if (!authLoading) {
      if (!userProfile) {
        navigate('/pro/connexion');
        return;
      }
      
      const isPro = userProfile.role === 'super_admin' || userProfile.role === 'admin' || userProfile.role === 'chef_point';
      if (!isPro) {
        navigate('/connexion');
        return;
      }

      if (userProfile.role === 'chef_point') {
        if (userProfile.branchId !== branchId) {
          navigate(`/pro/point/${userProfile.branchId}`);
          return;
        }
      }
    }
  }, [userProfile, authLoading, branchId, navigate]);

  const matchedBranch = branches.find(b => b.id === branchId);

  // Subscribe to orders of this branch in real time
  useEffect(() => {
    if (!branchId) return;

    setLoadingOrders(true);
    const unsubscribe = subscribeOrdersByBranch(branchId, (syncedOrders) => {
      setOrders(syncedOrders);
      setLoadingOrders(false);
    });

    return () => unsubscribe();
  }, [branchId]);

  // Statistics calculation for the point
  const countNewToday = orders.filter(o => {
    if (o.status !== 'nouveau') return false;
    if (!o.createdAt) return false;
    const date = typeof o.createdAt.toDate === 'function' ? o.createdAt.toDate() : new Date(o.createdAt as any);
    const now = new Date();
    return date.getDate() === now.getDate() && 
           date.getMonth() === now.getMonth() && 
           date.getFullYear() === now.getFullYear();
  }).length;

  const countInProgress = orders.filter(o => 
    ['en_verification', 'devis_envoye', 'devis_accepte', 'en_production'].includes(o.status)
  ).length;

  const countReady = orders.filter(o => o.status === 'pret').length;
  
  const countDeliveredThisMonth = orders.filter(o => {
    if (o.status !== 'livre' || !o.createdAt) return false;
    const date = typeof o.createdAt.toDate === 'function' ? o.createdAt.toDate() : new Date(o.createdAt as any);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  const latestOrders = orders.slice(0, 5);

  const getFormattedDate = (createdAt: any) => {
    if (!createdAt) return 'Date inconnue';
    const date = typeof createdAt.toDate === 'function' ? createdAt.toDate() : new Date(createdAt);
    return date.toLocaleDateString('fr-BJ', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (authLoading || branchesLoading || loadingOrders) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 text-white space-y-4">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
        <p className="text-xs font-mono text-slate-400 uppercase tracking-widest animate-pulse">Liaison du siège en direct...</p>
      </div>
    );
  }

  if (!matchedBranch) {
    return (
      <div className="p-6 bg-red-500/15 border border-red-500/30 rounded-2xl max-w-lg mx-auto text-white space-y-3 mt-10">
        <h3 className="font-extrabold text-base uppercase tracking-tight text-red-400">Siège Inexistant</h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Le siège demandé n'a pas pu être trouvé dans le référentiel central de Le Menu Service. Veuillez contacter l'administration de l'atelier central.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-white">
      
      {/* Banner/Header of the Branch */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-white/5 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-black bg-blue-500/20 text-blue-400 border border-blue-500/10 px-2.5 py-1 rounded-full">
              Siège : {matchedBranch.shortName.toUpperCase()}
            </span>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-ping"></span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">📍 {matchedBranch.name}</h1>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>{matchedBranch.address}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span>{matchedBranch.phone}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-3.5 max-w-xs text-xs text-slate-300">
          <MapPinned className="w-8 h-8 text-blue-400 shrink-0" />
          <p className="leading-snug font-medium">
            Rattaché en tant que superviseur certifié de l'atelier régional d'impression de {matchedBranch.shortName === 'zopah' ? 'Zopah' : matchedBranch.shortName === 'kpodji les monts' ? 'Kpodji Les Monts' : 'Kansoukpa'}
          </p>
        </div>
      </div>

      {/* 4 Cards Stat Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Nouvelles */}
        <div className="bg-gradient-to-br from-red-950/20 to-slate-900/50 border border-red-500/25 p-6 rounded-2xl space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ClipboardList className="w-16 h-16 text-rose-500" />
          </div>
          <div className="text-slate-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>
            Nouveaux Dépôts
          </div>
          <div className="text-4xl font-black text-rose-500">{countNewToday}</div>
          <p className="text-xs text-slate-400">Reçues aujourd'hui, attente de devis</p>
        </div>

        {/* En Cours */}
        <div className="bg-[#111A36] border border-white/10 p-6 rounded-2xl space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Hourglass className="w-16 h-16 text-yellow-500" />
          </div>
          <div className="text-slate-400 text-xs font-black uppercase tracking-widest">En cours de traitement</div>
          <div className="text-4xl font-black text-yellow-400">{countInProgress}</div>
          <p className="text-xs text-slate-400">Devis émis ou en production</p>
        </div>

        {/* Prêtes à livrer */}
        <div className="bg-[#111A36] border border-white/10 p-6 rounded-2xl space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles className="w-16 h-16 text-emerald-500" />
          </div>
          <div className="text-slate-400 text-xs font-black uppercase tracking-widest">Prêtes à remettre</div>
          <div className="text-4xl font-black text-green-400">{countReady}</div>
          <p className="text-xs text-slate-400">Imprimées, prêtes au retrait</p>
        </div>

        {/* Livrées ce mois */}
        <div className="bg-[#111A36] border border-white/10 p-6 rounded-2xl space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <CheckCircle className="w-16 h-16 text-indigo-500" />
          </div>
          <div className="text-slate-400 text-xs font-black uppercase tracking-widest">Livrées ce mois</div>
          <div className="text-4xl font-black text-white">{countDeliveredThisMonth}</div>
          <p className="text-xs text-slate-400">Livrées avec succès ce mois</p>
        </div>
      </div>

      {/* Latest Orders section */}
      <div className="backdrop-blur-xl bg-[#111A36]/50 border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap border-b border-white/5 pb-4">
          <div>
            <h3 className="text-lg font-black text-white">Flux d'impression du Point</h3>
            <p className="text-xs text-slate-400">Les 5 dernières commandes déposées physiquement ou en ligne dans votre succursale.</p>
          </div>
          <Link 
            to={`/pro/point/${branchId}/commandes`} 
            className="text-xs font-bold text-blue-400 inline-flex items-center gap-1 hover:underline hover:text-blue-350 transition-all font-mono"
          >
            <span>Voir le registre succursale</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {latestOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
            <div className="p-4 bg-white/5 border border-white/5 rounded-full text-slate-400">
              <Inbox className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-300">Aucune commande enregistrée</h4>
              <p className="text-xs text-slate-500 max-w-sm">Dès qu'une commande sera attribuée ou passée dans ce point, elle s'affichera ici.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="text-xs text-slate-400 font-extrabold uppercase border-b border-white/10">
                  <th className="py-3 px-3">Numéro</th>
                  <th className="py-3 px-3">Client</th>
                  <th className="py-3 px-3">Prestation demandée</th>
                  <th className="py-3 px-3">Statut actuel</th>
                  <th className="py-3 px-3">Date de dépôt</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {latestOrders.map((order) => {
                  const assignedBranch = branches.find(b => b.id === order.assignedBranchId);
                  const assignedBranchName = assignedBranch ? assignedBranch.shortName : (order.assignedBranchId || '').toUpperCase();

                  return (
                    <tr 
                      key={order.id} 
                      className={`hover:bg-white/5 transition-colors ${
                        order.status === 'nouveau' ? 'bg-red-500/5' : ''
                      }`}
                    >
                      <td className="py-4 px-3">
                        <span className="font-mono text-xs text-yellow-500 font-extrabold bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                          #{order.orderNumber}
                        </span>
                      </td>
                      <td className="py-4 px-3 font-bold text-white">
                        <div>
                          <div className="flex items-center">
                            <span>{order.clientName}</span>
                            {order.assignedBranchId && order.assignedBranchId !== branchId && (
                              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] bg-amber-500/10 text-amber-300 border border-amber-500/20 font-black uppercase">
                                Traitée par {assignedBranchName}
                              </span>
                            )}
                          </div>
                          {(order as any).companyName && (
                            <div className="text-[11px] text-slate-400 mt-0.5">{(order as any).companyName}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <div className="text-xs text-slate-300">
                          {getServiceTypeLabel(order.serviceType)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {order.dimensions?.width}x{order.dimensions?.height} {order.dimensions?.unit || 'm'}
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-4 px-3 text-xs text-slate-400">
                        {getFormattedDate(order.createdAt)}
                      </td>
                      <td className="py-4 px-3 text-right">
                        <Link 
                          to={`/pro/point/${branchId}/commandes/${order.id}`}
                          className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600 text-blue-300 hover:text-white font-black rounded-lg text-xs border border-blue-500/10 transition duration-150"
                        >
                          Gérer &rarr;
                        </Link>
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
  );
}