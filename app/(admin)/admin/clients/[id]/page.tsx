import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, doc, query, where, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../../../../lib/firebase/config';
import { useOrders } from '../../../../../hooks/useOrders';
import OrderCard from '../../../../../components/admin/OrderCard';
import { User, Quote } from '../../../../../types';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Briefcase, 
  Calendar, 
  ChevronLeft, 
  Save, 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  ShoppingBag,
  Info,
  Layers,
  Sparkles
} from 'lucide-react';

export default function AdminClientDetailPage({ params: routeParams }: { params?: { id: string } }) {
  const routerParams = useParams();
  const clientId = routeParams?.id || routerParams.id || '';

  const [clientProfile, setClientProfile] = useState<User | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [clientQuotes, setClientQuotes] = useState<Quote[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(true);

  // Form inputs for contact modifications
  const [displayName, setDisplayName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Fetch orders of this client
  const { orders, loading: ordersLoading } = useOrders(clientId);

  useEffect(() => {
    if (!clientId) return;

    // Sync client's profile from Firestore list
    const userDocRef = doc(db, 'users', clientId);
    const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as User;
        setClientProfile(data);
        setDisplayName(data.displayName || '');
        setCompanyName(data.companyName || '');
        setEmail(data.email || '');
        setPhone(data.phone || '');
      } else {
        console.error("Profil client introuvable dans la base de données.");
      }
      setProfileLoading(false);
    }, (err) => {
      console.error("Erreur d'importation client:", err);
      setProfileLoading(false);
    });

    // Sync accepted quotes of this client
    const quotesRef = collection(db, 'quotes');
    const qQuotes = query(quotesRef, where('clientId', '==', clientId), where('status', '==', 'accepted'));
    const unsubscribeQuotes = onSnapshot(qQuotes, (snap) => {
      const items: Quote[] = [];
      snap.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as Quote);
      });
      setClientQuotes(items);
      setQuotesLoading(false);
    }, (err) => {
      console.error("Erreur d'importation devis client:", err);
      setQuotesLoading(false);
    });

    return () => {
      unsubscribeProfile();
      unsubscribeQuotes();
    };
  }, [clientId]);

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !email.trim() || !phone.trim()) {
      setStatusMessage({ type: 'error', text: 'Le nom de l\'interlocuteur, l\'email de facturation et le téléphone de contact sont requis.' });
      return;
    }

    setSaving(true);
    setStatusMessage(null);

    try {
      const userRef = doc(db, 'users', clientId);
      await updateDoc(userRef, {
        displayName: displayName.trim(),
        companyName: companyName.trim(),
        email: email.trim(),
        phone: phone.trim()
      });

      setStatusMessage({ type: 'success', text: 'Fiche de contact mise à jour avec succès dans Firestore !' });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (error: any) {
      console.error(error);
      setStatusMessage({ type: 'error', text: 'Erreur d\'écriture système : ' + error.message });
    } finally {
      setSaving(false);
    }
  };

  const getFormattedDate = (createdAt: any) => {
    if (!createdAt) return 'Non renseignée';
    const date = typeof createdAt.toDate === 'function' ? createdAt.toDate() : new Date(createdAt);
    return date.toLocaleDateString('fr-BJ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Compute dynamic counters
  const totalOrders = orders.length;
  const activeOrders = orders.filter((o) => o.status !== 'livre' && o.status !== 'annule').length;
  const deliveredOrders = orders.filter((o) => o.status === 'livre').length;
  const totalSpent = clientQuotes.reduce((acc, q) => acc + (q.amount || 0), 0);

  const mainLoading = profileLoading || quotesLoading || ordersLoading;

  return (
    <div className="space-y-6 animate-fade-in" id="admin-client-detail-container">
      
      {/* Upper Navigation Links & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div className="space-y-1">
          <Link
            to="/admin/clients"
            className="inline-flex items-center gap-1.5 text-xs text-slate-450 hover:text-yellow-400 font-bold transition-all mb-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Retour à l'annuaire client</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Fiche Client • <span className="text-yellow-400">{clientProfile?.displayName || 'Partenaire'}</span>
            </h1>
          </div>
        </div>

        <div className="text-xs font-mono bg-slate-900 border border-white/5 px-4 py-2 rounded-xl text-slate-400 flex items-center gap-2">
          <span>ID de compte :</span>
          <span className="text-yellow-300 font-bold">{clientId}</span>
        </div>
      </div>

      {mainLoading ? (
        <div className="flex flex-col items-center justify-center p-24 space-y-4">
          <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase font-bold">Extraction des données client...</span>
        </div>
      ) : !clientProfile ? (
        <div className="backdrop-blur-xl bg-slate-900/40 border border-dashed border-red-500/20 p-12 text-center rounded-3xl space-y-3">
          <UserIcon className="w-10 h-10 text-red-400 mx-auto" />
          <h4 className="text-xs font-black text-white">Profil introuvable</h4>
          <p className="text-[10px] text-slate-400">Ce client n'a pas été trouvé dans notre base de données.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Column: Stats & Edit Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Realtime Stats Summary dashboard */}
            <div className="bg-slate-900 border border-white/5 rounded-3xl p-5 space-y-4 shadow-xl">
              <h3 className="text-[10px] font-black tracking-widest text-slate-500 uppercase flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                <span>Indicateurs clé activité</span>
              </h3>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5">
                  <span className="text-[9px] text-slate-500 uppercase font-black block leading-none mb-1.5">Commandes</span>
                  <div className="flex items-center gap-1 text-white">
                    <ShoppingBag className="w-4 h-4 text-yellow-400" />
                    <span className="text-base font-black font-mono">{totalOrders}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5">
                  <span className="text-[9px] text-slate-500 uppercase font-black block leading-none mb-1.5">En cours</span>
                  <div className="flex items-center gap-1 text-white">
                    <Clock className="w-4 h-4 text-blue-400 animate-pulse" />
                    <span className="text-base font-black font-mono">{activeOrders}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5">
                  <span className="text-[9px] text-slate-500 uppercase font-black block leading-none mb-1.5">Livrées</span>
                  <div className="flex items-center gap-1 text-white">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-base font-black font-mono">{deliveredOrders}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5">
                  <span className="text-[9px] text-slate-500 uppercase font-black block leading-none mb-1.5">Dépensé</span>
                  <div className="flex items-center gap-1 text-green-400">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-xs font-black font-mono">{totalSpent.toLocaleString('fr-BJ')}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-[10px] text-slate-500 flex items-center gap-1.5 font-medium border-t border-white/5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Date d'inscription : {getFormattedDate(clientProfile?.createdAt)}</span>
              </div>
            </div>

            {/* Editable Profile Information form */}
            <div className="bg-slate-900 border border-white/5 rounded-3xl p-5 shadow-xl space-y-4">
              <h3 className="text-[10px] font-black tracking-widest text-slate-500 uppercase flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-yellow-500" />
                <span>Modifier les Coordonnées</span>
              </h3>

              {statusMessage && (
                <div className={`p-3 rounded-xl text-xs font-black ${
                  statusMessage.type === 'success' 
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {statusMessage.text}
                </div>
              )}

              <form onSubmit={handleUpdateContact} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[9px] uppercase tracking-wider font-bold text-slate-500">Nom Complet Interlocuteur</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 hover:border-white/16 focus:border-yellow-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] uppercase tracking-wider font-bold text-slate-500">Raison Sociale / Société</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Ex: Agence Cotonou Médias"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 hover:border-white/16 focus:border-yellow-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] uppercase tracking-wider font-bold text-slate-500">Email de facturation</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 hover:border-white/16 focus:border-yellow-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] uppercase tracking-wider font-bold text-slate-500">Téléphone Mobile</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 hover:border-white/16 focus:border-yellow-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full h-10 bg-yellow-600 hover:bg-yellow-500 disabled:bg-slate-800 disabled:text-slate-500 text-white hover:text-slate-950 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-slate-950/40"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Enregistrement...' : 'SAUVEGARDER'}</span>
                </button>
              </form>
            </div>

          </div>

          {/* Right Columns: Historic Order logs list */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <h3 className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-yellow-550" />
                <span>Historique d'impressions ({orders.length})</span>
              </h3>
            </div>

            {orders.length === 0 ? (
              <div className="p-12 border border-dashed border-white/10 rounded-3xl text-center bg-slate-900/30 space-y-3.5">
                <ShoppingBag className="w-10 h-10 text-slate-705 mx-auto" />
                <div className="space-y-1.5 max-w-sm mx-auto">
                  <h4 className="text-xs font-black text-white">Aucun dossier commandé</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                    Ce client n'a passé aucune commande ou n'a aucun fichier d'impression grand format dans son historique d'Atelier.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
