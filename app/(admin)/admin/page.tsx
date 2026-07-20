import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useOrders } from '../../../hooks/useOrders';
import StatusBadge from '../../../components/admin/StatusBadge';
import { getServiceTypeLabel } from '../../../components/admin/OrderCard';
import { seedServices, isServicesCollectionEmpty } from '../../../lib/firebase/firestore';
import { 
  PlusCircle,
  TrendingUp,
  Inbox,
  AlertCircle,
  ArrowRight,
  Sparkles,
  ClipboardList,
  Hourglass,
  CheckCircle,
  Navigation
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { orders, loading, error } = useOrders();
  
  const [showSeedButton, setShowSeedButton] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    async function checkCollection() {
      try {
        const empty = await isServicesCollectionEmpty();
        setShowSeedButton(empty);
      } catch (e) {
        console.error(e);
      }
    }
    checkCollection();
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    setStatusMessage(null);
    try {
      const done = await seedServices();
      if (done) {
        setStatusMessage('✓ Catalogue des services et tarifs officiels initialisé avec succès !');
        setShowSeedButton(false);
      } else {
        setStatusMessage('Le catalogue est déjà présent ou le seed a déjà été exécuté.');
        setShowSeedButton(false);
      }
    } catch (e: any) {
      console.error(e);
      setStatusMessage("Une erreur inattendue s'est produite lors du seeding.");
    } finally {
      setSeeding(false);
    }
  };

  // 1. Nouvelles commandes (statut 'nouveau')
  const newOrders = orders.filter(o => o.status === 'nouveau');
  const countNew = newOrders.length;

  // 2. En cours (statuts 'en_verification' + 'devis_envoye' + 'devis_accepte' + 'en_production')
  const inProgressStatuses = ['en_verification', 'devis_envoye', 'devis_accepte', 'en_production'];
  const inProgressOrders = orders.filter(o => inProgressStatuses.includes(o.status));
  const countInProgress = inProgressOrders.length;

  // 3. Prêtes à livrer (statut 'pret')
  const readyOrders = orders.filter(o => o.status === 'pret');
  const countReady = readyOrders.length;

  // 4. Livrées ce mois (statut 'livre' + créées ce mois)
  const deliveredThisMonth = orders.filter(o => {
    if (o.status !== 'livre' || !o.createdAt) return false;
    const date = typeof o.createdAt.toDate === 'function' ? o.createdAt.toDate() : new Date(o.createdAt as any);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });
  const countDelivered = deliveredThisMonth.length;

  const latestOrders = orders.slice(0, 5);

  const getFormattedDate = (createdAt: any) => {
    if (!createdAt) return 'Date inconnue';
    const date = typeof createdAt.toDate === 'function' ? createdAt.toDate() : new Date(createdAt);
    return date.toLocaleDateString('fr-BJ', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl max-w-lg mx-auto space-y-3 mt-10">
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <h3 className="font-extrabold text-white">Une erreur s'est produite lors de la connexion</h3>
        </div>
        <p className="text-xs text-slate-400 leading-normal">
          {error.message || 'Impossible de charger les données du dashboard en temps réel. Veuillez vérifier la connexion ou les règles de sécurité.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Upper header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <span className="text-[10px] uppercase font-black text-yellow-400 tracking-widest bg-yellow-500/10 border border-yellow-500/25 px-2.5 py-1 rounded-full mb-2 inline-block">
            Panel d'administration
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight">Tableau de Bord Atelier</h1>
          <p className="text-slate-400 text-xs mt-1">Supervisez l'impression numérique à Cotonou avec mise à jour automatique.</p>
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-300 border border-green-500/20 rounded-xl text-xs font-bold shadow-[0_0_15px_rgba(34,197,94,0.1)]">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-ping"></span>
            Supervision Temps Réel Actuelle
          </span>
        </div>
      </div>

      {/* 4 Cards Stats Matrix */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-900 border border-white/10 rounded-2xl p-6 space-y-3 animate-pulse">
              <div className="h-2 w-24 bg-white/10 rounded"></div>
              <div className="h-8 w-16 bg-white/10 rounded"></div>
              <div className="h-2 w-32 bg-white/10 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="dashboard-statistics-cards">
          
          {/* Nouvelles commandes */}
          <div className="bg-gradient-to-br from-red-950/20 to-slate-900 border border-red-500/25 shadow-lg shadow-red-950/10 p-6 rounded-2xl space-y-3 relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-300">
              <ClipboardList className="w-16 h-16 text-red-500" />
            </div>
            <div className="text-slate-400 text-xs font-extrabold uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
              Nouvelles Commandes
            </div>
            <div className="text-4xl font-black text-rose-500">{countNew}</div>
            <p className="text-xs text-slate-400">En attente d'évaluation de devis</p>
          </div>

          {/* En cours */}
          <div className="bg-[#1e293b]/50 border border-white/10 p-6 rounded-2xl space-y-3 relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-300">
              <Hourglass className="w-16 h-16 text-yellow-500" />
            </div>
            <div className="text-slate-400 text-xs font-extrabold uppercase tracking-widest">En cours de traitement</div>
            <div className="text-4xl font-black text-yellow-400">{countInProgress}</div>
            <p className="text-xs text-slate-400">De devis-envoyé à production</p>
          </div>

          {/* Prêtes à livrer */}
          <div className="bg-[#1e293b]/50 border border-slate-500/20 p-6 rounded-2xl space-y-3 relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-300">
              <Sparkles className="w-16 h-16 text-emerald-500" />
            </div>
            <div className="text-slate-400 text-xs font-extrabold uppercase tracking-widest">Prêtes à Livrer</div>
            <div className="text-4xl font-black text-green-400">{countReady}</div>
            <p className="text-xs text-slate-400">Imprimées & prêtes au retrait</p>
          </div>

          {/* Livrées ce mois */}
          <div className="bg-[#1e293b]/50 border border-white/10 p-6 rounded-2xl space-y-3 relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-300">
              <CheckCircle className="w-16 h-16 text-indigo-500" />
            </div>
            <div className="text-slate-400 text-xs font-extrabold uppercase tracking-widest text-indigo-300">Livrées ce mois</div>
            <div className="text-4xl font-black text-white">{countDelivered}</div>
            <p className="text-xs text-slate-400">Mois civil en cours</p>
          </div>

        </div>
      )}

      {/* 5 Latest Orders Panel */}
      <div className="backdrop-blur-xl bg-[#1e293b]/40 border border-white/10 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap border-b border-white/5 pb-4">
          <div className="space-y-0.5">
            <h3 className="text-lg font-black text-white">Dernières Ordonnances d'impression</h3>
            <p className="text-xs text-slate-400">Accès rapide aux 5 dernières demandes d'atelier émises par les clients.</p>
          </div>
          <Link 
            to="/admin/orders" 
            className="text-xs font-bold text-yellow-400 inline-flex items-center gap-1 hover:underline hover:text-yellow-350 transition-all"
            id="dashboard-all-orders-btn"
          >
            <span>Voir toutes les commandes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3 pt-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-white/5 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : latestOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
            <div className="p-4 bg-white/5 border border-white/5 rounded-full text-slate-400">
              <Inbox className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-300">Aucune commande enregistrée</h4>
              <p className="text-xs text-slate-500 max-w-sm">Le tableau de bord est prêt. Dès qu'un client s'inscrira et émettra une bâche ou un roll-up, elle s'affichera ici.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap" id="latest-orders-table">
              <thead>
                <tr className="text-xs text-slate-400 font-extrabold uppercase border-b border-white/10">
                  <th className="py-3.5 px-3">Numéro</th>
                  <th className="py-3.5 px-3">Client</th>
                  <th className="py-3.5 px-3">Service Demandé</th>
                  <th className="py-3.5 px-3">Statut</th>
                  <th className="py-3.5 px-3">Date</th>
                  <th className="py-3.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {latestOrders.map((order) => (
                  <tr 
                    key={order.id} 
                    className={`hover:bg-white/5 transition-colors ${
                      order.status === 'nouveau' ? 'bg-red-500/5' : ''
                    }`}
                  >
                    <td className="py-4 px-3">
                      <span className="font-mono text-xs text-yellow-400 font-extrabold bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/15">
                        #{order.orderNumber}
                      </span>
                    </td>
                    <td className="py-4 px-3 font-bold text-white">
                      <div>
                        <div>{order.clientName}</div>
                        {(order as any).companyName && (
                          <div className="text-[11px] text-slate-400 leading-none mt-0.5">{(order as any).companyName}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-3">
                      <div className="text-xs text-slate-300">
                        {getServiceTypeLabel(order.serviceType)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {order.dimensions?.width}x{order.dimensions?.height} {order.dimensions?.unit || 'm'}
                      </div>
                    </td>
                    <td className="py-4 px-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-4 px-3 text-xs text-slate-400">
                      {getFormattedDate(order.createdAt)}
                    </td>
                    <td className="py-4 px-3 text-right">
                      <Link 
                        to={`/admin/orders/${order.id}`}
                        className="px-3 py-1.5 bg-white/5 hover:bg-yellow-500 hover:text-slate-950 text-white font-bold rounded-lg text-xs border border-white/10 transition-all duration-150"
                      >
                        Gérer &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dynamic database seed widget */}
      {(showSeedButton || statusMessage) && (
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-extrabold text-white">⚙️ Configuration Initiale de l'Atelier</h4>
            {statusMessage ? (
              <p className="text-xs text-green-450 font-black">{statusMessage}</p>
            ) : (
              <p className="text-xs text-slate-450 font-semibold leading-relaxed">
                Le catalogue des prestations de service (Bâche grand format, Textile, etc.) et leurs tarifs de base n'est pas encore initialisé dans votre Firestore. Cliquez sur le bouton ci-contre pour générer le référentiel tarifaire officiel de Le Menu Service.
              </p>
            )}
          </div>
          {showSeedButton && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="shrink-0 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 duration-150 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {seeding ? 'Initialisation en cours...' : 'Initialiser le Catalogue Services'}
            </button>
          )}
        </div>
      )}

      {/* Guide & Rules alert */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-3 text-xs text-slate-300">
        <Navigation className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-black text-white">Prêt pour l'activité d'atelier</span>
          <p className="leading-relaxed">
            Ce tableau de bord est connecté directement à Google Firestore. Dès que vous créez ou mettez à jour une commande via l'outil ou par un compte client fictif, sa validation, son devis et sa mise en production s'affichent en temps réel sans besoin de recharger.
          </p>
        </div>
      </div>

    </div>
  );
}
