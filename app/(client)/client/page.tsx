import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useOrders } from '../../../hooks/useOrders';
import { getServiceTypeLabel } from '../../../components/admin/OrderCard';
import { 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  FileText, 
  History, 
  Maximize2,
  Calendar,
  Layers,
  ShoppingBag
} from 'lucide-react';

export default function ClientDashboardPage() {
  const { userProfile } = useAuth();
  const { orders, loading, error } = useOrders(userProfile?.uid);

  // Extract first name
  const firstName = userProfile?.displayName 
    ? userProfile.displayName.split(' ')[0] 
    : 'Partenaire';

  // Filters
  // Active: status is NOT 'livre' and NOT 'annule'
  const activeOrders = orders.filter(o => o.status !== 'livre' && o.status !== 'annule');
  
  // Completed / Delivered: status is 'livre'
  const pastOrders = orders.filter(o => o.status === 'livre');

  // Cancelled: status is 'annule'
  const cancelledOrders = orders.filter(o => o.status === 'annule');

  // Quotes Alerts: status == 'devis_envoye'
  const pendingQuoteOrders = orders.filter(o => o.status === 'devis_envoye');

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'nouveau':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'en_verification':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'devis_envoye':
        return 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
      case 'devis_accepte':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'devis_refuse':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'en_production':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'pret':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'livre':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'annule':
        return 'bg-slate-100 text-slate-400 border-slate-200 line-through';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusLabelText = (status: string) => {
    switch (status) {
      case 'nouveau':
        return 'Dossier créé';
      case 'en_verification':
        return 'Vérification en cours';
      case 'devis_envoye':
        return 'Devis reçu (À répondre)';
      case 'devis_accepte':
        return 'Devis approuvé';
      case 'devis_refuse':
        return 'Devis refusé';
      case 'en_production':
        return 'Mise sous presse';
      case 'pret':
        return 'Prêt au retrait ';
      case 'livre':
        return 'Livré / Clôturé';
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
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-7 animate-fade-in min-h-screen bg-slate-50 p-1" id="client-dashboard-page-container">
      
      {/* Upper greetings Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Bonjour, <span className="text-emerald-600">{firstName}</span>   allons imprimer!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl font-medium">
            Bienvenue sur votre espace de gestion d'atelier. Suivez l'avancement technique de vos maquettes et validez vos devis en temps réel.
          </p>
        </div>

        <Link
          to="/client/orders/new"
          className="inline-flex self-start sm:self-center items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-900/10 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>LANCER UNE NOUVELLE COMMANDE</span>
        </Link>
      </div>

      {/* RECENT PENDING QUOTE ALERTS SECTION */}
      {pendingQuoteOrders.length > 0 && (
        <div className="space-y-3" id="dashboard-quotes-alerts">
          <h3 className="text-[10px] uppercase font-black text-amber-600 tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>ACTION COMMERCIALE REQUISE ({pendingQuoteOrders.length})</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingQuoteOrders.map((order) => (
              <Link
                key={order.id}
                to={`/client/orders/${order.id}`}
                className="p-5 bg-amber-50/60 border border-amber-200 hover:border-amber-300 rounded-3xl flex items-center justify-between gap-4 transition-all hover:scale-[0.99] text-left shadow-sm"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] bg-amber-100 border border-amber-200 text-amber-800 font-bold px-1.5 py-0.5 rounded leading-none">
                      #{order.orderNumber}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Reçu le {getFormattedDate(order.createdAt)}</span>
                  </div>
                  <h4 className="text-xs font-black text-slate-900 truncate">Le devis commercial pour votre visuel est prêt</h4>
                  <p className="text-[10px] text-slate-600 truncate font-semibold">Prestation : {getServiceTypeLabel(order.serviceType)} ({order.quantity} ex.)</p>
                </div>
                
                <div className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-xl transition-all shrink-0">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CORE WORKSPACE CONTENT AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
        
        {/* Left Column: Commandes actives (Main Focus) */}
        <div className="lg:col-span-2 space-y-4" id="active-orders-section">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <h3 className="text-[10px] uppercase font-black text-slate-500 tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>TRAVAUX EN COURS DE FABRICATION ({activeOrders.length})</span>
            </h3>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">Mise à jour des dossiers en cours...</span>
            </div>
          ) : activeOrders.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-300 rounded-3xl text-center bg-white space-y-3 shadow-sm">
              <ShoppingBag className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="space-y-1 max-w-sm mx-auto">
                <h4 className="text-xs font-black text-slate-900">Aucun projet actif en ce moment</h4>
                <p className="text-[10px] text-slate-500 leading-normal font-medium">Installez votre projet d'impression numérique grand format à l'aide de notre configurateur.</p>
              </div>
              <Link
                to="/client/orders/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl transition-colors"
              >
                <span>Créer un dossier</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeOrders.map((order) => (
                <Link
                  key={order.id}
                  to={`/client/orders/${order.id}`}
                  className="p-5 bg-white border border-slate-200 hover:border-slate-300 rounded-3xl block text-left hover:scale-[0.99] transition-all relative space-y-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="space-y-1 min-w-0 flex-1">
                      <span className="font-mono text-[9px] font-black text-slate-400">#{order.orderNumber}</span>
                      <h4 className="text-xs font-black text-slate-900 truncate leading-snug">{getServiceTypeLabel(order.serviceType)}</h4>
                    </div>
                    <span className={`text-[9px] uppercase font-black px-2.5 py-0.5 border rounded-full shrink-0 ${getStatusBadgeColor(order.status)}`}>
                      {getStatusLabelText(order.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[10px] text-slate-600 border-t border-slate-100 pt-3 font-semibold">
                    <div className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate text-slate-700">{order.quantity} ex.</span>
                    </div>

                    <div className="flex items-center gap-1 justify-end font-mono">
                      <Maximize2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate text-slate-700">{order.dimensions?.width} x {order.dimensions?.height} {order.dimensions?.unit || 'm'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-slate-500 pt-2 border-t border-slate-100 font-mono">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400" /> {getFormattedDate(order.createdAt)}</span>
                    <span className="text-emerald-600 font-extrabold flex items-center gap-0.5 hover:text-emerald-700">Ouvrir <ChevronRight className="w-3 h-3" /></span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Past history log / archives */}
        <div className="space-y-4" id="historical-archives-section">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <h3 className="text-[10px] uppercase font-black text-slate-500 tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              <span>COLIS RÉCUPÉRÉS & ARCHIVES ({pastOrders.length})</span>
            </h3>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-400 font-mono text-[10px]">Chargement des archives...</div>
          ) : pastOrders.length === 0 ? (
            <div className="p-6 border border-slate-200 bg-white rounded-3xl text-center text-xs text-slate-500 leading-normal font-medium shadow-sm">
              Aucune commande historique n'est répertoriée dans vos archives.
            </div>
          ) : (
            <div className="space-y-3.5">
              {pastOrders.map((order) => (
                <Link
                  key={order.id}
                  to={`/client/orders/${order.id}`}
                  className="p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl flex items-center justify-between gap-3 text-left transition-all cursor-pointer shadow-sm"
                >
                  <div className="space-y-0.5 min-w-0 flex-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] text-slate-400 font-bold">#{order.orderNumber}</span>
                      <span className="text-[9px] text-slate-400 font-mono">{getFormattedDate(order.createdAt)}</span>
                    </div>
                    <h4 className="font-bold text-slate-800 truncate leading-tight">{getServiceTypeLabel(order.serviceType)}</h4>
                    <p className="text-[10px] text-slate-500 font-medium">Quantité : {order.quantity} ex.</p>
                  </div>
                  
                  <div className="p-1 px-2.5 bg-slate-50 text-slate-600 border border-slate-200 font-bold text-[9px] rounded-lg shrink-0">
                    Livré
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}