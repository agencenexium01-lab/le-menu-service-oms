import React, { useState } from 'react';
import { Order } from '../../types';
import { updateOrder, addOrderStatusHistory, createNotification } from '../../lib/firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { getStatusLabel } from './StatusBadge';
import { 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  Edit3, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface OrderStatusUpdaterProps {
  order: Order;
  onStatusUpdated: () => void;
}

type OrderStatus = Order['status'];

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  nouveau: ['en_verification', 'annule'],
  en_verification: ['devis_envoye', 'annule'],
  devis_envoye: ['annule'], // Waiting for client action - no manual progression besides cancel
  devis_accepte: ['en_production', 'annule'],
  en_production: ['pret', 'annule'],
  pret: ['livre'],
  livre: [],
  annule: []
};

export default function OrderStatusUpdater({ order, onStatusUpdated }: OrderStatusUpdaterProps) {
  const { userProfile } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const currentStatus = order.status;
  const nextOptions = ALLOWED_TRANSITIONS[currentStatus] || [];
  const isTerminal = nextOptions.length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatus) {
      setError('Veuillez sélectionner un nouveau statut.');
      return;
    }
    if (!order.id) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const changedBy = userProfile?.displayName || userProfile?.email || 'Administrateur OMS';
      
      // 1. Update the order object
      await updateOrder(order.id, {
        status: selectedStatus
      });

      // 2. Add document in history subcollection
      await addOrderStatusHistory(order.id, selectedStatus, changedBy, note);

      // 3. Create client notification
      const newStatusText = getStatusLabel(selectedStatus);
      await createNotification({
        userId: order.clientId,
        type: 'status_updated',
        title: `Mise à jour : Commande #${order.orderNumber}`,
        message: `Le statut de votre impression numérique est désormais "${newStatusText}".${note ? ` Note de l'atelier : "${note}"` : ''}`,
        orderId: order.id,
        read: false
      });

      setSuccess(true);
      setNote('');
      setSelectedStatus('');
      
      // Trigger parent update
      onStatusUpdated();
    } catch (err: any) {
      console.error('Erreur lors du changement de statut:', err);
      setError(err.message || 'Impossible de mettre à jour le statut. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (isTerminal) {
    return (
      <div className="bg-[#1e293b]/40 border border-white/5 rounded-2xl p-5 text-slate-400 text-xs">
        <p className="font-extrabold text-slate-300 mb-1">🏁 Statut terminal atteint</p>
        <p className="leading-relaxed">
          Cette commande a été marquée comme <span className="text-yellow-400 font-bold">"{getStatusLabel(currentStatus)}"</span>.
          Aucun autre changement de statut d'impression direct n'est possible à cette étape.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#1e293b]/50 border border-white/10 rounded-2xl p-6 space-y-4" id="order-status-updater-card">
      <div className="flex items-center gap-2 border-b border-white/5 pb-3">
        <Edit3 className="w-4 h-4 text-yellow-400" />
        <h4 className="font-extrabold text-white text-sm">Contrôle d'Atelier & Progression</h4>
      </div>

      {currentStatus === 'devis_envoye' && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs p-3.5 rounded-xl leading-relaxed space-y-1">
          <span className="font-extrabold block">⏳ En attente du client</span>
          <span>
            Le devis a été envoyé. Le client doit cliquer sur "Accepter le devis" depuis son espace personnel pour engager la production. Seule l'annulation est manuelle actuellement.
          </span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3.5 rounded-xl flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs p-3.5 rounded-xl flex items-start gap-2.5">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Statut mis à jour avec succès ! L'historique et la notification client ont été générés.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
            Nouveau Statut de l'Atelier
          </label>
          <div className="grid grid-cols-1 gap-2">
            {nextOptions.map((statusOption) => {
              const isSelected = selectedStatus === statusOption;
              const isCancelOpt = statusOption === 'annule';
              return (
                <button
                  key={statusOption}
                  type="button"
                  onClick={() => {
                    setSelectedStatus(statusOption);
                    setSuccess(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? isCancelOpt 
                        ? 'bg-red-500/10 text-red-400 border-red-500/40 shadow-[0_4px_12px_rgba(239,68,68,0.15)]'
                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 shadow-[0_4px_12px_rgba(234,179,8,0.15)]'
                      : 'bg-slate-900/50 hover:bg-slate-900 text-slate-300 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-yellow-400' : 'text-slate-500'}`} />
                    <span>{getStatusLabel(statusOption)}</span>
                  </div>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
            Observation / Justification (Historique & Notification client)
          </label>
          <textarea
            placeholder="Ex: Impression grand format lancée / Fichier validé par l'infographiste..."
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setSuccess(false);
            }}
            rows={3}
            className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 transition-all duration-150 resize-none font-medium leading-relaxed"
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={loading || !selectedStatus}
          className={`w-full py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
            !selectedStatus
              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              : selectedStatus === 'annule'
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950/20'
                : 'bg-yellow-500 hover:bg-yellow-450 text-slate-950 font-black shadow-lg shadow-yellow-500/10'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Mise à jour en cours...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Appliquer le Statut d'Impression</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
