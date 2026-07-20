import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBranches } from '@/hooks/useBranches';
import { getOrderById } from '@/lib/firebase/firestore';
import { Order } from '@/types';
import QuoteForm from '@/components/admin/QuoteForm';
import { getServiceTypeLabel } from '@/components/admin/OrderCard';
import { 
  ArrowLeft, 
  Calendar, 
  Layers, 
  AlertCircle,
  FileSignature,
  FileText
} from 'lucide-react';

export default function ChefPointCreateQuotePage() {
  const { branchId, id: orderId } = useParams<{ branchId: string; id: string }>();
  const { userProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { branches, loading: branchesLoading } = useBranches();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Security guard check
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

  // Fetch order data and verify access rights
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId || !userProfile || authLoading) return;
      try {
        setLoading(true);
        setError(null);
        const orderData = await getOrderById(orderId);
        if (!orderData) {
          setError('Impossible de localiser cette commande d\'impression.');
          return;
        }

        // Branch authority check
        if (userProfile.role === 'chef_point') {
          const hasAccess = orderData.branchId === userProfile.branchId || orderData.assignedBranchId === userProfile.branchId;
          if (!hasAccess) {
            setError("Vous n'avez pas l'autorité de chiffrer une commande rattachée à une autre succursale.");
            return;
          }
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
  }, [orderId, userProfile, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4 animate-fade-in min-h-[40vh]">
        <div className="w-10 h-10 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-slate-400 font-bold text-xs">Extraction des caractéristiques techniques de la commande...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl max-w-lg mx-auto space-y-4 mt-10">
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <h3 className="font-extrabold text-white">Commande Introuvable</h3>
        </div>
        <p className="text-xs text-slate-300 leading-normal">
          {error || 'La commande spécifiée pour ce devis n\'a pas pu être extraite.'}
        </p>
        <Link 
          to={`/pro/point/${branchId}/commandes`} 
          className="inline-flex items-center gap-2 text-xs font-bold text-yellow-400 hover:text-yellow-350"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au registre</span>
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

  const redirectUrl = `/pro/point/${branchId}/commandes/${order.id}`;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Link */}
      <div className="flex items-center">
        <Link 
          to={redirectUrl} 
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
          <p className="text-xs text-slate-400 mt-1">Consultez les specs de gauche pour chiffrer correctement le devis de droite.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Order recap (read-only) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="backdrop-blur-xl bg-[#111A36]/40 border border-white/10 rounded-3xl p-6 space-y-5">
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
            </div>
          </div>
        </div>

        {/* Right Side: Quote form with injected redirect redirection link */}
        <div className="lg:col-span-2">
          <QuoteForm order={order} redirectUrl={redirectUrl} />
        </div>

      </div>

    </div>
  );
}
