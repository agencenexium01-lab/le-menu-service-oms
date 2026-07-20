import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase/config';
import { createOrder, createNotification } from '../../lib/firebase/firestore';
import FileUpload from './FileUpload';
import { useAuth } from '../../hooks/useAuth';
import { SERVICE_LABELS, ServiceType } from '../../types';
import { 
  ArrowRight, 
  ArrowLeft, 
  Layers, 
  Maximize2, 
  Hash, 
  FileText, 
  CheckCircle2,
  Loader2,
  Info
} from 'lucide-react';

export default function OrderForm() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 Form States
  const [serviceType, setServiceType] = useState<string>('impression_grand_format');
  const [width, setWidth] = useState<number>(1);
  const [height, setHeight] = useState<number>(1);
  const [unit, setUnit] = useState<'cm' | 'm'>('m');
  const [quantity, setQuantity] = useState<number>(1);
  const [description, setDescription] = useState<string>('');
  const [specialNote, setSpecialNote] = useState<string>('');

  // Contextual Field States
  const [tiragesCount, setTiragesCount] = useState<number>(6);
  const [participantsCount, setParticipantsCount] = useState<number>(1);
  const [disponibilites, setDisponibilites] = useState<string>('');
  
  // Textile sizes
  const [selectedSizes, setSelectedSizes] = useState<Record<string, boolean>>({
    XS: false, S: false, M: false, L: false, XL: false, XXL: false
  });
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>({
    XS: 1, S: 1, M: 1, L: 1, XL: 1, XXL: 1
  });

  // Optional delay field
  const [delaiSouhaite, setDelaiSouhaite] = useState<string>('Pas de préférence');

  // Selected annex preference
  const [preferredBranch, setPreferredBranch] = useState<string>('aucun');

  // Step 2 Upload states
  const [uploadedFiles, setUploadedFiles] = useState<{ url: string; name: string }[]>([]);

  const isPhotoIdentite = serviceType === 'photo_identite';
  const isFormation = serviceType === 'formation_bureautique' || serviceType === 'formation_graphisme';
  const isTextile = serviceType === 'impression_textile';

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isFormation && description.trim().length < 20) {
      setError('La description du travail doit faire au moins 20 caractères pour guider l\'estimateur.');
      return;
    }

    if (isFormation) {
      if (participantsCount < 1) {
        setError('Le nombre de participants doit être supérieur ou égal à 1.');
        return;
      }
      if (!disponibilites.trim()) {
        setError('Veuillez préciser vos disponibilités souhaitées.');
        return;
      }
    } else if (isTextile) {
      const hasSelectedSize = Object.values(selectedSizes).some(checked => checked);
      if (!hasSelectedSize) {
        setError('Veuillez sélectionner au moins une taille pour votre textile.');
        return;
      }
    } else {
      if (width <= 0 || height <= 0) {
        setError('Les dimensions spécifiques doivent être strictement supérieures à zéro.');
        return;
      }
      if (quantity < 1) {
        setError('La quantité doit être supérieure ou égale à 1.');
        return;
      }
    }

    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) {
      setError('Vous devez être authentifié pour soumettre une commande.');
      return;
    }

    if (!isFormation && uploadedFiles.length === 0) {
      setError('Veuillez téléverser au moins un fichier de maquette d\'impression.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const ordersSnap = await getDocs(collection(db, 'orders'));
      const sequence = String(ordersSnap.size + 1).padStart(3, '0');
      const currentYear = new Date().getFullYear();
      const orderNumber = `LMS-${currentYear}-${sequence}`;

      const fileUrls = uploadedFiles.map(f => f.url);
      const fileNames = uploadedFiles.map(f => f.name);

      let finalDimensions = { width: Number(width), height: Number(height), unit };
      if (isPhotoIdentite) {
        finalDimensions = { width: 3.5, height: 4.5, unit: 'cm' };
      } else if (isFormation || isTextile) {
        finalDimensions = { width: 0, height: 0, unit: 'cm' };
      }

      let finalQuantity = Number(quantity);
      if (isPhotoIdentite) {
        finalQuantity = Number(tiragesCount);
      } else if (isFormation) {
        finalQuantity = Number(participantsCount);
      } else if (isTextile) {
        finalQuantity = Object.entries(sizeQuantities)
          .filter(([size]) => selectedSizes[size])
          .reduce((sum, [_, qty]) => sum + (Number(qty) || 0), 0);
      }

      let finalDescription = description.trim();
      let finalSpecialNote = specialNote.trim();

      if (isPhotoIdentite) {
        finalDescription = `[PHOTO D'IDENTITÉ]\nFormat standard 3.5cm × 4.5cm\nNombre de tirages souhaités : ${tiragesCount}\n\n${finalDescription}`;
      } else if (isFormation) {
        const title = serviceType === 'formation_bureautique' ? 'FORMATION BUREAUTIQUE' : 'FORMATION GRAPHISME PAO';
        finalDescription = `[${title}]\nNombre de participants : ${participantsCount}\nDisponibilités souhaitées : ${disponibilites.trim()}\n\n${finalDescription || 'Formation certifiante et intensive dispensée par des formateurs certifiés.'}`;
      } else if (isTextile) {
        const sizesStr = Object.entries(sizeQuantities)
          .filter(([size]) => selectedSizes[size])
          .map(([size, qty]) => `${size}: ${qty} ex`)
          .join(', ');
        finalDescription = `[IMPRESSION TEXTILE]\nTailles demandées (Détail) : ${sizesStr}\n\n${finalDescription}`;
      }

      if (delaiSouhaite && delaiSouhaite !== 'Pas de préférence') {
        finalSpecialNote = `Délai souhaité : ${delaiSouhaite}${finalSpecialNote ? ` | Consigne : ${finalSpecialNote}` : ''}`;
      }

      const targetBranchId = preferredBranch === 'aucun' ? 'annexe_1' : preferredBranch;

      const payload = {
        orderNumber,
        clientId: user.uid,
        clientName: userProfile.displayName || user.email || 'Client Anonyme',
        clientEmail: user.email || '',
        serviceType: serviceType as ServiceType,
        description: finalDescription,
        dimensions: finalDimensions,
        quantity: finalQuantity,
        fileUrls,
        fileNames,
        status: 'nouveau' as const,
        specialNote: finalSpecialNote || undefined,
        branchId: targetBranchId,
        assignedBranchId: targetBranchId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const orderId = await createOrder(payload);

      const adminsQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
      const adminsSnap = await getDocs(adminsQuery);
      
      const adminNotifyPromises = adminsSnap.docs.map(async (adminDoc) => {
        return createNotification({
          userId: adminDoc.id,
          type: 'new_order',
          title: 'Nouvelle commande',
          message: `Le client ${payload.clientName} a soumis le dossier #${orderNumber} (${payload.quantity} ex.).`,
          orderId: orderId,
          read: false
        });
      });

      try {
        await Promise.all(adminNotifyPromises);
      } catch (notifyErr) {
        console.warn("Erreur lors de la création d'une notification admin:", notifyErr);
      }

      navigate(`/client/orders/${orderId}/confirmation`);

    } catch (err: any) {
      console.error("Erreur de création de commande:", err);
      setError(err.message || 'Une erreur imprévue est survenue lors de la soumission de votre projet.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="backdrop-blur-xl bg-slate-900/60 border border-white/15 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl" id="client-order-builder-form">
      
      {/* Wizard Progress Stepper */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest block mb-0.5">CONFIGURATEUR</span>
          <h2 className="text-lg font-black text-white tracking-wide">Création du Dossier d'Impression</h2>
        </div>
        
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span className={`px-2.5 py-1 rounded-lg border ${step === 1 ? 'bg-emerald-600 text-white border-emerald-500 font-bold shadow-md shadow-emerald-950/50' : 'bg-slate-950/50 text-slate-300 border-white/5'}`}>
            1. Caractéristiques
          </span>
          <span className="text-slate-400 font-bold">→</span>
          <span className={`px-2.5 py-1 rounded-lg border ${step === 2 ? 'bg-emerald-600 text-white border-emerald-500 font-bold shadow-md shadow-emerald-950/50' : 'bg-slate-950/50 text-slate-300 border-white/5'}`}>
            2. Maquettes
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-start gap-3 shadow-sm">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={handleNextStep} className="space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Service Type Selection */}
            <div className={`space-y-2 ${(!isFormation && !isPhotoIdentite && !isTextile) ? '' : 'md:col-span-2'}`}>
              <label className="text-[11px] uppercase font-bold tracking-wider text-slate-200 block flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Support / Type de Prestation</span>
              </label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full bg-slate-950 border border-white/20 hover:border-white/40 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs text-white focus:outline-none transition-all font-semibold cursor-pointer shadow-inner"
              >
                {Object.entries(SERVICE_LABELS).map(([key, label]) => (
                  <option key={key} value={key} className="bg-slate-950 text-white">
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Standard Quantity */}
            {!isFormation && !isPhotoIdentite && !isTextile && (
              <div className="space-y-2">
                <label className="text-[11px] uppercase font-bold tracking-wider text-slate-200 block flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Quantité d'exemplaires</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-950 border border-white/20 hover:border-white/40 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs text-white focus:outline-none transition-all font-mono font-bold shadow-inner"
                />
              </div>
            )}
          </div>

          {/* Photo Identité contextual widgets */}
          {isPhotoIdentite && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[11px] uppercase font-bold tracking-wider text-slate-200 block flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Nombre de tirages souhaités</span>
                </label>
                <select
                  value={tiragesCount}
                  onChange={(e) => setTiragesCount(parseInt(e.target.value) || 6)}
                  className="w-full bg-slate-950 border border-white/20 hover:border-white/40 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs text-white focus:outline-none transition-all font-semibold cursor-pointer shadow-inner"
                >
                  <option value={6} className="bg-slate-950 text-white">6 tirages</option>
                  <option value={12} className="bg-slate-950 text-white">12 tirages</option>
                  <option value={24} className="bg-slate-950 text-white">24 tirages</option>
                  <option value={48} className="bg-slate-950 text-white">48 tirages</option>
                </select>
              </div>
              
              <div className="space-y-2 flex flex-col justify-end">
                <div className="bg-slate-950/60 p-4 border border-white/10 rounded-xl shadow-inner">
                  <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 block mb-0.5">Note technique</span>
                  <p className="text-xs font-semibold text-slate-200">Format d'impression officiel standard : 3.5cm × 4.5cm</p>
                </div>
              </div>
            </div>
          )}

          {/* Formations contextual widgets */}
          {isFormation && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[11px] uppercase font-bold tracking-wider text-slate-200 block flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Nombre de participants</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={participantsCount}
                  onChange={(e) => setParticipantsCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-950 border border-white/20 hover:border-white/40 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs text-white focus:outline-none transition-all font-mono font-bold shadow-inner"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] uppercase font-bold tracking-wider text-slate-200 block flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Disponibilités souhaitées (semaine, heures...)</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Ex: Les lundis, mercredis et vendredis après-midi de 15h à 18h..."
                  value={disponibilites}
                  onChange={(e) => setDisponibilites(e.target.value)}
                  className="w-full bg-slate-950 border border-white/20 hover:border-white/40 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-400 focus:outline-none transition-all resize-none font-medium text-justify shadow-inner"
                ></textarea>
              </div>
            </div>
          )}

          {/* Textile sizes contextual widgets */}
          {isTextile && (
            <div className="space-y-4">
              <label className="text-[11px] uppercase font-bold tracking-wider text-slate-200 block flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Taille(s) souhaitée(s) et quantité par taille</span>
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                  <div key={size} className="bg-slate-950/60 p-3.5 border border-white/15 rounded-xl flex flex-col items-center gap-2 shadow-sm">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selectedSizes[size] || false}
                        onChange={(e) => setSelectedSizes({...selectedSizes, [size]: e.target.checked})}
                        className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                      />
                      <span className="text-xs font-black text-white">{size}</span>
                    </label>
                    
                    {selectedSizes[size] && (
                      <input
                        type="number"
                        min="1"
                        required
                        value={sizeQuantities[size] || 1}
                        onChange={(e) => setSizeQuantities({...sizeQuantities, [size]: Math.max(1, parseInt(e.target.value) || 1)})}
                        className="w-full text-center bg-slate-900 border border-emerald-500 rounded px-2 py-1 text-xs text-white font-mono font-bold shadow-inner"
                        placeholder="Qté"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dims and units section for Standard services */}
          {!isPhotoIdentite && !isFormation && !isTextile && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] uppercase font-bold tracking-wider text-slate-200 block flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Dimensions d'Impression</span>
                </label>
                
                {/* Unit Toggle */}
                <div className="bg-slate-950 border border-white/15 rounded-lg p-0.5 flex gap-1 text-[10px] shadow-inner">
                  <button
                    type="button"
                    onClick={() => setUnit('cm')}
                    className={`px-2.5 py-1 rounded font-black duration-150 transition-colors ${unit === 'cm' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'}`}
                  >
                    CM
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnit('m')}
                    className={`px-2.5 py-1 rounded font-black duration-150 transition-colors ${unit === 'm' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'}`}
                  >
                    Mètres
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="Largeur"
                    value={width}
                    onChange={(e) => setWidth(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-white/20 hover:border-white/40 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs text-white focus:outline-none transition-all font-mono font-bold shadow-inner"
                  />
                  <span className="absolute right-3.5 top-3.5 font-mono text-[10px] uppercase tracking-wider text-slate-400 font-bold">{unit}</span>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="Hauteur"
                    value={height}
                    onChange={(e) => setHeight(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-white/20 hover:border-white/40 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs text-white focus:outline-none transition-all font-mono font-bold shadow-inner"
                  />
                  <span className="absolute right-3.5 top-3.5 font-mono text-[10px] uppercase tracking-wider text-slate-400 font-bold">{unit}</span>
                </div>
              </div>
            </div>
          )}

          {/* Description of job */}
          <div className="space-y-2">
            <label className="text-[11px] uppercase font-bold tracking-wider text-slate-200 block flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isFormation ? 'Description de vos besoins/projets (Optionnelle)' : 'Description détaillée des tirages (Min 20 caractères)'}</span>
            </label>
            <textarea
              required={!isFormation}
              rows={4}
              placeholder={isFormation ? "Ex: Je réalise cette formation dans le but de me diriger vers la PAO professionnelle infographique pour mon entreprise..." : "Ex : Impression bâche tendue avec œillets métalliques tous les 50cm, fond perdu de 5mm, couleurs CMJN uniquement..."}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-white/20 hover:border-white/40 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-400 focus:outline-none transition-all resize-none font-medium leading-relaxed shadow-inner"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Siège proche */}
            <div className="space-y-2">
              <label className="text-[11px] uppercase font-bold tracking-wider text-slate-200 block">Quel siège vous est le plus proche ?</label>
              <select
                value={preferredBranch}
                onChange={(e) => setPreferredBranch(e.target.value)}
                className="w-full bg-slate-950 border border-white/20 hover:border-white/40 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs text-white focus:outline-none transition-all font-semibold cursor-pointer shadow-inner"
              >
                <option value="aucun" className="bg-slate-950 text-white">Peu importe</option>
                <option value="annexe_1" className="bg-slate-950 text-white">Siège 1 — Kansounkpa</option>
                <option value="annexe_2" className="bg-slate-950 text-white">Siège 2 — Pavé Kérékou</option>
                <option value="annexe_3" className="bg-slate-950 text-white">Siège 3 — Kpodji les Monts</option>
              </select>
            </div>

            {/* Optional Delay */}
            <div className="space-y-2">
              <label className="text-[11px] uppercase font-bold tracking-wider text-slate-200 block">Délai souhaité d'exécution</label>
              <select
                value={delaiSouhaite}
                onChange={(e) => setDelaiSouhaite(e.target.value)}
                className="w-full bg-slate-950 border border-white/20 hover:border-white/40 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs text-white focus:outline-none transition-all font-semibold cursor-pointer shadow-inner"
              >
                <option value="Pas de préférence" className="bg-slate-950 text-white">Pas de préférence</option>
                <option value="Urgent (24-48h)" className="bg-slate-950 text-white">Urgent (24-48h)</option>
                <option value="Sous 3 jours" className="bg-slate-950 text-white">Sous 3 jours</option>
                <option value="Sous 1 semaine" className="bg-slate-950 text-white">Sous 1 semaine</option>
                <option value="Flexible" className="bg-slate-950 text-white">Flexible</option>
              </select>
            </div>

            {/* Special note */}
            <div className="space-y-2">
              <label className="text-[11px] uppercase font-bold tracking-wider text-slate-200 block">Consigne ou note spéciale en option</label>
              <input
                type="text"
                placeholder="Ex : Finition mate, couleurs éclatantes..."
                value={specialNote}
                onChange={(e) => setSpecialNote(e.target.value)}
                className="w-full bg-slate-950 border border-white/20 hover:border-white/40 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs text-white focus:outline-none transition-all font-medium shadow-inner"
              />
            </div>
          </div>

          {/* Controls button */}
          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all duration-150 shadow-lg shadow-emerald-950/50 hover:scale-[1.02]"
            >
              <span>{isFormation ? 'Étape suivante : Confirmer le dossier' : 'Étape suivante : Télécharger la maquette'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="bg-slate-950/60 p-4 border border-white/10 rounded-2xl flex items-start gap-3.5 shadow-inner">
            <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 block mb-0.5">Note technique</span>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {isFormation 
                  ? "Pour les inscriptions aux formations, le téléchargement de document de référence reste optionnel. Cliquez directement sur le bouton de soumission s'il n'y a aucun fichier à joindre."
                  : "Insérez la maquette finale au format PDF haute résolution si possible pour une impression optimale à l'Atelier. Nous analysons l'intégrité graphique du rendu avant chiffrage budgétaire final."
                }
              </p>
            </div>
          </div>

          {/* Media uploader file component */}
          {isFormation ? (
            <div className="bg-slate-950/40 p-6 border border-white/10 rounded-2xl space-y-4 text-center shadow-inner">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-lg mx-auto">
                <h4 className="text-xs font-extrabold text-white">Documentation Optionnelle</h4>
                <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
                  Si vous avez des documents de référence (ex: programme rédigé ou maquette de projet), vous pouvez les ajouter de manière facultative ci-dessous. Sinon, passez directement à la soumission.
                </p>
              </div>
              
              <div className="pt-2 text-left">
                <FileUpload
                  userId={user!.uid}
                  onFilesUploaded={(files) => setUploadedFiles(files)}
                  maxFiles={3}
                />
              </div>
            </div>
          ) : (
            <FileUpload
              userId={user!.uid}
              onFilesUploaded={(files) => setUploadedFiles(files)}
              maxFiles={3}
            />
          )}

          {/* Controls footer */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <button
              type="button"
              disabled={submitting}
              onClick={() => setStep(1)}
              className="px-4.5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-200 font-bold border border-white/10 hover:border-white/20 rounded-xl text-xs flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour</span>
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/50 transition-all duration-150 disabled:opacity-55 disabled:cursor-not-allowed hover:scale-[1.02]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Soumission en cours...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isFormation ? "CONFIRMER L'INSCRIPTION" : "SOUMETTRE LE PROJET À L'ATELIER"}</span>
                </>
              )}
            </button>
          </div>

        </form>
      )}

    </div>
  );
}