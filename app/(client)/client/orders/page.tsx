import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../../hooks/useAuth';
import { useOrders } from '../../../../hooks/useOrders';
import { getServiceTypeLabel } from '../../../../components/admin/OrderCard';
import { OrderCardSkeleton } from '../../../../components/shared/Skeleton';
import { 
  PlusCircle, 
  Layers, 
  Maximize2, 
  Calendar, 
  ChevronRight, 
  Search, 
  SlidersHorizontal,
  FolderOpen,
  Printer
} from 'lucide-react';

export default function ClientOrdersPage() {
  const { userProfile } = useAuth();
  const { orders, loading } = useOrders(userProfile?.uid);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getServiceTypeLabel(order.serviceType).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.description && order.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'active') return matchesSearch && order.status !== 'livre' && order.status !== 'annule';
    if (statusFilter === 'delivered') return matchesSearch && order.status === 'livre';
    if (statusFilter === 'cancelled') return matchesSearch && order.status === 'annule';
    return matchesSearch && order.status === statusFilter;
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'nouveau':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'en_verification':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'devis_envoye':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse';
      case 'devis_accepte':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'devis_refuse':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'en_production':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'pret':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'livre':
        return 'bg-slate-500/10 text-slate-400 border-white/5';
      case 'annule':
        return 'bg-rose-950/20 text-rose-500 border-rose-950/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-white/5';
    }
  };

  const getStatusLabelText = (status: string) => {
    switch (status) {
      case 'nouveau':
        return 'Reçu';
      case 'en_verification':
        return 'Vérification';
      case 'devis_envoye':
        return 'Deivs Reçu';
      case 'devis_accepte':
        return 'Devis Accepté';
      case 'devis_refuse':
        return 'Devis Refusé';
      case 'en_production':
        return 'Impression';
      case 'pret':
        return 'Prêt 🏁';
      case 'livre':
        return 'Livré';
      case 'annule':
        return 'Annulé';
      default:
        return status;
    }
  };

  const getFormattedDate = (createdAt: any) => {
    if (!createdAt) return 'Non renseigné';
    const date = typeof createdAt.toDate === 'function' ? createdAt.toDate() : new Date(createdAt);
    return date.toLocaleDateString('fr-BJ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6 animate-fade-in" id="client-orders-history-page">
      
      {/* Page header and action creator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 justify-between border-b border-white/5 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Mes Dossiers d'Impression</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Gérez vos spécifications d'édition, vos contrats de devis et l'état des tirages.</p>
        </div>

        <Link
          to="/client/orders/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-green-950/40 cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Nouveau tirage</span>
        </Link>
      </div>

      {/* Query filters toolbars */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900 border border-white/5 p-4 rounded-2xl w-full">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Rechercher par numéro, support..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-white/10 hover:border-white/18 focus:border-green-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-all"
          />
        </div>

        {/* Filter controls tab list */}
        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto shrink-0 font-bold text-xs scrollbar-none pb-1 md:pb-0">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 shrink-0 hidden md:block" />
          {[
            { id: 'all', label: 'Tous' },
            { id: 'active', label: 'Actifs' },
            { id: 'delivered', label: 'Livrés' },
            { id: 'cancelled', label: 'Annulés' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                statusFilter === tab.id 
                  ? 'bg-green-600/10 text-green-400 border-green-500/20' 
                  : 'bg-white/3 text-slate-400 border-transparent hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary orders table or panels */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <OrderCardSkeleton />
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </div>
      ) : orders.length === 0 ? (
        <div className="backdrop-blur-xl bg-slate-900/40 border border-dashed border-white/10 p-12 text-center rounded-3xl space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto text-green-400">
            <Printer className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black text-white">Vous n'avez pas encore de commande</h4>
            <p className="text-xs text-slate-400 leading-normal font-medium">Les fiches d'impression de vos travaux apparaîtront ici en temps réel.</p>
          </div>
          <div className="pt-2">
            <Link
              to="/client/orders/new"
              className="inline-flex items-center text-white bg-green-600 hover:bg-green-500 text-xs font-black px-5 py-2.5 rounded-xl transition-all shadow-md shadow-green-950/40 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
              <span>Passer ma première commande</span>
            </Link>
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="backdrop-blur-xl bg-slate-900/40 border border-dashed border-white/10 p-12 text-center rounded-3xl space-y-3">
          <FolderOpen className="w-10 h-10 text-slate-700 mx-auto" />
          <div className="max-w-sm mx-auto space-y-1">
            <h4 className="text-xs font-black text-white">Aucun dossier répertorié</h4>
            <p className="text-[10px] text-slate-400 leading-normal font-medium">Nous n'avons trouvé aucune fiche d'impression correspondant à vos filtres actuels.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOrders.map((order) => (
            <Link
              key={order.id}
              to={`/client/orders/${order.id}`}
              className="p-5 bg-slate-900/60 hover:bg-slate-900/80 border border-white/5 hover:border-white/12 rounded-3xl shadow-lg hover:scale-[0.99] transition-all block text-left space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5 min-w-0 flex-grow">
                  <span className="font-mono text-[9px] text-slate-500 font-extrabold block uppercase">#{order.orderNumber}</span>
                  <h4 className="text-xs font-black text-white truncate leading-snug">{getServiceTypeLabel(order.serviceType)}</h4>
                </div>
                <span className={`text-[9px] uppercase font-black px-2.5 py-0.8 border rounded-full shrink-0 ${getStatusBadgeColor(order.status)}`}>
                  {getStatusLabelText(order.status)}
                </span>
              </div>

              {order.description && (
                <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed font-semibold">
                  {order.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 text-[10px] text-slate-400 border-t border-white/5 pt-3 font-semibold">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{order.quantity} ex.</span>
                </div>

                <div className="flex items-center gap-1.5 justify-end font-mono min-w-0">
                  <Maximize2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{order.dimensions?.width} x {order.dimensions?.height} {order.dimensions?.unit || 'm'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[9px] text-slate-500 pt-2 border-t border-white/5 font-mono">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-600" /> {getFormattedDate(order.createdAt)}</span>
                <span className="text-green-400 font-extrabold flex items-center gap-0.5">Suivre <ChevronRight className="w-3 h-3" /></span>
              </div>
            </Link>
          ))}
        </div>
      )}

    </div>
  );
}
