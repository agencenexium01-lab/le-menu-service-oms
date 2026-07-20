import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { subscribeOrdersByBranch, validatePayment } from '@/lib/firebase/firestore';
import { useBranches } from '@/hooks/useBranches';
import { Order, PaymentFilter, OrderSourceFilter } from '@/types';
import StatusBadge from '@/components/admin/StatusBadge';
import { getServiceTypeLabel } from '@/components/admin/OrderCard';
import { 
  Inbox, 
  Search, 
  SlidersHorizontal,
  RefreshCw,
  AlertCircle,
  Building,
  ArrowRight,
  Plus,
  Coins
} from 'lucide-react';

type FilterStatus = 'toutes' | 'nouveau' | 'en_verification' | 'en_production' | 'pret' | 'livre';

export default function ChefPointOrdersPage() {
  const { branchId } = useParams<{ branchId: string }>();
  const { userProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { branches, loading: branchesLoading } = useBranches();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const [selectedFilter, setSelectedFilter] = useState<FilterStatus>('toutes');
  const [searchQuery, setSearchQuery] = useState('');

  // PAYMENT & SOURCE FILTERS + ACTION STATES
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<OrderSourceFilter>('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
  const [validatingPayment, setValidatingPayment] = useState(false);

  // Critical security guard
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
          navigate(`/pro/point/${userProfile.branchId}/commandes`);
          return;
        }
      }
    }
  }, [userProfile, authLoading, branchId, navigate]);

  const currentBranch = branches.find(b => b.id === branchId);

  // Subscribe to orders of this specific branch
  useEffect(() => {
    if (!branchId) return;

    setLoading(true);
    const unsubscribe = subscribeOrdersByBranch(branchId, (syncedOrders) => {
      setOrders(syncedOrders);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [branchId]);

  // Compute status statistics
  const counts = useMemo(() => {
    return {
      toutes: orders.length,
      nouveau: orders.filter(o => o.status === 'nouveau').length,
      en_verification: orders.filter(o => o.status === 'en_verification').length,
      en_production: orders.filter(o => o.status === 'en_production').length,
      pret: orders.filter(o => o.status === 'pret').length,
      livre: orders.filter(o => o.status === 'livre').length,
    };
  }, [orders]);

  // Filtering + Searching logic
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Status Filter
    if (selectedFilter !== 'toutes') {
      result = result.filter(o => o.status === selectedFilter);
    }

    // Payment Filter
    if (paymentFilter === 'paid') {
      result = result.filter(o => o.paymentStatus === 'paid');
    } else if (paymentFilter === 'pending') {
      result = result.filter(o => o.paymentStatus !== 'paid');
    }

    // Source Filter
    if (sourceFilter === 'manual') {
      result = result.filter(o => o.isManualOrder === true);
    } else if (sourceFilter === 'digital') {
      result = result.filter(o => o.isManualOrder !== true);
    }

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(o => 
        o.orderNumber.toLowerCase().includes(query) ||
        o.clientName.toLowerCase().includes(query) ||
        o.clientEmail.toLowerCase().includes(query) ||
        (o.companyName && o.companyName.toLowerCase().includes(query)) ||
        o.serviceType.toLowerCase().includes(query) ||
        (o.walkInClientPhone && o.walkInClientPhone.includes(query)) ||
        (o.walkInClientCompany && o.walkInClientCompany.toLowerCase().includes(query))
      );
    }

    return result.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt as any).getTime();
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt as any).getTime();
      return dateB - dateA;
    });
  }, [orders, selectedFilter, paymentFilter, sourceFilter, searchQuery]);

  const filterButtons = [
    { key: 'toutes', label: 'Toutes', count: counts.toutes },
    { key: 'nouveau', label: 'Nouvelles (Dépôts)', count: counts.nouveau },
    { key: 'en_verification', label: 'En vérification', count: counts.en_verification },
    { key: 'en_production', label: 'En production', count: counts.en_production },
    { key: 'pret', label: 'Prêtes', count: counts.pret },
    { key: 'livre', label: 'Livrées', count: counts.livre },
  ] as const;

  const getFormattedDate = (createdAt: any) => {
    if (!createdAt) return 'Date inconnue';
    const date = typeof createdAt.toDate === 'function' ? createdAt.toDate() : new Date(createdAt);
    return date.toLocaleDateString('fr-BJ', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (error) {
    return (
      <div className="p-6 bg-red-400/10 border border-red-500/25 rounded-2xl max-w-lg mx-auto text-white space-y-3 mt-10">
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <h3 className="font-extrabold">Erreur de chargement</h3>
        </div>
        <p className="text-xs text-slate-400">
          Impossible de se synchroniser avec le gestionnaire d'impression du point.
        </p>
      </div>
    );
  }

  if (authLoading || branchesLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4 animate-fade-in min-h-[50vh]">
        <div className="w-10 h-10 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-slate-400 font-bold text-xs">Vérification de la sécurité du siège...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header section with search bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <span className="text-[10px] uppercase font-black text-blue-400 tracking-wider">
            {currentBranch ? currentBranch.name : 'Siège'}
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">Registre des Commandes Client</h1>
          <p className="text-xs text-slate-400 mt-1">Supervisez et modifiez l'état de fabrication des travaux de ce siège.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to={`/pro/point/${branchId}/commandes/nouvelle`}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Saisie physique (Walk-In)</span>
          </Link>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-450" />
            <input 
              type="text" 
              placeholder="Rechercher par # n°, client..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-4 py-2 bg-[#111A36] border border-white/10 rounded-xl text-xs text-white placeholder-slate-450 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Real-time Status filter controls */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-2.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
          <span>Étape de production</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {filterButtons.map((btn) => {
            const isSelected = selectedFilter === btn.key;
            return (
              <button
                key={btn.key}
                type="button"
                onClick={() => setSelectedFilter(btn.key)}
                className={`py-1.5 px-3 text-xs font-bold rounded-lg border transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                  isSelected 
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-900/30' 
                    : 'bg-[#111A36] hover:bg-white/5 text-slate-300 hover:text-white border-white/10'
                }`}
              >
                <span>{btn.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black leading-none ${
                  isSelected 
                    ? 'bg-slate-950/20 text-white' 
                    : 'bg-white/5 text-slate-400'
                }`}>
                  {btn.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic sub-filters for source and payment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
        {/* Source filter */}
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#6B7280] block">
            Canal d'origine
          </span>
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'Toutes' },
              { key: 'digital', label: '💻 En ligne (Web)' },
              { key: 'manual', label: '🔌 Physiques (Walk-In)' },
            ].map((btn) => (
              <button
                key={btn.key}
                type="button"
                onClick={() => setSourceFilter(btn.key as any)}
                className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  sourceFilter === btn.key 
                    ? 'bg-blue-605/20 text-blue-400 border-blue-500/30' 
                    : 'bg-[#111A36] hover:bg-white/5 text-slate-400 border-white/5'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Payment filter */}
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#6B7280] block">
            Règlement / Facturation
          </span>
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'Tous' },
              { key: 'paid', label: '✅ Payé' },
              { key: 'pending', label: '⏳ Non payé' },
            ].map((btn) => (
              <button
                key={btn.key}
                type="button"
                onClick={() => setPaymentFilter(btn.key as any)}
                className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  paymentFilter === btn.key 
                    ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30' 
                    : 'bg-[#111A36] hover:bg-white/5 text-slate-400 border-white/5'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Matching orders rendering */}
      {loading ? (
        <div className="space-y-3 pt-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-[#111A36]/40 border border-white/10 rounded-2xl py-16 px-4 text-center space-y-4 max-w-2xl mx-auto mt-6">
          <div className="p-5 bg-white/5 border border-white/5 rounded-full inline-flex text-slate-450">
            <Inbox className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-white">Registre vide</h3>
            <p className="text-xs text-slate-400 leading-normal max-w-sm mx-auto">
              Aucune commande trouvée sous cette catégorie de statut dans votre point d'impression.
            </p>
          </div>
          {(searchQuery.trim() || selectedFilter !== 'toutes') && (
            <button 
              onClick={() => {
                setSearchQuery('');
                setSelectedFilter('toutes');
              }}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-semibold"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="bg-[#111A36] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="text-xs text-slate-400 font-extrabold uppercase border-b border-white/10 bg-white/2">
                  <th className="py-4 px-4">Numéro & Origine</th>
                  <th className="py-4 px-4">Client</th>
                  <th className="py-4 px-4">Prestation commandée</th>
                  <th className="py-4 px-4">Statut de fabrication</th>
                  <th className="py-4 px-4">Règlement / Caisse</th>
                  <th className="py-4 px-4">Date de dépôt</th>
                  <th className="py-4 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredOrders.map((order) => {
                  const assignedBranch = branches.find(b => b.id === order.assignedBranchId);
                  const assignedBranchName = assignedBranch ? assignedBranch.shortName : (order.assignedBranchId || '').toUpperCase();

                  return (
                    <tr 
                      key={order.id} 
                      className={`hover:bg-white/5 transition-colors ${
                        order.status === 'nouveau' ? 'bg-red-500/5' : ''
                      }`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-xs text-yellow-450 font-extrabold bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/15 w-max">
                            #{order.orderNumber}
                          </span>
                          {order.isManualOrder ? (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[8px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 font-black uppercase tracking-wider w-max">
                              🔌 Comptoir (Walk-In)
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[8px] bg-[#E91E8C]/10 text-[#E91E8C] border border-[#E91E8C]/15 font-black uppercase tracking-wider w-max">
                              💻 Portail Web
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <span className="font-bold text-white">{order.clientName}</span>
                          {order.assignedBranchId && order.assignedBranchId !== branchId && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] bg-amber-500/10 text-amber-305 border border-amber-500/15 font-black uppercase">
                              Traitée par {assignedBranchName}
                            </span>
                          )}
                        </div>
                        {order.isManualOrder && order.walkInClientPhone && (
                          <div className="text-[10px] text-slate-400 mt-0.5">📞 {order.walkInClientPhone}</div>
                        )}
                        {!order.isManualOrder && (order as any).companyName && (
                          <div className="text-[11px] text-slate-400 mt-0.5">{(order as any).companyName}</div>
                        )}
                        {order.isManualOrder && order.walkInClientCompany && (
                          <div className="text-[10px] text-slate-450 mt-0.5">🏢 {order.walkInClientCompany}</div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-xs text-slate-200 font-semibold">
                          {getServiceTypeLabel(order.serviceType)}
                        </div>
                        <div className="text-[10px] text-slate-450 mt-0.5">
                          {order.dimensions?.width}x{order.dimensions?.height} {order.dimensions?.unit || 'm'}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-4 px-4 text-xs">
                        {order.paymentStatus === 'paid' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                            ✅ Encaissé
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-450 border border-amber-500/20 uppercase tracking-wider">
                              ⏳ Non payé
                            </span>
                            {(order.status === 'pret' || order.status === 'livre') && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedOrderForPayment(order);
                                  setShowPaymentModal(true);
                                }}
                                className="p-1.2 bg-emerald-500/5 hover:bg-emerald-500 hover:text-white text-emerald-400 border border-emerald-500/20 rounded-lg transition-all cursor-pointer"
                                title="Valider l'encaissement"
                              >
                                <Coins className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-400">
                        {getFormattedDate(order.createdAt)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link 
                          to={`/pro/point/${branchId}/commandes/${order.id}`}
                          className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600 text-blue-300 hover:text-white font-black rounded-lg text-xs border border-blue-500/15 transition duration-150"
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
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {showPaymentModal && selectedOrderForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in" id="payment-confirmation-modal">
          <div className="bg-[#111A36] border border-white/10 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative text-white">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce">
                <Coins className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black">Confirmer le règlement</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Confirmer que la commande <span className="text-yellow-450 font-extrabold">#{selectedOrderForPayment.orderNumber}</span> a bien été réglée en physique au comptoir de {currentBranch ? currentBranch.name : 'votre point'} ?
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedOrderForPayment(null);
                }}
                disabled={validatingPayment}
                className="flex-1 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!selectedOrderForPayment.id || !userProfile) return;
                  setValidatingPayment(true);
                  try {
                    await validatePayment(selectedOrderForPayment.id, {
                      uid: userProfile.uid,
                      name: userProfile.displayName || userProfile.email
                    });
                    setShowPaymentModal(false);
                    setSelectedOrderForPayment(null);
                  } catch (err: any) {
                    console.error("Erreur de paiement:", err);
                    alert("Erreur de validation: " + err.message);
                  } finally {
                    setValidatingPayment(false);
                  }
                }}
                disabled={validatingPayment}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/30 cursor-pointer"
              >
                {validatingPayment ? 'Enregistrement...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
