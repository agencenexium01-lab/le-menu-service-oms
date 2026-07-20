import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderById } from '../../../../../../lib/firebase/firestore';
import { Order } from '../../../../../../types';
import QuoteForm from '../../../../../../components/admin/QuoteForm';
import { getServiceTypeLabel } from '../../../../../../components/admin/OrderCard';
import { 
  ArrowLeft, 
  Calendar, 
  Layers, 
  AlertCircle,
  FileSignature,
  Maximize2,
  FileText
} from 'lucide-react';

export default function AdminCreateQuotePage({ params }: { params?: { id: string } }) {
  const routerParams = useParams<{ id: string }>();
  const orderId = params?.id || routerParams.id || '';

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      try {
        setLoading(true);
        setError(null);
        const orderData = await getOrderById(orderId);
        if (!orderData) {
          setError('Impossible de localiser cette commande d\'impression.');
          return;
        }
        setOrder(orderData);
      } catch (err: any) {
        console.error('Erreur lors de la récupération de la commande pour devis:', err);
        setError(err.message || 'Impossible de charger les données de la commande.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4 animate-fade-in min-h-[40vh]">
        <div className="w-10 h-10 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-slate-400 font-bold text-xs">Extraction des caractéristiques techniques de la commande...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl max-w-lg mx-auto space-y-4">
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <h3 className="font-extrabold text-white">Commande Introuvable</h3>
        </div>
        <p className="text-xs text-slate-300 leading-normal">
          {error || 'La commande spécifiée pour ce devis n\'a pas pu être extraite.'}
        </p>
        <Link 
          to="/admin/orders" 
          className="inline-flex items-center gap-2 text-xs font-bold text-yellow-400 hover:text-yellow-350"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la liste des commandes</span>
        </Link>
      </div>
    );
  }

  const getFormattedDate = (createdAt: any) => {
    if (!createdAt) return 'Date inconnue';
    const date = typeof createdAt.toDate === 'function' ? createdAt.toDate() : new Date(createdAt);
    return date.toLocaleDateString('fr-BJ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6 animate-fade-in" id="admin-create-quote-route-page">
      {/* Header Link */}
      <div className="flex items-center">
        <Link 
          to={`/admin/orders/${order.id}`} 
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white bg-white/5 border border-white/5 hover:border-white/10 px-3.5 py-2 rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retourner à la Commande #{order.orderNumber}</span>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <FileSignature className="w-7 h-7 text-yellow-500" />
            <span>Chiffrer la commande #{order.orderNumber}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Consultez les specs techniques de gauche pour estimer correctement le tarif de droite.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Order recap (read-only) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="backdrop-blur-xl bg-[#1e293b]/40 border border-white/10 rounded-3xl p-6 space-y-5">
            <h3 className="font-extrabold text-white text-sm border-b border-white/5 pb-2.5 flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" />
              <span>Récapitulatif Commande</span>
            </h3>

            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-black block tracking-wider">Service d'Impression</span>
                <span className="text-xs font-bold text-white block">{getServiceTypeLabel(order.serviceType)}</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-black block tracking-wider">Quantité Demandée</span>
                <span className="text-xs font-bold text-yellow-400 block px-2.5 py-1 bg-yellow-500/5 rounded border border-yellow-500/10 inline-block">
                  {order.quantity || 1} exemplaire{(order.quantity || 1) > 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-black block tracking-wider">Dimensions techniques</span>
                <span className="text-xs font-mono font-medium text-slate-200 block">
                  {order.dimensions?.width} x {order.dimensions?.height} {order.dimensions?.unit || 'm'}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-black block tracking-wider">Commandé le</span>
                <span className="text-xs font-medium text-slate-300 block">{getFormattedDate(order.createdAt)}</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-black block tracking-wider">Client</span>
                <span className="text-xs font-bold text-slate-200 block leading-tight">{order.clientName}</span>
                <span className="text-[10px] text-slate-400 block">{order.clientEmail}</span>
              </div>

              {order.description && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] text-slate-500 uppercase font-black block tracking-wider">Description Client</span>
                  <p className="text-xs text-slate-300 bg-slate-950/40 border border-white/5 p-3 rounded-xl leading-relaxed whitespace-pre-wrap font-medium">
                    {order.description}
                  </p>
                </div>
              )}

              {order.specialNote && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 uppercase font-black block tracking-wider text-yellow-400">Consigne Spécifique</span>
                  <p className="text-xs text-yellow-250 bg-yellow-500/5 border border-yellow-500/15 p-3 rounded-xl leading-relaxed">
                    {order.specialNote}
                  </p>
                </div>
              )}

              {/* Fichiers de maquette client */}
              {order.fileUrls && order.fileUrls.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <span className="text-[10px] text-slate-500 uppercase font-black block tracking-wider">Maquettes d'impression</span>
                  <div className="space-y-1.5">
                    {order.fileUrls.map((url, idx) => {
                      const name = order.fileNames?.[idx] || `Maquette_${idx + 1}`;
                      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(name) || url.startsWith('data:image/') || url.includes('image');
                      return (
                        <a 
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 bg-slate-950/20 border border-white/5 hover:border-white/15 rounded-xl text-[11px] text-slate-300 hover:text-white transition-all cursor-pointer truncate"
                        >
                          {isImage ? (
                            <div className="w-5 h-5 shrink-0 rounded bg-slate-800 border border-white/10 overflow-hidden">
                              <img src={url} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                          ) : (
                            <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                          )}
                          <span className="truncate flex-grow text-left">{name}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Right Side: Form Creation */}
        <div className="lg:col-span-2">
          <QuoteForm order={order} />
        </div>

      </div>

    </div>
  );
}
