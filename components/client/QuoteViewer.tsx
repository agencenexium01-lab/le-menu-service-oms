import React, { useState } from 'react';
import { Quote } from '../../types';
import { respondToQuote } from '../../lib/firebase/firestore';
import { 
  Check, 
  X, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ChevronRight,
  MessageSquare
} from 'lucide-react';

interface QuoteViewerProps {
  quote: Quote;
  onResponse: () => void;
}

export default function QuoteViewer({ quote, onResponse }: QuoteViewerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRefuseForm, setShowRefuseForm] = useState(false);
  const [refuseReason, setRefuseReason] = useState('');

  // Safe Date conversion for validUntil and respondedAt
  const getFormattedDate = (timestamp: any) => {
    if (!timestamp) return 'Non renseigné';
    const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('fr-BJ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getFullFormattedDate = (timestamp: any) => {
    if (!timestamp) return 'Non renseigné';
    const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('fr-BJ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const expirationDate = typeof quote.validUntil.toDate === 'function' 
    ? quote.validUntil.toDate() 
    : new Date(quote.validUntil as any);
  
  const isExpired = expirationDate < new Date();
  const isPending = quote.status === 'pending';

  const handleAccept = async () => {
    if (!quote.id) return;
    if (window.confirm('Voulez-vous vraiment accepter ce devis et engager la production ?')) {
      setLoading(true);
      setError(null);
      try {
        await respondToQuote(quote.id, true);
        onResponse();
      } catch (err: any) {
        console.error("Erreur d'acceptation de devis:", err);
        setError(err.message || "Une erreur est survenue lors de l'acceptation.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRefuse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote.id) return;
    setLoading(true);
    setError(null);
    try {
      await respondToQuote(quote.id, false, refuseReason.trim() || undefined);
      setShowRefuseForm(false);
      setRefuseReason('');
      onResponse();
    } catch (err: any) {
      console.error("Erreur de refus du devis:", err);
      setError(err.message || "Une erreur est survenue lors du refus.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="backdrop-blur-xl bg-[#1e293b]/50 border border-white/10 rounded-3xl p-6 md:p-8 space-y-6" id={`quote-viewer-card-${quote.id}`}>
      
      {/* Upper header segment and status banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <span className="text-[10px] text-green-400 font-extrabold tracking-widest uppercase block mb-1">PROPOSITION TARIFAIRE</span>
          <h2 className="text-lg font-black text-white">Devis d'Impression Numérique</h2>
        </div>
        <div>
          {quote.status === 'accepted' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-black rounded-full uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Devis Accepté</span>
            </span>
          )}
          {quote.status === 'refused' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black rounded-full uppercase tracking-wider">
              <XCircle className="w-3.5 h-3.5" />
              <span>Devis Refusé</span>
            </span>
          )}
          {quote.status === 'pending' && isExpired && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-black rounded-full uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
              <span>Devis Expiré</span>
            </span>
          )}
          {quote.status === 'pending' && !isExpired && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-black rounded-full uppercase tracking-wider animate-pulse">
              <Clock className="w-3.5 h-3.5" />
              <span>Devis en attente de réponse</span>
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-xs p-4 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Pricing / Mega Value Display */}
      <div className="bg-slate-950/40 border border-white/5 p-6 rounded-2xl text-center md:text-left space-y-3">
        <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block leading-none">Estimation budgétaire du devis</span>
        <div className="text-3xl md:text-4xl font-black text-green-400 font-mono tracking-tight select-all">
          {quote.amount.toLocaleString('fr-BJ')} <span className="text-xl md:text-2xl font-bold ml-1 text-green-500">XOF</span>
        </div>
        <p className="text-[10px] text-slate-400 italic font-medium">Prix net en francs CFA (Hors taxe de pose si non spécifiée).</p>
      </div>

      {/* Specifications grid splits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        
        {/* Production timeframe */}
        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-start gap-3.5">
          <Clock className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-black block tracking-wider mb-0.5">Délai estimé</span>
            <span className="text-xs font-bold text-white block">{quote.deliveryDays} jour{quote.deliveryDays > 1 ? 's' : ''} ouvrable{quote.deliveryDays > 1 ? 's' : ''}</span>
            <span className="text-[10px] text-slate-400 block mt-1">À compter de la validation définitive du devis par vos soins.</span>
          </div>
        </div>

        {/* Validity */}
        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-start gap-3.5">
          <Calendar className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-black block tracking-wider mb-0.5">Date limite de l'offre</span>
            <span className={`text-xs font-bold block ${isExpired && quote.status === 'pending' ? 'text-red-400 line-through' : 'text-white'}`}>
              {getFormattedDate(quote.validUntil)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">Après cette date, les conditions tarifaires de l'atelier sont caduques.</span>
          </div>
        </div>

      </div>

      {/* Proposition description text */}
      <div className="space-y-2">
        <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block">Détails des prestations incluses :</span>
        <div className="bg-slate-950/60 border border-white/5 p-5 rounded-2xl text-xs text-slate-200 leading-relaxed font-semibold whitespace-pre-wrap">
          {quote.description || "Aucune description fournie dans le devis."}
        </div>
      </div>

      {/* Historic Response Details */}
      {(quote.status === 'accepted' || quote.status === 'refused') && (
        <div className="bg-slate-950/40 border border-white/5 p-5 rounded-2xl space-y-3">
          <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block">Rapprochement de votre réponse client</span>
          
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Date et heure de réponse :</span>
              <span className="font-bold text-white">{getFullFormattedDate(quote.respondedAt)}</span>
            </div>
            
            {quote.status === 'accepted' ? (
              <div className="text-green-400 font-extrabold flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>Vous avez accepté cette proposition tarifaire et consenti au démarrage des tirages d'impression.</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-red-400 font-extrabold flex items-center gap-1.5">
                  <X className="w-4 h-4" />
                  <span>Vous avez décliné cette proposition.</span>
                </div>
                {quote.clientComment && (
                  <div className="bg-slate-900 border border-white/5 p-3 rounded-xl">
                    <span className="text-[10px] text-slate-500 block font-bold uppercase mb-1">Motif du refus renseigné :</span>
                    <p className="text-slate-350 italic">"{quote.clientComment}"</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pending Active Action Buttons */}
      {quote.status === 'pending' && !isExpired && (
        <div className="pt-2" id="quote-viewer-action-blocks">
          {!showRefuseForm ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleAccept}
                disabled={loading}
                className="w-full sm:flex-1 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-green-950/40 transition-all duration-150"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>✅ ACCEPTER CE DEVIS & PRODUIRE</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRefuseForm(true)}
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3.5 bg-red-600 hover:bg-red-500 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all duration-150 shadow-md shadow-red-950/20"
              >
                <X className="w-4 h-4" />
                <span>❌ REFUSER</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleRefuse} className="bg-slate-950/40 border border-red-500/20 p-5 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-red-400 pb-2 border-b border-red-500/10">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <h4 className="font-extrabold text-sm text-white">Refuser cette proposition de devis</h4>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                  <span>Raison du refus (optionnel - transmet un signal à l'infographiste de l'atelier)</span>
                </label>
                <textarea
                  placeholder="Ex : Le budget dépasse nos prévisions / Délai de livraison trop long / Rectifier dimensions d'impression..."
                  value={refuseReason}
                  onChange={(e) => setRefuseReason(e.target.value)}
                  rows={3}
                  className="w-full bg-[#0f172a] border border-white/10 hover:border-white/20 focus:border-red-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-all resize-none font-medium leading-relaxed"
                ></textarea>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-red-500/30"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirmer le refus définitif</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRefuseForm(false);
                    setRefuseReason('');
                  }}
                  disabled={loading}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl text-xs border border-white/5 transition-all"
                >
                  Annuler
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Expired alert container */}
      {quote.status === 'pending' && isExpired && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs p-4 rounded-2xl flex items-start gap-2.5">
          <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1">
            <span className="font-black uppercase tracking-wider block">⚠️ Proposition de devis échue</span>
            <p className="leading-normal font-medium text-slate-350">
              La date d'éligibilité de cette offre d'impression ({getFormattedDate(quote.validUntil)}) est expirée. Les actions d'acceptation ou de refus d'atelier sont verouillées. Veuillez solliciter un nouveau devis ou contacter le chef d'atelier par téléphone.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
