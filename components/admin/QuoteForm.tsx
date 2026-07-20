import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { addQuote } from '../../lib/firebase/firestore';
import { Order } from '../../types';
import { Timestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { suggestQuotePrice } from '../../lib/gemini/client';
import { 
  Calculator, 
  Clock, 
  Calendar, 
  FileText, 
  Sparkles, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';

interface QuoteFormProps {
  order: Order;
  redirectUrl?: string;
}

export default function QuoteForm({ order, redirectUrl }: QuoteFormProps) {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  // Calculate default valid until (7 days from now)
  const getDefaultValidityDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  };

  const [amount, setAmount] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [deliveryDays, setDeliveryDays] = useState<number | ''>('');
  const [validityDate, setValidityDate] = useState(getDefaultValidityDate());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // States for Gemini AI suggestion
  const [iaLoading, setIaLoading] = useState(false);
  const [iaReasoning, setIaReasoning] = useState<string | null>(null);
  const [iaError, setIaError] = useState<string | null>(null);

  const handleIaSuggestion = async () => {
    setIaLoading(true);
    setIaReasoning(null);
    setIaError(null);
    try {
      const result = await suggestQuotePrice(order);
      setAmount(result.suggestedPrice);
      setIaReasoning(result.reasoning);
    } catch (err: any) {
      console.error("Erreur de suggestion IA:", err);
      setIaError("Suggestion IA indisponible. Saisissez le montant manuellement.");
    } finally {
      setIaLoading(false);
    }
  };

  // Formatter for display
  const formatXOF = (val: number | '') => {
    if (val === '') return '0 XOF';
    return `${val.toLocaleString('fr-BJ')} XOF`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order.id) return;
    if (amount === '' || amount <= 0) {
      setError('Veuillez spécifier un montant valide supérieur à 0 XOF.');
      return;
    }
    if (!description.trim()) {
      setError('Veuillez détailler les prestations ou fournitures incluses.');
      return;
    }
    if (deliveryDays === '' || deliveryDays <= 0) {
      setError('Veuillez renseigner un délai de production en jours ouvrables.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const adminId = userProfile?.uid || 'system';
      const changedBy = userProfile?.displayName || userProfile?.email || 'Administrateur Atelier';
      
      const parsedValidity = new Date(validityDate);
      // Set to end of that day (23:59:59) for full expiration coverage
      parsedValidity.setHours(23, 59, 59, 999);

      await addQuote({
        orderId: order.id,
        clientId: order.clientId,
        adminId,
        amount: Number(amount),
        description: description.trim(),
        deliveryDays: Number(deliveryDays),
        validUntil: Timestamp.fromDate(parsedValidity),
        status: 'pending'
      }, changedBy);

      // Redirect back to order detail
      navigate(redirectUrl || `/admin/orders/${order.id}`);
    } catch (err: any) {
      console.error('Erreur lors de la création du devis:', err);
      setError(err.message || 'Impossible de générer le devis. Veuillez vérifier votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="backdrop-blur-xl bg-[#1e293b]/50 border border-white/10 rounded-3xl p-6 md:p-8 space-y-6" id="admin-quote-creation-form">
      <div className="flex items-center gap-3 border-b border-white/5 pb-4">
        <Calculator className="w-5 h-5 text-yellow-400" />
        <div>
          <h3 className="font-extrabold text-white text-base">Rédiger un Devis Client officiel</h3>
          <p className="text-xs text-slate-400">Évaluez le coût d'impression, déterminez le délai et l'expiration de la proposition.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-4 rounded-xl flex items-start gap-2.5 animate-pulse">
          <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Cost Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center gap-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">
                Coût total du travail (XOF)
              </label>
              <button
                type="button"
                onClick={handleIaSuggestion}
                disabled={iaLoading}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-500/10 hover:bg-yellow-500 hover:text-slate-950 disabled:bg-slate-800 disabled:text-slate-500 text-yellow-400 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer border border-yellow-500/20 disabled:border-transparent"
                id="ai-suggestion-trigger-button"
              >
                {iaLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-yellow-400" />
                    <span>Analyse en cours...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-yellow-400" />
                    <span>Suggestion IA</span>
                  </>
                )}
              </button>
            </div>
            <div className="relative">
              <input
                type="number"
                min="0"
                placeholder="Ex : 150000"
                value={amount}
                onChange={(e) => {
                  const val = e.target.value;
                  setAmount(val === '' ? '' : Math.max(0, parseInt(val)));
                  setError(null);
                }}
                className="w-full bg-[#0f172a] border border-white/10 hover:border-white/20 focus:border-yellow-500 rounded-2xl px-4 py-3.5 pr-14 text-sm text-white font-mono focus:outline-none transition-all"
                required
              />
              <span className="absolute right-4 top-3.5 text-xs text-slate-500 font-extrabold">XOF</span>
            </div>

            {/* AI suggestion status messages */}
            {iaReasoning && (
              <div className="text-[10px] bg-yellow-550/5 text-yellow-400 border border-yellow-500/10 p-3 rounded-xl flex items-start gap-2 leading-relaxed animate-fade-in" id="ai-suggestion-bubble">
                <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-yellow-400" />
                <div>
                  <span className="font-bold block text-[11px] mb-0.5 text-white">Suggestion IA :</span>
                  {iaReasoning}
                </div>
              </div>
            )}

            {iaError && (
              <div className="text-[10px] bg-red-500/5 text-red-400 border border-red-500/10 p-3 rounded-xl flex items-start gap-2 leading-relaxed animate-fade-in" id="ai-suggestion-error">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-500" />
                <span>{iaError}</span>
              </div>
            )}
          </div>

          <div className="space-y-2 flex flex-col justify-end">
            <span className="text-[10px] uppercase font-black text-slate-500 block leading-none">Aperçu visuel pour le client :</span>
            <div className="text-2xl font-black text-yellow-400 bg-yellow-500/5 px-4 py-2.5 rounded-2xl border border-yellow-500/10 inline-block font-mono">
              {formatXOF(amount)}
            </div>
          </div>
        </div>

        {/* Deliver days and Quote valid deadline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">
              Délai de production estimé (jours ouvrables)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                placeholder="Ex : 3"
                value={deliveryDays}
                onChange={(e) => {
                  const val = e.target.value;
                  setDeliveryDays(val === '' ? '' : Math.max(1, parseInt(val)));
                  setError(null);
                }}
                className="w-full bg-[#0f172a] border border-white/10 hover:border-white/20 focus:border-yellow-500 rounded-2xl px-4 py-3.5 pr-16 text-sm text-white font-mono focus:outline-none transition-all"
                required
              />
              <span className="absolute right-4 top-3.5 text-xs text-slate-500 font-extrabold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>jours</span>
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">
              Date d'expiration / Validité de l'offre
            </label>
            <div className="relative">
              <input
                type="date"
                value={validityDate}
                onChange={(e) => {
                  setValidityDate(e.target.value);
                  setError(null);
                }}
                className="w-full bg-[#0f172a] border border-white/10 hover:border-white/20 focus:border-yellow-500 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none transition-all cursor-pointer"
                required
              />
            </div>
          </div>
        </div>

        {/* Prestations detail text */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Description détaillée des prestations (Devis visible par le client)</span>
          </label>
          <textarea
            placeholder="Détaillez ici ce que couvre ce devis (Ex: Fourniture bâche PVC 510g satinée, impression éco-solvant haute définition, pose d'oeillets métalliques tous les 50cm, renforts de bordure soudés)."
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setError(null);
            }}
            rows={5}
            className="w-full bg-[#0f172a] border border-white/10 hover:border-white/20 focus:border-yellow-500 rounded-2xl px-4 py-3.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition-all leading-relaxed"
            required
          ></textarea>
        </div>

        {/* Buttons submission */}
        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:flex-1 py-3.5 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-black rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-yellow-500/10 transition-all duration-150"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Génération & Transmission...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Générer & Expédier le Devis au Client</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate(`/admin/orders/${order.id}`)}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3.5 bg-white/5 hover:bg-white/10 text-slate-300 font-extrabold rounded-2xl text-xs border border-white/10 transition-all duration-150"
          >
            Annuler
          </button>
        </div>

      </form>
    </div>
  );
}
