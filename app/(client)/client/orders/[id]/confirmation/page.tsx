import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderById } from '@/lib/firebase/firestore';
import { Order, SERVICE_LABELS } from '@/types';
import { 
  CheckCircle2, 
  ArrowRight, 
  MessageSquare, 
  FileText, 
  MapPin, 
  Maximize2, 
  Loader2,
  Calendar
} from 'lucide-react';

export default function ClientOrderConfirmationPage({ params }: { params?: { id: string } }) {
  const routerParams = useParams<{ id: string }>();
  const orderId = params?.id || routerParams.id || '';

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) return;
      try {
        setLoading(true);
        const data = await getOrderById(orderId);
        if (!data) {
          setError("Impossible de trouver les détails de cette commande.");
        } else {
          setOrder(data);
        }
      } catch (err: any) {
        console.error("Error fetching order confirmation details:", err);
        setError("Erreur de communication avec le serveur.");
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4 animate-fade-in min-h-[45vh]">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <div className="text-slate-400 font-bold text-xs font-mono uppercase tracking-wider">Chargement de votre confirmation...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl max-w-lg mx-auto space-y-4 text-center mt-10">
        <p className="text-slate-300 text-sm">{error || "Commande introuvable."}</p>
        <Link 
          to="/client" 
          className="inline-flex items-center gap-2 text-xs font-bold text-green-400 hover:text-green-300 bg-white/5 px-4 py-2 rounded-xl border border-white/5"
        >
          <span>Retourner à l'accueil</span>
        </Link>
      </div>
    );
  }

  const clientName = order.walkInClientName || order.clientName || 'Client';
  const serviceLabel = SERVICE_LABELS[order.serviceType] || order.serviceType;
  
  // Format WhatsApp message text
  const waText = encodeURIComponent(
    `Bonjour Le Menu Service, je viens de soumettre ma commande #${order.orderNumber} pour le service "${serviceLabel}". Pouvez-vous s'il vous plaît valider mon dossier ? Merci !`
  );
  const whatsAppUrl = `https://wa.me/2290196100789?text=${waText}`;

  return (
    <div className="max-w-xl mx-auto py-8 px-4" id="order-submit-confirmation-view">
      
      {/* Animated Success Checkmark Ring */}
      <div className="flex flex-col items-center justify-center text-center space-y-5 mb-8">
        <div className="relative">
          {/* Subtle pulsating back glows */}
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
          <div className="relative w-20 h-20 rounded-full bg-[#101b33] border-4 border-emerald-500 flex items-center justify-center shadow-2xl animate-bounce duration-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-pulse duration-1000" />
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full inline-block">
            SOUVENIR ENREGISTRÉ ! 🎉
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Commande Autorisée !
          </h2>
          <p className="text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
            Votre dossier d'impression <strong className="text-emerald-400 font-mono">#{order.orderNumber}</strong> a bien été transmis aux techniciens de l'Atelier.
          </p>
        </div>
      </div>

      {/* Recapitulatif Card */}
      <div className="bg-[#111A36]/45 border border-white/5 rounded-3xl p-6 space-y-4 shadow-xl">
        <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2 pb-3 border-b border-white/5">
          <FileText className="w-4 h-4 text-blue-400" />
          Récapitulatif de la commande
        </h3>

        <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Prestation</span>
            <span className="text-white font-bold">{serviceLabel}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Quantité</span>
            <span className="text-white font-bold">{order.quantity} ex.</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Dimensions</span>
            <span className="text-white font-mono font-bold">
              {order.dimensions?.width} &times; {order.dimensions?.height} {order.dimensions?.unit}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Siège de traitement</span>
            <span className="text-white font-bold flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              {order.branchName || 'Siège Principal'}
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5 bg-slate-900/40 -mx-6 -mb-6 p-6 rounded-b-3xl">
          <p className="text-[11px] text-slate-400 leading-normal flex items-start gap-2.5">
            <span className="w-2 h-2 mt-1 rounded-full bg-blue-400 animate-ping shrink-0" />
            <span>
              <strong>Indication :</strong> Notre équipe est actuellement en cours de vérification de votre gabarit. Vous recevrez une alerte en temps réel dès que l'estimation tarifaire sera validée !
            </span>
          </p>
        </div>
      </div>

      {/* Sticky Action Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
        {/* Confirmer via WhatsApp */}
        <a
          href={whatsAppUrl}
          target="_blank"
          referrerPolicy="no-referrer"
          rel="noopener noreferrer"
          className="px-5 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-950/20 hover:scale-[1.01] active:scale-95 duration-100"
        >
          <MessageSquare className="w-4 h-4 fill-white text-emerald-600" />
          <span>Confirmer via WhatsApp</span>
        </a>

        {/* Suivre ma commande */}
        <Link
          to={`/client/orders/${order.id}`}
          className="px-5 py-3.5 bg-indigo-650 hover:bg-indigo-600 border border-white/5 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 duration-100"
        >
          <span>Suivre ma commande</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  );
}
