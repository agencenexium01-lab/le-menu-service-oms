import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../../../lib/firebase/config';
import { useOrders } from '../../../../hooks/useOrders';
import { User, Quote } from '../../../../types';
import { 
  Search, 
  Mail, 
  Phone, 
  FileText, 
  ChevronRight, 
  User as UserIcon, 
  Briefcase,
  TrendingUp,
  Hash,
  ShoppingBag,
  Users
} from 'lucide-react';

export default function AdminClientsPage() {
  const [clients, setClients] = useState<User[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const { orders, loading: ordersLoading } = useOrders();

  useEffect(() => {
    // Sync client users in real-time
    const clientsRef = collection(db, 'users');
    const qClients = query(clientsRef, where('role', '==', 'client'));
    
    const unsubscribeClients = onSnapshot(qClients, (snap) => {
      const items: User[] = [];
      snap.forEach((doc) => {
        items.push({ uid: doc.id, ...doc.data() } as User);
      });
      setClients(items);
      setClientsLoading(false);
    }, (err) => {
      console.error("Erreur de récupération des clients:", err);
      setClientsLoading(false);
    });

    // Sync accepted quotes in real-time to compute total spent
    const quotesRef = collection(db, 'quotes');
    const qQuotes = query(quotesRef, where('status', '==', 'accepted'));
    
    const unsubscribeQuotes = onSnapshot(qQuotes, (snap) => {
      const items: Quote[] = [];
      snap.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as Quote);
      });
      setQuotes(items);
      setQuotesLoading(false);
    }, (err) => {
      console.error("Erreur de récupération des devis:", err);
      setQuotesLoading(false);
    });

    return () => {
      unsubscribeClients();
      unsubscribeQuotes();
    };
  }, []);

  const getFormattedDate = (createdAt: any) => {
    if (!createdAt) return 'Inconnu';
    const date = typeof createdAt.toDate === 'function' ? createdAt.toDate() : new Date(createdAt);
    return date.toLocaleDateString('fr-BJ', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Filter clients based on search input
  const filteredClients = clients.filter((client) => {
    const name = (client.displayName || '').toLowerCase();
    const company = (client.companyName || '').toLowerCase();
    const email = (client.email || '').toLowerCase();
    const phone = (client.phone || '').toLowerCase();
    const search = searchTerm.toLowerCase();

    return name.includes(search) || company.includes(search) || email.includes(search) || phone.includes(search);
  });

  const getClientStats = (clientUid: string) => {
    const clientOrders = orders.filter((o) => o.clientId === clientUid);
    const clientQuotes = quotes.filter((q) => q.clientId === clientUid);
    const totalSpent = clientQuotes.reduce((acc, q) => acc + (q.amount || 0), 0);

    return {
      orderCount: clientOrders.length,
      totalSpent
    };
  };

  const isLoading = clientsLoading || quotesLoading || ordersLoading;

  return (
    <div className="space-y-6 animate-fade-in" id="admin-clients-page">
      {/* Header and metadata info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Portefeuille Clients</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Consultez l'historique des tirages, les chiffres d'affaires et les coordonnées de vos partenaires d'impression.</p>
        </div>
        
        {/* Quick analytics counters */}
        <div className="flex gap-4">
          <div className="px-5 py-3 bg-slate-900 border border-white/5 rounded-2xl flex items-center gap-3">
            <Users className="w-5 h-5 text-yellow-400" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Partenaires</span>
              <span className="text-sm font-black text-white">{clients.length}</span>
            </div>
          </div>
          <div className="px-5 py-3 bg-slate-900 border border-white/5 rounded-2xl flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">CA Signé</span>
              <span className="text-sm font-black text-white">
                {quotes.reduce((acc, q) => acc + (q.amount || 0), 0).toLocaleString('fr-BJ')} XOF
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Query Filters Bar */}
      <div className="flex items-center bg-slate-900 border border-white/5 p-4 rounded-2xl w-full">
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Rechercher par nom d'interlocuteur, entreprise, email, ou téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-white/10 hover:border-white/18 focus:border-yellow-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Primary clients directory body */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase font-bold">Extraction des fichiers partenaires...</span>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="backdrop-blur-xl bg-slate-900/40 border border-dashed border-white/10 p-16 text-center rounded-3xl space-y-3">
          <UserIcon className="w-10 h-10 text-slate-700 mx-auto" />
          <div className="max-w-sm mx-auto space-y-1">
            <h4 className="text-xs font-black text-white">Aucun client trouvé</h4>
            <p className="text-[10px] text-slate-400 leading-normal font-medium">Nous n'avons trouvé aucun profil client correspondant à votre recherche.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Table display for larger displays (Desktop/Tablet) */}
          <div className="hidden lg:block overflow-x-auto backdrop-blur-md bg-slate-900/40 rounded-2xl border border-white/5 shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-slate-900 text-slate-400 text-[10px] uppercase tracking-wider font-mono font-black">
                  <th className="py-4.5 px-6">Partenaire / Interlocuteur</th>
                  <th className="py-4.5 px-6">Société d'impression</th>
                  <th className="py-4.5 px-6">Coordonnées de contact</th>
                  <th className="py-4.5 px-6 text-center">Historique</th>
                  <th className="py-4.5 px-6 text-right">Chiffre d'Affaire</th>
                  <th className="py-4.5 px-6 text-right">Inscription</th>
                  <th className="py-4.5 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filteredClients.map((client) => {
                  const stats = getClientStats(client.uid);
                  return (
                    <tr 
                      key={client.uid} 
                      id={`client-table-row-${client.uid}`}
                      className="hover:bg-white/3 transition-colors group"
                    >
                      <td className="py-4 px-6 font-bold text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-yellow-500/10 text-yellow-500 rounded-lg flex items-center justify-center font-bold">
                            {client.displayName?.slice(0, 2).toUpperCase() || 'CP'}
                          </div>
                          <div className="min-w-0">
                            <span className="block truncate font-black">{client.displayName}</span>
                            <span className="text-[9px] font-mono font-semibold text-slate-500">#{client.uid.slice(0, 8)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-300 font-semibold">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                          <span>{client.companyName || 'Compte personnel'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 space-y-1 font-semibold">
                        <a 
                          href={`mailto:${client.email}`} 
                          className="flex items-center gap-1.5 text-slate-400 hover:text-yellow-400 transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          <span className="truncate">{client.email}</span>
                        </a>
                        <a 
                          href={`tel:${client.phone}`} 
                          className="flex items-center gap-1.5 text-slate-450 hover:text-green-400 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          <span>{client.phone}</span>
                        </a>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/50 border border-white/5 text-slate-300 font-bold text-[10px]">
                          <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
                          <span>{stats.orderCount} dossier{stats.orderCount > 1 ? 's' : ''}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-black text-green-400">
                        {stats.totalSpent.toLocaleString('fr-BJ')} XOF
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-slate-400 font-semibold">
                        {getFormattedDate(client.createdAt)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Link
                          to={`/admin/clients/${client.uid}`}
                          className="inline-flex items-center justify-center p-2 bg-yellow-500/10 hover:bg-yellow-500 text-yellow-400 hover:text-slate-950 rounded-xl transition-all cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Core cards layout for smaller displays (Mobile) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
            {filteredClients.map((client) => {
              const stats = getClientStats(client.uid);
              return (
                <div 
                  key={client.uid}
                  className="bg-slate-900 border border-white/5 rounded-3xl p-5 space-y-4 shadow-xl"
                  id={`client-card-mobile-${client.uid}`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-500/10 text-yellow-500 rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
                        {client.displayName?.slice(0, 2).toUpperCase() || 'CP'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-white text-xs truncate">{client.displayName}</h4>
                        <span className="text-[9px] text-slate-500 font-mono">#{client.uid.slice(0, 8)}</span>
                      </div>
                    </div>

                    <Link
                      to={`/admin/clients/${client.uid}`}
                      className="px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500 text-yellow-400 hover:text-slate-950 rounded-xl font-bold text-[10px] flex items-center gap-1 transition-all"
                    >
                      <span>Fiche</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="border-t border-white/5 pt-3 space-y-2 text-xs font-semibold">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[10px] uppercase font-bold">Entreprise</span>
                      <span className="text-slate-300">{client.companyName || 'Compte personnel'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[10px] uppercase font-bold">E-mail</span>
                      <a href={`mailto:${client.email}`} className="text-yellow-400 hover:underline">{client.email}</a>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[10px] uppercase font-bold">Téléphone</span>
                      <a href={`tel:${client.phone}`} className="text-green-400 hover:underline">{client.phone}</a>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-3 font-mono">
                    <div className="p-3 bg-slate-950/40 rounded-2xl flex flex-col justify-center border border-white/5">
                      <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Dossiers</span>
                      <span className="text-xs font-black text-slate-200">{stats.orderCount} tirages</span>
                    </div>

                    <div className="p-3 bg-slate-950/40 rounded-2xl flex flex-col justify-center border border-white/5">
                      <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Total payé</span>
                      <span className="text-xs font-black text-green-400">{stats.totalSpent.toLocaleString('fr-BJ')}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 text-[10px] text-slate-500 font-medium">
                    <span>Inscrit le {getFormattedDate(client.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
