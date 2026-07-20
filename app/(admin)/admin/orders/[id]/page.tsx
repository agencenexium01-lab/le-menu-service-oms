import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  getOrderById, 
  updateOrder, 
  getOrderStatusHistory, 
  OrderHistoryItem,
  createNotification 
} from '../../../../../lib/firebase/firestore';
import { getUserProfile } from '../../../../../lib/firebase/auth';
import { Order, User as AppUser } from '../../../../../types';
import { analyzeUploadedFile } from '../../../../../lib/gemini/client';
import StatusBadge, { getStatusLabel } from '../../../../../components/admin/StatusBadge';
import { getServiceTypeLabel } from '../../../../../components/admin/OrderCard';
import OrderStatusUpdater from '../../../../../components/admin/OrderStatusUpdater';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  FileText, 
  Image as ImageIcon, 
  Download, 
  FileSignature, 
  Clock, 
  MessageSquare, 
  Eye, 
  Maximize, 
  Edit, 
  ClipboardCheck, 
  AlertCircle,
  CheckCircle,
  Layers,
  Sparkles,
  Loader2
} from 'lucide-react';

export default function AdminOrderDetailPage({ params }: { params?: { id: string } }) {
  const routerParams = useParams<{ id: string }>();
  const orderId = params?.id || routerParams.id || '';

  const [order, setOrder] = useState<Order | null>(null);
  const [clientProfile, setClientProfile] = useState<AppUser | null>(null);
  const [history, setHistory] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States for Admin internal notes
  const [internalNotes, setInternalNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSuccess, setNotesSuccess] = useState(false);

  // States for automated file technical analysis with Gemini
  const [analysisResults, setAnalysisResults] = useState<Record<number, {
    status: 'ok' | 'warning' | 'error';
    issues: string[];
    recommendations: string[];
  }>>({});
  const [analyzingFileIndex, setAnalyzingFileIndex] = useState<Record<number, boolean>>({});
  const [isAnyAnalyzing, setIsAnyAnalyzing] = useState(false);
  const [notifiedFiles, setNotifiedFiles] = useState<Record<number, boolean>>({});
  const [notifyingIndex, setNotifyingIndex] = useState<number | null>(null);

  const handleNotifyClient = async (idx: number, fileName: string, result: any) => {
    if (!order || !order.clientId) return;
    setNotifyingIndex(idx);
    try {
      const title = "Problème technique sur votre fichier";
      const issuesPhrase = result.issues && result.issues.length > 0 
        ? `Problèmes détectés : ${result.issues.join(', ')}.` 
        : "Le fichier d'impression transmis semble présenter des anomalies de format ou de qualité.";
      const recoPhrase = result.recommendations && result.recommendations.length > 0 
        ? ` Recommandations : ${result.recommendations.join(', ')}.` 
        : "";
      const message = `Bonjour, notre système a détecté des anomalies sur le fichier "${fileName}" rattaché à votre commande #${order.orderNumber}. ${issuesPhrase}${recoPhrase} Merci de fournir un fichier conforme.`;

      await createNotification({
        userId: order.clientId,
        type: 'file_issue',
        title,
        message,
        orderId: order.id,
        read: false
      });

      setNotifiedFiles(prev => ({
        ...prev,
        [idx]: true
      }));
    } catch (err) {
      console.error("Erreur lors de l'envoi de la notification de fichier:", err);
      alert("Une erreur est survenue lors de l'envoi de la notification.");
    } finally {
      setNotifyingIndex(null);
    }
  };

  const handleAnalyzeFiles = async () => {
    if (!order || !order.fileUrls) return;
    setIsAnyAnalyzing(true);
    
    const dims = {
      width: order.dimensions?.width || 0,
      height: order.dimensions?.height || 0,
      unit: order.dimensions?.unit || 'm'
    };

    const promises = order.fileUrls.map(async (url, idx) => {
      const name = order.fileNames?.[idx] || `Fichier_${idx + 1}`;
      setAnalyzingFileIndex(prev => ({ ...prev, [idx]: true }));
      try {
        const res = await analyzeUploadedFile(url, name, dims);
        setAnalysisResults(prev => ({
          ...prev,
          [idx]: res
        }));
      } catch (err) {
        console.error("Erreur durant l'analyse IA de", name, err);
        setAnalysisResults(prev => ({
          ...prev,
          [idx]: {
            status: 'warning',
            issues: ["Analyse IA indisponible"],
            recommendations: ["Veuillez vérifier ce fichier d'impression manuellement."]
          }
        }));
      } finally {
        setAnalyzingFileIndex(prev => ({ ...prev, [idx]: false }));
      }
    });

    await Promise.all(promises);
    setIsAnyAnalyzing(false);
  };

  const fetchOrderDetails = async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      setError(null);
      
      // 1. Fetch Order Document
      const orderData = await getOrderById(orderId);
      if (!orderData) {
        setError('Aucune commande trouvée avec cette référence.');
        setLoading(false);
        return;
      }
      setOrder(orderData);
      setInternalNotes(orderData.adminNotes || '');

      // 2. Fetch Client profile (to acquire phone number and company)
      if (orderData.clientId) {
        const clientData = await getUserProfile(orderData.clientId);
        if (clientData) {
          setClientProfile(clientData);
        }
      }

      // 3. Fetch Status Transitions History
      const historyData = await getOrderStatusHistory(orderId);
      setHistory(historyData);

    } catch (err: any) {
      console.error('Erreur chargement détails commande admin:', err);
      setError(err.message || 'Impossible de charger la fiche technique de la commande.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const handleSaveNotes = async () => {
    if (!orderId) return;
    setSavingNotes(true);
    setNotesSuccess(false);
    try {
      await updateOrder(orderId, { adminNotes: internalNotes });
      setNotesSuccess(true);
      setTimeout(() => setNotesSuccess(false), 4000);
    } catch (err: any) {
      console.error('Erreur sauvegarde notes de l\'atelier:', err);
      alert('Erreur lors de la sauvegarde : ' + err.message);
    } finally {
      setSavingNotes(false);
    }
  };

  const getFormattedDate = (createdAt: any) => {
    if (!createdAt) return 'Non datée';
    const date = typeof createdAt.toDate === 'function' ? createdAt.toDate() : new Date(createdAt);
    return date.toLocaleString('fr-BJ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4 animate-fade-in min-h-[50vh]">
        <div className="w-10 h-10 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-slate-400 font-bold text-xs">Extraction de la Fiche Technique...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl max-w-lg mx-auto space-y-4 mt-10">
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <h3 className="font-extrabold text-white">Fiche technique inaccessible</h3>
        </div>
        <p className="text-xs text-slate-300 leading-normal">
          {error || 'La commande demandée est introuvable ou vous n\'avez pas les permissions d\'accès requises.'}
        </p>
        <Link 
          to="/admin/orders" 
          className="inline-flex items-center gap-2 text-xs font-bold text-yellow-400 hover:text-yellow-350"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à l'Atelier</span>
        </Link>
      </div>
    );
  }

  // Determine if a quotation can be created (Status nouveau or en_verification)
  const canCreateQuote = order.status === 'nouveau' || order.status === 'en_verification';

  return (
    <div className="space-y-6 animate-fade-in" id="admin-order-detail-page">
      
      {/* Upper Navigation Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link 
          to="/admin/orders" 
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white bg-white/5 border border-white/5 hover:border-white/10 px-3.5 py-2 rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Fiche Atelier</span>
        </Link>

        {canCreateQuote && (
          <Link
            to={`/admin/orders/${order.id}/quote`}
            id="admin-create-quote-btn"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-[0_4px_15px_rgba(234,179,8,0.3)] transition-all"
          >
            <FileSignature className="w-4 h-4" />
            <span>Établir & Rédiger un Devis Client</span>
          </Link>
        )}
      </div>

      {/* Hero card section / Header */}
      <div className="backdrop-blur-xl bg-[#1e293b]/60 border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Layers className="w-32 h-32 text-white" />
        </div>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-xs text-yellow-400 font-extrabold tracking-tight bg-yellow-500/10 px-2.5 py-1 rounded border border-yellow-500/15">
                #{order.orderNumber}
              </span>
              <StatusBadge status={order.status} />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Fiche de Contrôle Technique
            </h1>
            
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>Soumis le : {getFormattedDate(order.createdAt)}</span>
              </span>
              {order.updatedAt && (
                <span className="flex items-center gap-1.5 border-l border-white/10 pl-6">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>Dernière activité : {getFormattedDate(order.updatedAt)}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Client details / Identity */}
        <div className="border-t border-white/5 pt-6">
          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3.5">
            Informations de Contact du donneur d'ordre
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 flex items-start gap-3">
              <User className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider leading-none mb-1">Nom du client</span>
                <span className="font-bold text-white block truncate">{order.clientName}</span>
                <span className="text-[10px] text-slate-400">{order.clientEmail}</span>
              </div>
            </div>

            <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 flex items-start gap-3">
              <Building2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider leading-none mb-1">Structure / Entreprise</span>
                <span className="font-bold text-white block truncate">
                  {clientProfile?.companyName || (order as any).companyName || 'Particulier / Non renseigné'}
                </span>
              </div>
            </div>

            <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 flex items-start gap-3">
              <Phone className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider leading-none mb-1">Téléphone mobile</span>
                {clientProfile?.phone ? (
                  <a 
                    href={`tel:${clientProfile.phone}`} 
                    className="font-bold text-emerald-400 hover:underline block cursor-pointer"
                  >
                    {clientProfile.phone}
                  </a>
                ) : (
                  <span className="text-slate-500 text-xs font-bold block">Aucun numéro enregistré</span>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Main grids splits logic (Left specifications, Right interactions) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Hand: Specifications and Uploaded Files */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section: Technical dimensions and specs */}
          <div className="backdrop-blur-xl bg-[#1e293b]/40 border border-white/10 rounded-3xl p-6 md:p-8 space-y-4">
            <h3 className="font-extrabold text-white text-base border-b border-white/5 pb-2">
              Spécifications Matérielles
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Service demandé</span>
                <span className="font-extrabold text-white text-sm bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 block">
                  {getServiceTypeLabel(order.serviceType)}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Dimensions d'Impression</span>
                <span className="font-semibold text-slate-200 text-sm bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 block">
                  {order.dimensions?.width} x {order.dimensions?.height} {order.dimensions?.unit || 'm'}
                </span>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Volume / Quantité</span>
                <span className="font-black text-yellow-400 text-sm bg-yellow-500/5 border border-yellow-500/10 rounded-xl px-3 py-2.5 block">
                  {order.quantity || 1} exemplaire{(order.quantity || 1) > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Description client */}
            <div className="pt-4 space-y-2">
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Description détaillée du client</span>
              <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 text-xs text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">
                {order.description || "Aucune description fournie par le client."}
              </div>
            </div>

            {/* Note spéciale */}
            {order.specialNote && (
              <div className="pt-2 space-y-2">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Consigne ou directive particulière</span>
                </span>
                <div className="bg-yellow-500/5 border border-yellow-500/15 rounded-2xl p-4 text-xs text-yellow-200 leading-relaxed font-semibold">
                  {order.specialNote}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Uploaded Files Visual Inspection */}
          <div className="backdrop-blur-xl bg-[#1e293b]/40 border border-white/10 rounded-3xl p-6 md:p-8 space-y-4">
            <h3 className="font-extrabold text-white text-base border-b border-white/5 pb-2">
              Visuels & Pièces Jointes
            </h3>

            {(!order.fileUrls || order.fileUrls.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-2 text-slate-400">
                <FileText className="w-8 h-8 text-slate-600" />
                <span className="text-xs font-bold text-slate-500">Aucun fichier n'a été rattaché à cette commande d'impression.</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2" id="order-attached-files-list">
                  {order.fileUrls.map((url, index) => {
                    const name = order.fileNames?.[index] || `Fichier_${index + 1}`;
                    // Detect file type
                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(name) || url.startsWith('data:image/') || url.includes('image');
                    const isPDF = /\.pdf$/i.test(name) || url.includes('pdf');

                    return (
                      <div 
                        key={index} 
                        className="bg-slate-950/50 border border-white/5 rounded-2xl p-4 flex flex-col justify-between space-y-4 hover:border-white/15 transition-all"
                      >
                        <div className="flex flex-col space-y-4">
                          <div className="flex gap-3">
                            {isImage ? (
                              <div className="w-16 h-16 shrink-0 bg-slate-900 border border-white/10 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                                <img 
                                  src={url} 
                                  alt={name} 
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            ) : (
                              <div className={`w-16 h-16 shrink-0 rounded-xl flex items-center justify-center font-black ${
                                isPDF ? 'bg-red-500/10 text-red-500 border border-red-500/10' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10'
                              }`}>
                                {isPDF ? 'PDF' : 'DOC'}
                              </div>
                            )}

                            <div className="min-w-0 flex-grow space-y-1">
                              <span className="text-[10px] text-slate-500 uppercase font-black block tracking-wider">
                                Ressource #{index + 1}
                              </span>
                              <span className="font-bold text-xs text-white block truncate leading-tight" title={name}>
                                {name}
                              </span>
                              <span className="text-[9px] text-slate-400 font-extrabold uppercase bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                {isImage ? 'IMAGE PRINTABLE' : isPDF ? 'FORMAT PORTABLE' : 'SUPPORT EXPÉDIÉ'}
                              </span>
                            </div>
                          </div>

                          {/* Analysis results displaying here directly inside the file card */}
                          {analyzingFileIndex[index] && (
                            <div className="p-3 bg-slate-900/80 border border-white/5 rounded-xl flex items-center justify-center gap-2">
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-yellow-400" />
                              <span className="text-[10px] text-slate-400 font-bold animate-pulse">Analyse technique...</span>
                            </div>
                          )}

                          {!analyzingFileIndex[index] && analysisResults[index] && (
                            <div className="p-3 bg-slate-900/80 border border-white/5 rounded-xl space-y-2.5">
                              {analysisResults[index].status === 'ok' && (
                                <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/10 font-bold w-fit">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Fichier conforme</span>
                                </div>
                              )}

                              {analysisResults[index].status === 'warning' && (
                                <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/10 font-bold w-fit">
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Attention requise</span>
                                </div>
                              )}

                              {analysisResults[index].status === 'error' && (
                                <div className="flex items-center gap-1.5 text-xs text-red-500 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/10 font-bold w-fit">
                                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                                  <span>Fichier défectueux</span>
                                </div>
                              )}

                              {analysisResults[index].issues && analysisResults[index].issues.length > 0 && (
                                <div className="space-y-1">
                                  <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider block">Problèmes signalés</span>
                                  <ul className="list-disc pl-3.5 text-[10px] text-slate-350 space-y-0.5 leading-normal">
                                    {analysisResults[index].issues.map((issue, i) => (
                                      <li key={i}>{issue}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {analysisResults[index].recommendations && analysisResults[index].recommendations.length > 0 && (
                                <div className="space-y-1">
                                  <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider block">Recommandations</span>
                                  <ul className="list-disc pl-3.5 text-[10px] text-emerald-400/80 space-y-0.5 leading-normal">
                                    {analysisResults[index].recommendations.map((reco, i) => (
                                      <li key={i}>{reco}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {analysisResults[index].status === 'error' && (
                                <p className="text-[9px] text-red-400 font-extrabold bg-red-500/5 p-1.5 rounded border border-red-500/10 block leading-tight">
                                  ⚠️ Contacter le client pour un nouveau fichier.
                                </p>
                              )}

                              {analysisResults[index].status !== 'ok' && (
                                <div className="pt-2 border-t border-white/5 flex justify-end">
                                  {notifiedFiles[index] ? (
                                    <span className="text-[10px] text-emerald-400 font-black flex items-center gap-1.5 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                                      <CheckCircle className="w-3 h-3" />
                                      <span>Client notifié !</span>
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleNotifyClient(index, name, analysisResults[index])}
                                      disabled={notifyingIndex === index}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-500/15 hover:bg-indigo-600 hover:text-white disabled:bg-slate-800 disabled:text-slate-500 text-indigo-400 rounded-lg text-[10px] font-extrabold border border-indigo-500/15 transition-all cursor-pointer"
                                    >
                                      {notifyingIndex === index ? (
                                        <>
                                          <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                                          <span>Envoi...</span>
                                        </>
                                      ) : (
                                        <span>Notifier le client</span>
                                      )}
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Download link / direct attachment link */}
                        <div className="pt-2">
                          <a 
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-yellow-500 hover:text-slate-950 text-slate-300 font-extrabold rounded-lg text-xs border border-white/5 transition-all text-center cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Télécharger ce fichier</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {order.fileUrls && order.fileUrls.length > 0 && (
                  <div className="flex justify-end pt-2 border-t border-white/5">
                    <button
                      type="button"
                      onClick={handleAnalyzeFiles}
                      disabled={isAnyAnalyzing}
                      id="trigger-ia-analysis-btn"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-slate-950 font-black rounded-xl text-xs transition-all shadow-[0_4px_12px_rgba(234,179,8,0.2)] cursor-pointer"
                    >
                      {isAnyAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                          <span>Analyse IA en cours...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-slate-950" />
                          <span>🔍 Analyser avec IA</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Hand side: Decision Controls, Timelines and Notes */}
        <div className="space-y-6">
          
          {/* Status progressions container section */}
          <OrderStatusUpdater 
            order={order} 
            onStatusUpdated={() => {
              // Re-fetch all order data and history timeline
              fetchOrderDetails();
            }} 
          />

          {/* Internal Atelier Notes Module */}
          <div className="backdrop-blur-xl bg-[#1e293b]/40 border border-white/10 rounded-3xl p-6 space-y-4" id="admin-internal-notes-panel">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <h4 className="font-extrabold text-white text-sm">Notes Internes de l'Atelier</h4>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
              Espace de notes privé pour le chef d'atelier (non visible côté client). Pratique pour noter le type d'encre, de bâche PVC, les consignes d'atelier ou l'avancement.
            </p>

            <div className="space-y-3">
              <textarea
                placeholder="Ex : Utiliser bâche PVC brillante 510g laminée. Remplacement d'oeillets prévu sur bordures hautes."
                value={internalNotes}
                onChange={(e) => {
                  setInternalNotes(e.target.value);
                  setNotesSuccess(false);
                }}
                rows={5}
                className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-yellow-500 transition-all duration-150 font-mono leading-relaxed resize-none"
              ></textarea>

              {notesSuccess && (
                <div className="text-emerald-400 text-[11px] font-bold flex items-center gap-1.5 animate-pulse">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Notes de l'Atelier sauvegardées !</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all border border-indigo-500/25 shadow-lg shadow-indigo-950/20"
              >
                {savingNotes ? 'Enregistrement...' : 'Sauvegarder les notes'}
              </button>
            </div>
          </div>

          {/* Vertical Transition timeline logs */}
          <div className="backdrop-blur-xl bg-[#1e293b]/40 border border-white/10 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Historique d'Atelier</span>
              </h4>
              <span className="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Activité
              </span>
            </div>

            {history.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 font-bold leading-normal">
                Aucun changement de statut recensé. Utilisez le module ci-dessus pour acter une transition d'impression.
              </div>
            ) : (
              <div className="relative border-l-2 border-white/5 ml-3 pl-4 space-y-5 py-2 text-xs">
                {history.map((item, index) => {
                  const label = getStatusLabel(item.status);
                  const isLast = index === history.length - 1;
                  
                  return (
                    <div key={item.id || index} className="relative space-y-1">
                      {/* Interactive dot */}
                      <span className={`absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                        isLast 
                          ? 'bg-yellow-500 border-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.3)]' 
                          : 'bg-slate-900 border-slate-700'
                      }`}>
                        {isLast && (
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping"></span>
                        )}
                      </span>

                      {/* Content log row */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className={`font-black uppercase tracking-wide text-[11px] ${
                          isLast ? 'text-yellow-400' : 'text-slate-200'
                        }`}>
                          {label}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          {getFormattedDate(item.changedAt)}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-400">
                        Par : <span className="font-bold text-slate-300">{item.changedBy}</span>
                      </div>

                      {item.note && (
                        <div className="bg-slate-950/40 border border-white/5 p-2 rounded-lg text-[11px] text-slate-300 italic whitespace-normal leading-relaxed mt-1">
                          "{item.note}"
                        </div>
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
