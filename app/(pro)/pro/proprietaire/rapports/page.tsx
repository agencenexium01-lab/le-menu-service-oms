import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Branch, Order, Quote, ServiceType, SERVICE_LABELS } from '@/types';
import { 
  generateReport, 
  ReportData, 
  validatePayment 
} from '@/lib/firebase/firestore';
import ReportCard from '@/components/pro/ReportCard';
import { Skeleton, StatCardSkeleton } from '@/components/shared/Skeleton';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Filter, 
  Building, 
  Coins, 
  Loader2,
  FileText,
  HelpCircle,
  Download,
  Printer,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Briefcase
} from 'lucide-react';

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; className: string }> = {
    nouveau: { label: 'Nouveau', className: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' },
    en_verification: { label: 'En Vérification', className: 'bg-amber-500/10 text-amber-500 border border-amber-500/20' },
    devis_envoye: { label: 'Devis Envoyé', className: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' },
    devis_accepte: { label: 'Devis Accepté', className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
    en_production: { label: 'En Production', className: 'bg-purple-500/10 text-purple-400 border border-purple-500/20' },
    pret: { label: 'Prêt (Retrait)', className: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' },
    livre: { label: 'Livré', className: 'bg-emerald-600/10 text-emerald-500 border border-emerald-500/20' },
    annule: { label: 'Annulé', className: 'bg-red-500/10 text-red-400 border border-red-500/15' },
  };

  const config = configs[status] || { label: status.toUpperCase(), className: 'bg-slate-500/10 text-slate-400' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${config.className}`}>
      {config.label}
    </span>
  );
}

export default function ProprietaireRapportsPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Autorisé pour les rôles admin ET super_admin (propriétaires de l'atelier)
  const isAuthorized = userProfile?.role === 'super_admin' || userProfile?.role === 'admin';

  // Guard security: role must be 'admin' or 'super_admin'
  useEffect(() => {
    if (!authLoading) {
      if (!userProfile) {
        navigate('/pro/connexion');
      } else if (!isAuthorized) {
        navigate('/pro/connexion');
      }
    }
  }, [userProfile, authLoading, isAuthorized, navigate]);

  const [period, setPeriod] = useState<string>('ce_mois');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    // default to 30 days ago
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState<boolean>(true);

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null);

  // Listen to branches in real-time
  useEffect(() => {
    if (userProfile && isAuthorized) {
      const q = query(collection(db, 'branches'), orderBy('sortOrder', 'asc'));
      const unsub = onSnapshot(q, (snapshot) => {
        const list: Branch[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Branch);
        });
        setBranches(list);
        setLoadingBranches(false);
      }, (err) => {
        console.error("Failed to load branches in rapports page:", err);
        setLoadingBranches(false);
      });
      return () => unsub();
    }
  }, [userProfile, isAuthorized]);

  // Normalized dates calculation
  const getPeriodDates = (p: string) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();
    
    if (p === 'aujourd_hui') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (p === 'cette_semaine') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // setting Monday as start
      start = new Date(now.setDate(diff));
      start.setHours(0, 0, 0, 0);
      
      end = new Date();
      end.setHours(23, 59, 59, 999);
    } else if (p === 'ce_mois') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (p === '3_mois') {
      start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate(), 0, 0, 0, 0);
      end = new Date();
      end.setHours(23, 59, 59, 999);
    }
    return { start, end };
  };

  // Helper triggering compilation
  const triggerGenerate = async (currentPeriod = period, currentBranchId = selectedBranch) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      let start: Date;
      let end: Date;

      if (currentPeriod === 'personnalise') {
        if (!customStartDate || !customEndDate) {
          setLoading(false);
          return;
        }
        start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);

        end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);

        if (start > end) {
          throw new Error('La date de début doit être antérieure à la date de fin.');
        }
      } else {
        const dates = getPeriodDates(currentPeriod);
        start = dates.start;
        end = dates.end;
      }

      const report = await generateReport(currentBranchId, start, end);
      setReportData(report);
    } catch (err: any) {
      console.error("Error generating report:", err);
      setErrorMsg(err.message || "Impossible de générer le rapport.");
    } finally {
      setLoading(false);
    }
  };

  // Run automatically on parameter edits
  useEffect(() => {
    if (userProfile && isAuthorized) {
      if (period !== 'personnalise') {
        triggerGenerate(period, selectedBranch);
      } else if (customStartDate && customEndDate) {
        triggerGenerate(period, selectedBranch);
      }
    }
  }, [period, selectedBranch, customStartDate, customEndDate, userProfile, isAuthorized]);

  const handleValidatePayment = async (orderId: string, orderNumber: string) => {
    if (!userProfile) return;
    if (window.confirm(`Confirmer que la commande #${orderNumber} a bien été réglée en physique ?`)) {
      setProcessingPaymentId(orderId);
      try {
        await validatePayment(orderId, {
          uid: userProfile.uid,
          name: userProfile.displayName || userProfile.email
        });
        
        // Refresh
        await triggerGenerate(period, selectedBranch);
      } catch (err: any) {
        console.error("Failed to validate payment:", err);
        alert("Erreur lors de la validation : " + err.message);
      } finally {
        setProcessingPaymentId(null);
      }
    }
  };

  const getOrderQuoteAmount = (orderId: string) => {
    const matchingQuote = reportData?.quotes?.find(q => q.orderId === orderId && q.status === 'accepted');
    return matchingQuote ? matchingQuote.amount : 0;
  };

  const exportToCSV = () => {
    if (!reportData || !reportData.orders) return;

    const headers = [
      'N°',
      'Date',
      'Client',
      'Siège',
      'Service',
      'Statut',
      'Statut Paiement',
      'Montant XOF',
      'Source'
    ];

    const rows = reportData.orders.map(o => {
      const orderNum = o.orderNumber;
      
      let dateString = '';
      if (o.createdAt) {
        if (typeof (o.createdAt as any).toDate === 'function') {
          dateString = (o.createdAt as any).toDate().toLocaleDateString('fr-FR');
        } else {
          dateString = new Date(o.createdAt as any).toLocaleDateString('fr-FR');
        }
      }

      const clientName = o.isManualOrder 
        ? (o.walkInClientName || 'Client Comptoir') 
        : (o.clientName || 'Client Web');
        
      const branchName = o.branchName || 'Siège Central';
      const serviceLabel = SERVICE_LABELS[o.serviceType] || o.serviceType;
      const statusLabel = o.status.toUpperCase();
      const paymentStatusDisplay = o.paymentStatus === 'paid' ? 'Payé' : 'Non payé';
      
      const amount = getOrderQuoteAmount(o.id || '');
      const sourceStr = o.isManualOrder ? 'Physique (Walk-In)' : 'En ligne (Web)';

      return [
        `"${orderNum}"`,
        `"${dateString}"`,
        `"${clientName.replace(/"/g, '""')}"`,
        `"${branchName.replace(/"/g, '""')}"`,
        `"${serviceLabel.replace(/"/g, '""')}"`,
        `"${statusLabel}"`,
        `"${paymentStatusDisplay}"`,
        amount.toString(),
        `"${sourceStr}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    // Create UTF-8 blob with BOM for seamless Excel compatibility
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const dStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `Rapport_OMS_OMSA_Export_${dStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (authLoading || !userProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500 mb-3" />
        <p className="text-xs font-mono text-slate-400">Authentification...</p>
      </div>
    );
  }

  const unpaidOrders = reportData?.orders?.filter(o => 
    (o.status === 'pret' || o.status === 'livre') && o.paymentStatus !== 'paid'
  ) || [];

  return (
    <div className="space-y-8 text-white relative" id="owner-reports-workspace">
      
      {/* Dynamic Screen Print Style Overrider */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          #owner-reports-workspace {
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-white-bg {
            background-color: white !important;
            background-image: none !important;
            border: 1px solid #e2e8f0 !important;
            color: black !important;
            box-shadow: none !important;
          }
          .print-text-dark {
            color: black !important;
          }
          .print-text-muted {
            color: #475569 !important;
          }
          table {
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid #cbd5e1 !important;
            color: black !important;
            background: transparent !important;
          }
        }
      `}} />

      {/* Header Block with Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <span className="text-[10px] uppercase font-black text-blue-400 tracking-widest bg-blue-500/10 border border-blue-500/25 px-2.5 py-1 rounded-full mb-2 inline-block">
            📈 OMS ANALYTICS
          </span>
          <h1 className="text-3xl font-black tracking-tight">Rapports & Statistiques Réseau</h1>
          <p className="text-slate-400 text-xs mt-1">
            Visualisez le chiffre d'affaires, la provenance et l'activité globale de vos points de vente.
          </p>
        </div>

        {/* ZONE 6 — EXPORTS ACTIONS */}
        {reportData && (
          <div className="flex items-center gap-3 no-print">
            <button
              onClick={exportToCSV}
              type="button"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>Exporter en CSV</span>
            </button>
            <button
              onClick={handlePrint}
              type="button"
              className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-md shadow-indigo-950/30"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer</span>
            </button>
          </div>
        )}
      </div>

      {/* ZONE 1 — SÉLECTEUR DE PÉRIODE & SELECTION SIÈGE */}
      <div className="bg-[#111A36]/40 border border-[#2B3553]/20 rounded-3xl p-6 space-y-4 no-print shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Quick period selectors */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider block">Période d'Analyse</span>
            <div className="flex flex-wrap gap-1.5 bg-[#0A0F24]/60 p-1 rounded-xl border border-white/5">
              {[
                { key: 'aujourd_hui', label: "Aujourd'hui" },
                { key: 'cette_semaine', label: "Cette semaine" },
                { key: 'ce_mois', label: "Ce mois" },
                { key: '3_mois', label: "3 derniers mois" },
                { key: 'personnalise', label: "Personnalisé ⚙️" },
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPeriod(p.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    period === p.key 
                      ? 'bg-blue-600 text-white font-extrabold shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Seat selection */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider block">Filtrer par Siège</span>
            {loadingBranches ? (
              <div className="h-9 w-40 animate-pulse bg-slate-800 rounded-xl"></div>
            ) : (
              <div className="flex gap-1 bg-[#0A0F24]/60 p-1 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setSelectedBranch('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedBranch === 'all' 
                      ? 'bg-amber-600 text-white font-extrabold shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tous les sièges
                </button>
                {branches.map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBranch(b.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedBranch === b.id 
                        ? 'bg-amber-600 text-white font-extrabold shadow-md' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {b.name.split('—')[1] || b.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Manual Refresh / Compute Trigger button */}
          <div className="self-end pt-3 md:pt-0">
            <button
              onClick={() => triggerGenerate()}
              disabled={loading}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 rounded-xl text-xs font-black transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer text-white"
            >
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
              <span>Générer le rapport</span>
            </button>
          </div>
        </div>

        {/* Custom Date Pickers Drawer */}
        {period === 'personnalise' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-white/5 animate-fade-in">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-bold">Date de début</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full bg-[#0A0F24] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-bold">Date de fin</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full bg-[#0A0F24] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Analysis Core Loader on fetch states */}
      {loading ? (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-bold bg-[#111A36]/40 border border-white/5 px-4 py-3 rounded-2xl w-fit">
            <Loader2 className="animate-spin h-4 w-4 text-emerald-400 shrink-0" />
            <span>Compilation en temps réel des transactions du réseau OMS...</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          <div className="space-y-4 pt-4 border-t border-white/5">
            <Skeleton className="h-4 w-40" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-40 w-full rounded-2xl" />
              <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      ) : errorMsg ? (
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl flex items-center gap-3 text-red-400">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <p className="text-xs font-bold">{errorMsg}</p>
        </div>
      ) : reportData ? (
        <div className="space-y-8 animate-fade-in">
          
          {/* ZONE 2 — MÉTRIQUES PRINCIPALES (4 grandes cartes) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Total commandes (digital + physique) */}
            <ReportCard
              id="report-card-total-orders"
              title="📦 Total Commandes"
              value={reportData.totalOrders}
              subValue={`${reportData.digitalOrders} en ligne`}
              subText={`• ${reportData.manualOrders} comptoir`}
              icon={<FileText className="w-5 h-5 text-blue-400" />}
              iconBgClass="bg-blue-500/10 text-blue-400"
              bgClass="print-white-bg"
            />

            {/* Livrées */}
            <ReportCard
              id="report-card-delivered-orders"
              title="✅ Commandes Livrées"
              value={`${reportData.ordersDelivered} (${((reportData.ordersDelivered / (reportData.totalOrders || 1)) * 100).toFixed(1)}%)`}
              subValue={`${reportData.ordersInProgress} en cours`}
              subText={`• ${reportData.ordersCancelled} annulées`}
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              iconBgClass="bg-emerald-500/10 text-emerald-400"
              bgClass="print-white-bg"
            />

            {/* CA Encaissé (XOF) */}
            <ReportCard
              id="report-card-revenue-paid"
              title="💰 CA Encaissé"
              value={`${reportData.totalRevenuePaid.toLocaleString('fr-BJ')} XOF`}
              subValue="Somme encaissée"
              subText="Devis validés & réglés"
              icon={<Coins className="w-5 h-5 text-green-400" />}
              iconBgClass="bg-green-500/10 text-green-400"
              bgClass="print-white-bg"
            />

            {/* CA En attente (XOF) */}
            <ReportCard
              id="report-card-revenue-pending"
              title="⏳ CA En attente"
              value={`${reportData.totalRevenuePending.toLocaleString('fr-BJ')} XOF`}
              subValue={`${reportData.ordersNotPaid} impayées`}
              subText="Commandes en cours ou prêtes"
              icon={<HelpCircle className="w-5 h-5 text-amber-400" />}
              iconBgClass="bg-amber-500/10 text-amber-400"
              bgClass="print-white-bg"
            />
          </div>

          {/* METRIC ROW B: New clients banner */}
          <div className="bg-gradient-to-r from-blue-950/20 to-indigo-950/10 border border-blue-500/15 p-4 rounded-3xl flex items-center justify-between gap-4 print-white-bg">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/15 text-blue-300 rounded-xl border border-blue-500/20">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-100 print-text-dark">Acquisition clients</h4>
                <p className="text-[11px] text-slate-400 print-text-muted">Nouveaux comptes clients créés durant cette période d'analyse.</p>
              </div>
            </div>
            <div className="text-xl font-black text-blue-400 pr-2">
              +{reportData.newClients} <span className="text-xs text-slate-400 font-medium print-text-muted">clients</span>
            </div>
          </div>

          {/* ZONE 3 — RÉPARTITION DES COMMANDES (si branchId === 'all') */}
          {selectedBranch === 'all' && reportData.byBranch && (
            <div className="bg-[#111A36]/40 border border-[#2B3553]/20 rounded-3xl p-6 space-y-4 print-white-bg shadow-xl">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-black uppercase tracking-wider">Répartition de l'activité par siège</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className="text-[10px] text-slate-400 font-black uppercase tracking-wider border-b border-white/5 bg-[#0A0F24]/40 print-white-bg">
                      <th className="py-3 px-4">Nom de siège</th>
                      <th className="py-3 px-4 text-center">Commandes Totales</th>
                      <th className="py-3 px-4 text-center">Livrées (Taux %)</th>
                      <th className="py-3 px-4 text-right">CA Encaissé (XOF)</th>
                      <th className="py-3 px-4 text-right">CA En attente (XOF)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {reportData.byBranch.map((b) => (
                      <tr key={b.branchId} className="hover:bg-white/[0.01]">
                        <td className="py-3.5 px-4 font-bold text-slate-200 print-text-dark">
                          {b.branchName} <span className="text-[10px] font-black bg-white/5 text-slate-400 px-1.5 py-0.5 rounded ml-1.5 uppercase">{b.shortName}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-300 font-bold print-text-dark">
                          {b.totalOrders}
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-300 print-text-dark">
                          {b.delivered} <span className="text-slate-500 ml-1">({((b.delivered / (b.totalOrders || 1)) * 100).toFixed(0)}%)</span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-emerald-400 font-black">
                          {b.revenuePaid.toLocaleString('fr-BJ')}
                        </td>
                        <td className="py-3.5 px-4 text-right text-amber-400 font-extrabold">
                          {b.revenuePending.toLocaleString('fr-BJ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ZONE 4 — TOP 5 SERVICES */}
          <div className="bg-[#111A36]/40 border border-[#2B3553]/20 rounded-3xl p-6 space-y-5 print-white-bg shadow-xl">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-black uppercase tracking-wider">Top 5 des prestations demandées (Volume & CA)</h3>
            </div>

            {reportData.topServices.length === 0 ? (
              <p className="text-xs text-slate-450 text-center py-4">Aucune donnée de commande sur cette période.</p>
            ) : (
              <div className="space-y-4 pt-1">
                {reportData.topServices.map((service, index) => {
                  const maxRevenue = Math.max(...reportData.topServices.map(s => s.revenue), 1);
                  const widthPercentage = Math.min(100, Math.round((service.revenue / maxRevenue) * 100));
                  return (
                    <div key={service.serviceType} className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-200 print-text-dark">{index + 1}. {service.label}</span>
                        <div className="flex items-center gap-3 font-mono text-[11px] print-text-dark">
                          <span className="text-slate-400 print-text-muted">{service.count} {service.count > 1 ? 'commandes' : 'commande'}</span>
                          <span className="text-emerald-400 font-extrabold print-text-dark">{service.revenue.toLocaleString('fr-BJ')} XOF</span>
                        </div>
                      </div>
                      <div className="w-full bg-[#0a0f24] rounded-full h-2 pointer-events-none overflow-hidden border border-white/5 print-white-bg">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${widthPercentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ZONE 5 — LISTE DES COMMANDES NON PAYÉES */}
          <div className="bg-[#111A36]/40 border border-[#2B3553]/20 rounded-3xl p-6 space-y-4 print-white-bg shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-rose-450" />
                <h3 className="text-sm font-black uppercase tracking-wider">Suivi des règlements impayés (Prêtes & Livrées)</h3>
              </div>
              <span className="text-[10px] bg-rose-500/10 text-rose-400 px-3 py-1 rounded-full border border-rose-500/15 font-black uppercase tracking-wider">
                {unpaidOrders.length} {unpaidOrders.length > 1 ? 'Commandes non payées' : 'Commande non payée'}
              </span>
            </div>

            {unpaidOrders.length === 0 ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center text-emerald-400 flex items-center justify-center gap-2 max-w-2xl mx-auto my-3">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <p className="text-xs font-black">
                  Génial ! Toutes les commandes prêtes ou livrées dans cette période sont entièrement payées ! 🎉
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className="text-[10px] text-slate-400 font-black uppercase tracking-wider border-b border-white/5 bg-[#0A0F24]/40 print-white-bg">
                      <th className="py-3 px-4">Commande</th>
                      <th className="py-3 px-4">Client</th>
                      <th className="py-3 px-4">Siège</th>
                      <th className="py-3 px-4 text-right">Montant Devis</th>
                      <th className="py-3 px-4 text-center">Statut fabrication</th>
                      <th className="py-3 px-4 text-center no-print">Facturation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {unpaidOrders.map((o) => {
                      const amount = getOrderQuoteAmount(o.id || '');
                      const clientName = o.isManualOrder 
                        ? (o.walkInClientName || 'Client Comptoir') 
                        : (o.clientName || 'Client Web');

                      return (
                        <tr key={o.id} className="hover:bg-white/[0.01]">
                          <td className="py-3.5 px-4 font-mono font-black text-yellow-450">
                            #{o.orderNumber}
                          </td>
                          <td className="py-3.5 px-4 print-text-dark">
                            <div className="font-bold text-slate-200 print-text-dark">{clientName}</div>
                            {o.isManualOrder && o.walkInClientPhone && (
                              <div className="text-[10px] text-slate-450 mt-0.5">📞 {o.walkInClientPhone}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-300 print-text-dark">
                            {o.branchName || 'Siège Central'}
                          </td>
                          <td className="py-3.5 px-4 text-right text-slate-200 font-black print-text-dark">
                            {amount.toLocaleString('fr-BJ')} XOF
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <StatusBadge status={o.status} />
                          </td>
                          <td className="py-3.5 px-4 text-center no-print">
                            <div className="flex items-center justify-center gap-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] bg-red-500/10 text-red-400 border border-red-500/15 font-black uppercase">
                                Non Payé
                              </span>
                              
                              <button
                                type="button"
                                disabled={processingPaymentId !== null}
                                onClick={() => handleValidatePayment(o.id || '', o.orderNumber)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-lg text-[10px] flex items-center gap-1 active:scale-95 transition-all cursor-pointer shadow shadow-emerald-900/30 disabled:bg-slate-800"
                              >
                                {processingPaymentId === o.id ? (
                                  <Loader2 className="animate-spin w-3 h-3" />
                                ) : (
                                  <Coins className="w-3 h-3" />
                                )}
                                <span>Encaisser</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      ) : (
        // Initial / Empty state
        <div className="flex flex-col items-center justify-center py-20 bg-[#111A36]/15 border border-white/5 rounded-3xl text-center">
          <BarChart3 className="h-12 w-12 text-slate-450 mb-3" />
          <h3 className="text-base font-bold text-slate-350">Prêt à compiler votre rapport</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Choisissez la période d'analyse et un point d'origine, puis cliquez sur le bouton "Générer le rapport".
          </p>
        </div>
      )}
    </div>
  );
}