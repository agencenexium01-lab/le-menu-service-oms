import React, { useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOrders } from '@/hooks/useOrders';
import { useBranches } from '@/hooks/useBranches';
import StatusBadge from '@/components/admin/StatusBadge';
import { getServiceTypeLabel } from '@/components/admin/OrderCard';
import { 
  Inbox, 
  Search, 
  SlidersHorizontal,
  AlertCircle,
  Building2,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

type FilterStatus = 'toutes' | 'nouveau' | 'en_verification' | 'devis_envoye' | 'devis_accepte' | 'en_production' | 'pret' | 'livre' | 'annule';

export default function ProprietaireOrdersPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const { orders, loading: ordersLoading, error: ordersError } = useOrders();
  const { branches } = useBranches();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Security guard
  useEffect(() => {
    if (!authLoading) {
      if (!userProfile) {
        navigate('/pro/connexion');
      } else if (userProfile.role !== 'super_admin' && userProfile.role !== 'admin') {
        navigate('/pro/connexion');
      }
    }
  }, [userProfile, authLoading, navigate]);

  // Read visual states synchronized directly into URL parameters
  const selectedBranchFilter = useMemo(() => {
    return searchParams.get('branchId') || 'toutes';
  }, [searchParams]);

  const selectedFilter = useMemo(() => {
    return (searchParams.get('status') || 'toutes') as FilterStatus;
  }, [searchParams]);

  const searchQuery = useMemo(() => {
    return searchParams.get('q') || '';
  }, [searchParams]);

  const currentPage = useMemo(() => {
    return parseInt(searchParams.get('page') || '1', 10);
  }, [searchParams]);

  // Distinct branding colors for each point of sale
  const getBranchBadgeStyles = (branchId?: string) => {
    switch (branchId) {
      case 'annexe_1':
        return 'bg-blue-500/10 text-blue-300 border-blue-500/20';
      case 'annexe_2':
        return 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20';
      case 'annexe_3':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-slate-550/10 text-slate-300 border-slate-500/15';
    }
  };

  // Safe parameters updates
  const setParamValues = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === 'toutes') {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });
    // Reset page to 1 when filters are changed
    if (!updates.page) {
      params.set('page', '1');
    }
    setSearchParams(params);
  };

  // Statistics badge computed globally or per branch selection
  const counts = useMemo(() => {
    const bOrders = selectedBranchFilter === 'toutes' 
      ? orders 
      : orders.filter(o => o.branchId === selectedBranchFilter);

    return {
      toutes: bOrders.length,
      nouveau: bOrders.filter(o => o.status === 'nouveau').length,
      en_verification: bOrders.filter(o => o.status === 'en_verification').length,
      en_production: bOrders.filter(o => o.status === 'en_production').length,
      pret: bOrders.filter(o => o.status === 'pret').length,
      livre: bOrders.filter(o => o.status === 'livre').length,
    };
  }, [orders, selectedBranchFilter]);

  // Filtering + Searching logic
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // 1. Branch Filter
    if (selectedBranchFilter !== 'toutes') {
      result = result.filter(o => o.branchId === selectedBranchFilter || o.assignedBranchId === selectedBranchFilter);
    }

    // 2. Status Filter
    if (selectedFilter !== 'toutes') {
      result = result.filter(o => o.status === selectedFilter);
    }

    // 3. Text Search queries (by order number, client name, company or email)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(o => 
        o.orderNumber.toLowerCase().includes(query) ||
        o.clientName.toLowerCase().includes(query) ||
        o.clientEmail.toLowerCase().includes(query) ||
        (o.branchName && o.branchName.toLowerCase().includes(query)) ||
        o.serviceType.toLowerCase().includes(query)
      );
    }

    // Ensure strict sorting by date descending
    return result.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt as any).getTime();
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt as any).getTime();
      return dateB - dateA;
    });
  }, [orders, selectedFilter, selectedBranchFilter, searchQuery]);

  // Pagination bounds computations
  const ITEMS_PER_PAGE = 20;
  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const paginatedOrders = useMemo(() => {
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const sliceStart = useMemo(() => {
    return totalItems === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  }, [currentPage, totalItems]);

  const sliceEnd = useMemo(() => {
    return Math.min(totalItems, currentPage * ITEMS_PER_PAGE);
  }, [currentPage, totalItems]);

  const filterButtons = [
    { key: 'toutes', label: 'Toutes', count: counts.toutes },
    { key: 'nouveau', label: 'Nouvelles', count: counts.nouveau },
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

  if (ordersError) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl max-w-lg mx-auto space-y-3 mt-10 text-white text-xs">
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <h3 className="font-extrabold uppercase tracking-wide">Erreur de connexion Firestore</h3>
        </div>
        <p className="text-slate-400 leading-normal">
          Impossible de récupérer l'historique global des commandes d'impression.
        </p>
      </div>
    );
  }

  if (authLoading || !userProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
        <svg className="animate-spin h-6 w-6 text-blue-500 mb-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-xs font-mono text-slate-450">Vérification de la console d'administration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="owner-orders-registre">
      
      {/* Upper header section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Registre Central des Sièges</h1>
          <p className="text-xs text-slate-400">Consultez et cherchez en temps réel l'ensemble des commandes déposées par les clients.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Branch Filter dropdown */}
          <div className="flex items-center gap-2 bg-[#111A36] border border-[#1E293B] px-3 py-1.5 rounded-xl">
            <Building2 className="w-4 h-4 text-blue-400" />
            <select 
              value={selectedBranchFilter}
              onChange={(e) => setParamValues({ branchId: e.target.value })}
              className="bg-transparent text-xs text-white focus:outline-none font-bold pr-4 cursor-pointer"
            >
              <option value="toutes" className="bg-[#111A36]">Toutes les divisions</option>
              {branches.map(b => (
                <option key={b.id} value={b.id} className="bg-[#111A36]">{b.name}</option>
              ))}
            </select>
          </div>

          {/* Search Input bar */}
          <div className="relative group">
            <Search className="absolute left-3.5 top-3 h-3.5 w-3.5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Rechercher par n° #LMS, client, mail..." 
              value={searchQuery}
              onChange={(e) => setParamValues({ q: e.target.value })}
              className="w-full sm:w-72 pl-10 pr-4 py-2.5 bg-[#111A36]/60 border border-white/5 hover:border-white/10 focus:border-blue-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-all font-semibold shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* Real-time Status filter controls */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-2.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
          <span>Filtrage par statut de production</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {filterButtons.map((btn) => {
            const isSelected = selectedFilter === btn.key;
            return (
              <button
                key={btn.key}
                type="button"
                onClick={() => setParamValues({ status: btn.key })}
                className={`py-1.5 px-3 text-xs font-bold rounded-lg border transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                  isSelected 
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-950/30' 
                    : 'bg-[#111A36] hover:bg-white/5 text-slate-300 hover:text-white border-white/5'
                }`}
              >
                <span>{btn.label}</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black leading-none ${
                  isSelected 
                    ? 'bg-slate-950/20 text-white' 
                    : 'bg-white/5 text-slate-450'
                }`}>
                  {btn.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main orders table view container */}
      {ordersLoading ? (
        <div className="space-y-3 pt-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-11 bg-white/5 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-[#111A36]/60 border border-white/5 rounded-2xl py-16 px-4 text-center space-y-4 max-w-2xl mx-auto mt-6">
          <div className="p-5 bg-white/5 border border-white/5 rounded-full inline-flex text-slate-400">
            <Inbox className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-white">Aucune commande concordante</h3>
            <p className="text-xs text-slate-400 leading-normal max-w-sm mx-auto">
              Nous n'avons trouvé aucun travail correspondant aux critères spécifiés.
            </p>
          </div>
          {(searchQuery.trim() || selectedFilter !== 'toutes' || selectedBranchFilter !== 'toutes') && (
            <button 
              onClick={() => {
                setSearchParams({});
              }}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
            >
              Effacer tous les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-[#111A36] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="text-slate-400 font-black uppercase border-b border-white/5 bg-white/1 text-[10px]">
                    <th className="py-4 px-4">Siège</th>
                    <th className="py-4 px-4">Numéro</th>
                    <th className="py-4 px-4">Client</th>
                    <th className="py-4 px-4">Service commandé</th>
                    <th className="py-4 px-4">Statut actuel</th>
                    <th className="py-4 px-4">Date de dépôt</th>
                    <th className="py-4 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedOrders.map((order) => {
                    const localBranch = branches.find(b => b.id === order.branchId);
                    const isNew = order.status === 'nouveau';
                    
                    return (
                      <tr 
                        key={order.id} 
                        className={`hover:bg-white/5 transition-colors ${
                          isNew ? 'bg-rose-500/5' : ''
                        }`}
                      >
                        {/* Siège Point of sale colored distinctly */}
                        <td className="py-4 px-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded text-[9px] font-black border uppercase ${getBranchBadgeStyles(order.branchId)}`}>
                            {localBranch ? localBranch.shortName : (order.branchId || 'OMS').toUpperCase()}
                          </span>
                        </td>

                        {/* Order Number */}
                        <td className="py-4 px-4">
                          <span className="font-mono text-xs text-yellow-500 font-extrabold bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/15">
                            #{order.orderNumber}
                          </span>
                        </td>

                        {/* Client details */}
                        <td className="py-4 px-4 font-bold text-white">
                          <div>{order.clientName}</div>
                          {order.clientEmail && (
                            <div className="text-[10px] text-slate-400 font-normal font-mono">{order.clientEmail}</div>
                          )}
                        </td>

                        {/* Service description */}
                        <td className="py-4 px-4">
                          <div className="font-semibold text-slate-200">
                            {getServiceTypeLabel(order.serviceType)}
                          </div>
                          <div className="text-[10px] text-slate-450 mt-0.5 font-mono">
                            {order.dimensions?.width}x{order.dimensions?.height} {order.dimensions?.unit || 'm'} ({order.quantity || 1} u.)
                          </div>
                        </td>

                        {/* StatusBadge */}
                        <td className="py-4 px-4">
                          <StatusBadge status={order.status} />
                        </td>

                        {/* Date */}
                        <td className="py-4 px-4 text-slate-400 font-semibold font-mono">
                          {getFormattedDate(order.createdAt)}
                        </td>

                        {/* Action Link to Branch Control */}
                        <td className="py-4 px-4 text-right">
                          <Link 
                            to={`/pro/point/${order.branchId || 'annexe_1'}`}
                            className="px-3 py-1.5 bg-[#1A1A6E] hover:bg-blue-600 text-blue-300 hover:text-white font-extrabold rounded-lg inline-block border border-blue-500/10 transition-all text-[11px] leading-tight"
                          >
                            Console Traitement
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Footer Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 text-xs bg-[#111A36] border border-white/5 rounded-2xl p-4 shadow-xl">
              <p className="text-slate-400 font-semibold">
                Affichage de <span className="text-white font-black">{sliceStart}</span> à <span className="text-white font-black">{sliceEnd}</span> sur <span className="text-blue-400 font-black">{totalItems}</span> commandes
              </p>

              <div className="inline-flex gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setParamValues({ page: (currentPage - 1).toString() })}
                  className="px-3 py-1.5 bg-white/5 text-slate-300 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 font-bold cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Précédent</span>
                </button>

                <div className="hidden sm:flex gap-1">
                  {[...Array(totalPages)].map((_, i) => {
                    const numberPage = i + 1;
                    const isCurrent = currentPage === numberPage;
                    return (
                      <button
                        key={numberPage}
                        type="button"
                        onClick={() => setParamValues({ page: numberPage.toString() })}
                        className={`w-8 h-8 rounded-lg text-xs font-extrabold leading-none ${
                          isCurrent 
                            ? 'bg-blue-600 border border-blue-500 text-white' 
                            : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
                        }`}
                      >
                        {numberPage}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setParamValues({ page: (currentPage + 1).toString() })}
                  className="px-3 py-1.5 bg-white/5 text-slate-300 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 font-bold cursor-pointer"
                >
                  <span>Suivante</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
