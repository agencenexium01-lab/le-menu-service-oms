import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBranches } from '@/hooks/useBranches';
import { createManualOrder } from '@/lib/firebase/firestore';
import { ServiceType, SERVICE_LABELS } from '@/types';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Save, 
  FileText, 
  Phone, 
  User, 
  Building, 
  Coins, 
  MessageSquare,
  Plus
} from 'lucide-react';

export default function NouvelleCommandeManuellePage() {
  const { branchId } = useParams<{ branchId: string }>();
  const { userProfile, loading: authLoading } = useAuth();
  const { branches, loading: branchesLoading } = useBranches();
  const navigate = useNavigate();

  // Guard security
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
          navigate(`/pro/point/${userProfile.branchId}/commandes`);
          return;
        }
      }
    }
  }, [userProfile, authLoading, branchId, navigate]);

  const currentBranch = branches.find(b => b.id === branchId);

  // Form states
  const [walkInClientName, setWalkInClientName] = useState('');
  const [walkInClientPhone, setWalkInClientPhone] = useState('');
  const [walkInClientCompany, setWalkInClientCompany] = useState('');
  
  const [serviceType, setServiceType] = useState<ServiceType>('impression_grand_format');
  const [description, setDescription] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [unit, setUnit] = useState<'cm' | 'm'>('m');
  const [quantity, setQuantity] = useState(1);
  const [manualOrderNote, setManualOrderNote] = useState('');
  const [amount, setAmount] = useState('');

  // Status states
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string | null>(null);

  const handleReset = () => {
    setWalkInClientName('');
    setWalkInClientPhone('');
    setWalkInClientCompany('');
    setServiceType('impression_grand_format');
    setDescription('');
    setWidth('');
    setHeight('');
    setUnit('m');
    setQuantity(1);
    setManualOrderNote('');
    setAmount('');
    setErrorMsg(null);
    setSuccessMsg(null);
    setCreatedOrderNumber(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    // Validation
    if (!walkInClientName.trim()) {
      setErrorMsg('Le nom complet du client est requis.');
      return;
    }
    if (!walkInClientPhone.trim()) {
      setErrorMsg('Le numéro de téléphone du client est requis.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('La description de la commande est requise.');
      return;
    }
    if (quantity <= 0) {
      setErrorMsg('La quantité doit être supérieure ou égale à 1.');
      return;
    }

    setSubmitting(true);

    try {
      if (!userProfile) throw new Error('Utilisateur non authentifié.');

      const creator = {
        uid: userProfile.uid,
        name: userProfile.displayName || userProfile.email,
        branchId: branchId || 'OMS',
        branchName: currentBranch ? currentBranch.name : 'OMS Central'
      };

      const dimensionData = (width && height) ? {
        width: Number(width),
        height: Number(height),
        unit
      } : undefined;

      const orderData = {
        serviceType,
        description,
        dimensions: dimensionData,
        quantity,
        walkInClientName: walkInClientName.trim(),
        walkInClientPhone: walkInClientPhone.trim(),
        walkInClientCompany: walkInClientCompany.trim() || undefined,
        manualOrderNote: manualOrderNote.trim() || undefined,
        amount: amount ? Number(amount) : undefined
      };

      const orderId = await createManualOrder(orderData, creator);
      
      // Compute display order number
      // We can query its doc or just build a message. Let's redirect or show a beautiful message.
      setCreatedOrderNumber('Nouvelle commande');
      setSuccessMsg('✓ Commande enregistrée avec succès !');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Une erreur est survenue lors de l\'enregistrement.');
    } finally {
      setSubmitting(false);
    }
  };

  if (successMsg) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="backdrop-blur-xl bg-[#111A36]/80 border border-emerald-500/30 rounded-3xl p-8 text-center space-y-6 shadow-2xl animate-fade-in text-white">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight text-white">Enregistrement Réussi !</h2>
            <p className="text-slate-300 text-sm max-w-md mx-auto">
              La commande physique a été enregistrée à votre point de vente et configurée directement dans l'état <span className="text-emerald-400 font-extrabold uppercase">"En production"</span>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={handleReset}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-indigo-650 hover:bg-indigo-600 text-white font-extrabold shadow-lg transition-all active:scale-95 text-sm flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Prendre une autre commande
            </button>
            <Link
              to={`/pro/point/${branchId}/commandes`}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 font-bold transition-all text-sm block"
            >
              Retourner au registre
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      
      {/* Header element */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to={`/pro/point/${branchId}/commandes`}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl transition-all"
            title="Retour au registre"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-400 font-bold block">
              {currentBranch ? currentBranch.name : 'SIÈGE'}
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">Saisie d'une Commande Physique</h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Error Notification */}
        {errorMsg && (
          <div className="p-4 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-350 text-xs font-semibold leading-relaxed animate-shake">
            {errorMsg}
          </div>
        )}

        {/* SECTION 1: LE CLIENT WALK-IN */}
        <div className="backdrop-blur-xl bg-[#111A36]/60 border border-[#2B3553]/40 rounded-3xl p-6 space-y-4 shadow-xl">
          <h3 className="text-xs font-extrabold text-blue-400 uppercase tracking-widest flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>Fiche Client (Comptoir)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider text-[10px]">
                Nom Complet du Client *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Ex: Jean Dupont"
                  value={walkInClientName}
                  onChange={(e) => setWalkInClientName(e.target.value)}
                  className="w-full pl-3 pr-3 py-2.5 bg-slate-950/60 border border-[#2B3553] text-white rounded-xl placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider text-[10px]">
                Numéro de Téléphone *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder="Ex: +229 97 00 00 00"
                  value={walkInClientPhone}
                  onChange={(e) => setWalkInClientPhone(e.target.value)}
                  className="w-full pl-3 pr-3 py-2.5 bg-slate-950/60 border border-[#2B3553] text-white rounded-xl placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider text-[10px]">
              Nom de l'Entreprise / Organisation (Optionnel)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ex: NEXIUM Benis"
                value={walkInClientCompany}
                onChange={(e) => setWalkInClientCompany(e.target.value)}
                className="w-full pl-3 pr-3 py-2.5 bg-slate-950/60 border border-[#2B3553] text-white rounded-xl placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs font-semibold"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: LA COMMANDE */}
        <div className="backdrop-blur-xl bg-[#111A36]/60 border border-[#2B3553]/40 rounded-3xl p-6 space-y-4 shadow-xl">
          <h3 className="text-xs font-extrabold text-brand-pink uppercase tracking-widest flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>Spécifications de la Commande</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider text-[10px]">
                Type de Service *
              </label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as ServiceType)}
                className="w-full py-2.5 px-3 bg-slate-950/60 border border-[#2B3553] text-white rounded-xl focus:outline-none focus:border-indigo-500 text-xs font-bold"
              >
                {Object.entries(SERVICE_LABELS).map(([key, value]) => (
                  <option key={key} value={key} className="bg-[#111A36] text-white font-semibold">
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider text-[10px]">
                Quantité d'Exemplaires *
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full pl-3 pr-3 py-2.5 bg-slate-950/60 border border-[#2B3553] text-white rounded-xl focus:outline-none focus:border-indigo-500 text-xs font-extrabold"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.2">
              <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                Description du Travail et Options *
              </label>
              <span className="text-[9px] text-slate-500 font-bold">
                {description.length}/300 caractères
              </span>
            </div>
            <textarea
              required
              maxLength={300}
              placeholder="Décrivez précisément ce qui a été demandé (Ex: Impression bâche 440g mate, œillets tous les 50cm, ourlet de renfort)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full p-3 bg-slate-950/60 border border-[#2B3553] text-white rounded-xl placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs font-medium leading-relaxed resize-none"
            />
          </div>

          {/* Optional dimensions block */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <span className="block text-slate-400 font-black uppercase text-[10px] tracking-wider">
              Dimensions Spécifiques (Optionnel)
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <input
                  type="number"
                  step="any"
                  placeholder="Largeur"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="w-full text-center py-2 bg-slate-950/60 border border-[#2B3553] text-white rounded-xl placeholder-slate-500 text-xs font-bold"
                />
              </div>
              <div>
                <input
                  type="number"
                  step="any"
                  placeholder="Hauteur"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full text-center py-2 bg-slate-950/60 border border-[#2B3553] text-white rounded-xl placeholder-slate-500 text-xs font-bold"
                />
              </div>
              <div>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as 'cm' | 'm')}
                  className="w-full text-center py-2 bg-slate-950/60 border border-[#2B3553] text-white rounded-xl focus:outline-none text-xs font-extrabold"
                >
                  <option value="m">Mètre (m)</option>
                  <option value="cm">Centimètre (cm)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: TRANSACTION & OPTIONS */}
        <div className="backdrop-blur-xl bg-[#111A36]/60 border border-[#2B3553]/40 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                <Coins className="w-4 h-4" />
                <span>Tarification Express</span>
              </h3>
              <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider text-[10px]">
                Montant convenu (XOF)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  placeholder="Ex: 15000 (Générera un devis accepté)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-950/60 border border-[#2B3553] text-emerald-400 rounded-xl focus:outline-none focus:border-indigo-500 text-xs font-black placeholder-slate-600"
                />
              </div>
              <p className="text-[9px] text-slate-400 mt-1 font-semibold leading-normal">
                Si ce champ est rempli, un devis au statut <span className="text-emerald-400 font-extrabold uppercase">"Accepté"</span> sera généré automatiquement et associé à la commande.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-extrabold text-purple-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4" />
                <span>Notes de Direction</span>
              </h3>
              <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider text-[10px]">
                Note Interne
              </label>
              <textarea
                placeholder="Ex: Maquette apportée sur clé USB, paiement complet par Mobile Money reçu."
                value={manualOrderNote}
                onChange={(e) => setManualOrderNote(e.target.value)}
                rows={2}
                className="w-full p-2.5 bg-slate-950/60 border border-[#2B3553] text-white rounded-xl placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs font-medium leading-relaxed resize-none"
              />
            </div>
          </div>
        </div>

        {/* Form controls */}
        <div className="flex gap-3 justify-end items-center">
          <Link
            to={`/pro/point/${branchId}/commandes`}
            className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 text-xs font-bold transition-all"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-950/35 active:scale-95"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'Enregistrement...' : 'Enregistrer la commande'}
          </button>
        </div>

      </form>
    </div>
  );
}
