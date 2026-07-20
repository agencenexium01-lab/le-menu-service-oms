import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderById, getQuoteByOrderId, getOrderStatusHistory, OrderHistoryItem } from '../../../../../lib/firebase/firestore';
import { Order, Quote } from '../../../../../types';
import QuoteViewer from '../../../../../components/client/QuoteViewer';
import OrderTimeline from '../../../../../components/client/OrderTimeline';
import { getServiceTypeLabel } from '../../../../../components/admin/OrderCard';
import { 
  ArrowLeft, 
  Calendar, 
  Layers, 
  AlertCircle,
  FileText,
  Clock,
  ExternalLink,
  Info,
  History,
  Coins,
  ArrowRightCircle,
  AlertTriangle,
  Printer
} from 'lucide-react';

export default function ClientOrderDetailPage({ params }: { params?: { id: string } }) {
  const routerParams = useParams<{ id: string }>();
  const orderId = params?.id || routerParams.id || '';

  const [order, setOrder] = useState<Order | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [history, setHistory] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      setError(null);

      // fetch order
      const orderData = await getOrderById(orderId);
      if (!orderData) {
        setError('Le numéro de commande demandé est introuvable ou vous n\'y avez pas accès.');
        return;
      }
      setOrder(orderData);

      // fetch quote
      const quoteData = await getQuoteByOrderId(orderId);
      setQuote(quoteData);

      // fetch status logs history
      const historyData = await getOrderStatusHistory(orderId);
      setHistory(historyData);

    } catch (err: any) {
      console.error('Erreur récupération détails client:', err);
      setError(err.message || 'Impossible de charger votre commande.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4 animate-fade-in min-h-[45vh]" id="order-loading-screen">
        <div className="w-10 h-10 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-slate-400 font-bold text-xs font-mono uppercase tracking-wider">Extraction de votre dossier d'impression...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl max-w-lg mx-auto space-y-4" id="order-error-screen">
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <h3 className="font-extrabold text-white">Dossier Inaccessible</h3>
        </div>
        <p className="text-xs text-slate-300 leading-normal">
          {error || 'La commande spécifiée n\'a pas pu être trouvée.'}
        </p>
        <Link 
          to="/client" 
          className="inline-flex items-center gap-2 text-xs font-bold text-green-400 hover:text-green-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à l'espace de suivi</span>
        </Link>
      </div>
    );
  }

  const getFormattedDate = (createdAt: any) => {
    if (!createdAt) return 'Non renseigné';
    const date = typeof createdAt.toDate === 'function' ? createdAt.toDate() : new Date(createdAt);
    return date.toLocaleString('fr-BJ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusChangesMapping: Record<Order['status'], string> = {
    nouveau: 'Dossier créé et transmis',
    en_verification: 'Contrôle technique de la maquette',
    devis_envoye: 'Soumission du devis commercial',
    devis_accepte: 'Devis validé par le client',
    en_production: 'Impression en cours physique',
    pret: 'Dossier prêt à l\'Atelier 🏁',
    livre: 'Travaux livrés / colis retiré',
    annule: 'Commande annulée'
  };

  return (
    <div className="space-y-6 animate-fade-in" id={`client-order-detail-page-${orderId}`}>
      
      {/* Return to workspace anchor */}
      <div className="flex items-center justify-between gap-4">
        <Link 
          to="/client" 
          className="inline-flex items-center gap-2 text-xs font-black text-slate-400 hover:text-white bg-slate-900 border border-white/5 hover:border-white/10 px-4 py-2.5 rounded-2xl transition-all no-print"
        >
          <ArrowLeft className="w-4 h-4 hover:translate-x-[-2px] transition duration-150" />
          <span>Retour au Tableau de Bord</span>
        </Link>

        {/* Print order summary button */}
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 text-xs font-black text-slate-300 hover:text-white bg-slate-900 border border-white/5 hover:border-white/10 px-4 py-2.5 rounded-2xl transition-all cursor-pointer print-button no-print"
        >
          <Printer className="w-4 h-4 text-emerald-400" />
          <span>Imprimer la fiche</span>
        </button>
      </div>

      {/* Main Order status timeline header widget */}
      <OrderTimeline status={order.status} />

      {/* Spec details layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Specification details block */}
        <div className="space-y-6 lg:col-span-1">
          <div className="backdrop-blur-xl bg-slate-900/60 border border-white/5 rounded-3xl p-6 space-y-5">
            <h3 className="font-extrabold text-white text-xs uppercase tracking-widest border-b border-white/5 pb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-green-450" />
              <span>Dossier Technique</span>
            </h3>

            <div className="space-y-4 text-xs font-semibold">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase font-black block tracking-wider">Numéro de suivi</span>
                <span className="font-mono text-xs font-bold text-white block">#{order.orderNumber}</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase font-black block tracking-wider">Type de service</span>
                <span className="text-white block font-bold">{getServiceTypeLabel(order.serviceType)}</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase font-black block tracking-wider">Quantité commandée</span>
                <span className="text-slate-200 block font-bold">
                  {order.quantity || 1} exemplaire{(order.quantity || 1) > 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase font-black block tracking-wider">Format / Dimensions</span>
                <span className="font-mono text-slate-300 block">
                  {order.dimensions?.width} x {order.dimensions?.height} {order.dimensions?.unit || 'm'}
                </span>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-white/5">
                <span className="text-[10px] text-slate-500 uppercase font-black block tracking-wider">Instructions</span>
                <p className="text-xs text-slate-300 leading-normal font-medium whitespace-pre-wrap">
                  {order.description || "Aucune description technique de besoin."}
                </p>
              </div>

              {order.specialNote && (
                <div className="space-y-1.5 pt-3 border-t border-white/5">
                  <span className="text-[10px] text-orange-400 uppercase font-black block tracking-wider">Consigne spéciale</span>
                  <p className="text-xs text-orange-300/90 leading-normal font-bold">
                    {order.specialNote}
                  </p>
                </div>
              )}

              {/* Uploaded Files items lists */}
              {order.fileUrls && order.fileUrls.length > 0 && (
                <div className="space-y-2.5 pt-3 border-t border-white/5">
                  <span className="text-[10px] text-slate-500 uppercase font-black block tracking-wider">Mes fichiers maquette</span>
                  <div className="space-y-1.5">
                    {order.fileUrls.map((url, idx) => {
                      const name = order.fileNames?.[idx] || `Maquette_Dossier_${idx + 1}`;
                      return (
                        <a 
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2.5 bg-slate-950/40 border border-white/5 hover:border-white/15 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer font-bold shrink-0 truncate"
                        >
                          <span className="truncate flex-grow text-[11px] mr-2 text-left">{name}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right commercial proposal and logs flow */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. Commercial Proposition (Quote) */}
          <div id="commercial-proposition-area">
            {quote ? (
              <QuoteViewer 
                quote={quote} 
                onResponse={fetchDetails} 
              />
            ) : (
              <div className="backdrop-blur-xl bg-slate-900/60 border border-white/5 rounded-3xl p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto text-orange-400">
                  <Clock className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="font-extrabold text-white text-sm uppercase tracking-wider">Chiffrage en cours de rédaction</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                    Nos équipes infographiques contrôlent l'intégrité de vos fichiers maquettes. 
                    Le devis officiel sera disponible ici dès validation par nos techniciens d'Atelier (12h maximum).
                  </p>
                </div>
                
                <div className="bg-white/2 p-4 rounded-2xl flex items-start gap-3 max-w-md mx-auto text-left text-xs border border-white/5 text-slate-400 font-medium leading-relaxed">
                  <Info className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                  <span>Un courriel de notification automatique vous sera envoyé dès que le prix ferme et définitif aura été déterminé.</span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Vertical timeline Status History Log */}
          <div className="backdrop-blur-xl bg-slate-900/60 border border-white/5 rounded-3xl p-6 md:p-8 space-y-5" id="status-history-log">
            <h3 className="font-extrabold text-white text-xs uppercase tracking-widest border-b border-white/5 pb-3.5 flex items-center gap-2">
              <History className="w-4 h-4 text-green-405" />
              <span>Historique des Mises à jour</span>
            </h3>

            {history.length === 0 ? (
              <div className="py-2 text-left text-xs text-slate-500 font-medium">
                Aucun changement d'état n'a été enregistré pour le moment.
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 border-l-2 border-white/5">
                {history.map((log) => {
                  const transitionLabel = statusChangesMapping[log.status] || log.status;
                  const logDate = getFormattedDate(log.changedAt);
                  
                  return (
                    <div key={log.id} className="relative space-y-1">
                      
                      {/* Circle bullet point locator */}
                      <span className="absolute -left-[31px] top-1.5 w-2 h-2 rounded-full bg-green-500 ring-4 ring-slate-900 shadow"></span>
                      
                      <div className="flex flex-wrap items-center gap-2 justify-between">
                        <h4 className="text-xs font-black text-white">{transitionLabel}</h4>
                        <span className="text-[10px] text-slate-500 font-mono">{logDate}</span>
                      </div>
                      
                      {log.note && (
                        <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                          {log.note}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
