import React, { useState, useMemo } from 'react';
import { useOrders } from '../../../../hooks/useOrders';
import OrderCard from '../../../../components/admin/OrderCard';
import { 
  Inbox, 
  Layers, 
  Search, 
  SlidersHorizontal,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

type FilterStatus = 'toutes' | 'nouveau' | 'en_verification' | 'en_production' | 'pret' | 'livre';

export default function AdminOrdersPage() {
  const { orders, loading, error } = useOrders();
  const [selectedFilter, setSelectedFilter] = useState<FilterStatus>('toutes');
  const [searchQuery, setSearchQuery] = useState('');

  // Slices/Filters computed on the fly for statistics badge
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

    // 1. Status Filter
    if (selectedFilter !== 'toutes') {
      result = result.filter(o => o.status === selectedFilter);
    }

    // 2. Text Search queries (by order number, client name, company or email)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(o => 
        o.orderNumber.toLowerCase().includes(query) ||
        o.clientName.toLowerCase().includes(query) ||
        o.clientEmail.toLowerCase().includes(query) ||
        (o.companyName && o.companyName.toLowerCase().includes(query)) ||
        o.serviceType.toLowerCase().includes(query)
      );
    }

    // Ensure strict sorting by date descending
    return result.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt as any).getTime();
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt as any).getTime();
      return dateB - dateA;
    });
  }, [orders, selectedFilter, searchQuery]);

  const filterButtons = [
    { key: 'toutes', label: 'Toutes', count: counts.toutes, color: 'border-slate-700 bg-slate-800 text-slate-100' },
    { key: 'nouveau', label: 'Nouvelles', count: counts.nouveau, color: 'active-red border-red-500/30 bg-red-500/10 text-red-400' },
    { key: 'en_verification', label: 'En vérification', count: counts.en_verification, color: 'border-orange-500/30 bg-orange-500/10 text-orange-400' },
    { key: 'en_production', label: 'En production', count: counts.en_production, color: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400' },
    { key: 'pret', label: 'Prêtes', count: counts.pret, color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' },
    { key: 'livre', label: 'Livrées', count: counts.livre, color: 'border-green-500/30 bg-green-500/10 text-green-400' },
  ] as const;

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl max-w-lg mx-auto space-y-3 mt-10">
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <h3 className="font-extrabold text-white">Erreur de connexion Firestore</h3>
        </div>
        <p className="text-xs text-slate-400 leading-normal">
          Impossible de se synchroniser avec le gestionnaire de commandes d'impression.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" id="admin-orders-page">
      
      {/* Title segment */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Suivi des Travaux d'Impression</h1>
          <p className="text-xs text-slate-400">Gérez, estimez et suivez la fabrication de chaque commande en temps réel.</p>
        </div>
        
        {/* Simple Search bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Rechercher par # n°, client, service..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#1e293b]/70 border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-yellow-500 transition-all duration-150"
          />
        </div>
      </div>

      {/* Real-time Status filter controls */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-2.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-yellow-400" />
          <span>Filtres par Statut d'Impression</span>
        </label>
        <div className="flex flex-wrap gap-2" id="orders-filter-chips">
          {filterButtons.map((btn) => {
            const isSelected = selectedFilter === btn.key;
            return (
              <button
                key={btn.key}
                type="button"
                id={`filter-btn-${btn.key}`}
                onClick={() => setSelectedFilter(btn.key)}
                className={`py-2 px-3.5 text-xs font-bold rounded-xl border transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                  isSelected 
                    ? 'bg-yellow-500 text-slate-950 border-yellow-400 shadow-[0_4px_12px_rgba(234,179,8,0.25)]' 
                    : 'bg-[#1e293b]/50 hover:bg-[#1e293b] text-slate-300 hover:text-white border-white/5 hover:border-white/10'
                }`}
              >
                <span>{btn.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none ${
                  isSelected 
                    ? 'bg-slate-950 text-yellow-400' 
                    : 'bg-white/5 text-slate-400'
                }`}>
                  {btn.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid rendering for matching orders list */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-[#1e293b]/40 rounded-2xl h-48 border border-white/10 animate-pulse p-5 space-y-4">
              <div className="flex justify-between">
                <div className="h-4 w-20 bg-white/10 rounded"></div>
                <div className="h-4 w-16 bg-white/10 rounded"></div>
              </div>
              <div className="h-4 w-32 bg-white/10 rounded"></div>
              <div className="space-y-2 pt-4">
                <div className="h-2 w-full bg-white/10 rounded"></div>
                <div className="h-2 w-2/3 bg-white/10 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="backdrop-blur-xl bg-[#1e293b]/20 border border-white/10 rounded-2xl py-16 px-4 text-center space-y-4 max-w-2xl mx-auto mt-6">
          <div className="p-5 bg-[#1e293b]/50 border border-white/5 rounded-full inline-flex text-slate-400">
            <Inbox className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-white">Aucun travail d'impression trouvé</h3>
            <p className="text-xs text-slate-400 leading-normal max-w-sm mx-auto">
              {searchQuery.trim() 
                ? `Aucun résultat pour la recherche "${searchQuery}". Essayez un autre mot clé.` 
                : `Il n'y a actuellement aucune commande avec le statut "${selectedFilter}".`}
            </p>
          </div>
          {searchQuery.trim() && (
            <button 
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-semibold"
            >
              Réinitialiser la recherche
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-3" id="admin-orders-grid">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

    </div>
  );
}
