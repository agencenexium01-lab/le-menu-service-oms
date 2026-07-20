import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { subscribeOrdersByBranch } from '@/lib/firebase/firestore';
import { useBranches } from '@/hooks/useBranches';
import { Order } from '@/types';
import { 
  Users, 
  Search, 
  Building2, 
  Inbox, 
  Mail, 
  Phone,
  FileCheck2,
  Loader2
} from 'lucide-react';

interface GroupedClient {
  email: string;
  name: string;
  companyName: string;
  phone: string;
  totalOrders: number;
}

export default function ChefPointClientsPage() {
  const { branchId } = useParams<{ branchId: string }>();
  const { userProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { branches, loading: branchesLoading } = useBranches();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 🛡️ 1. Group orders by client email (Toujours déclarer les useMemo en haut !)
  const distinctClients = useMemo(() => {
    const clientsMap: { [email: string]: GroupedClient } = {};

    orders.forEach((o) => {
      const email = o.clientEmail || 'inconnu';
      if (!clientsMap[email]) {
        clientsMap[email] = {
          email,
          name: o.clientName || 'Anonyme',
          companyName: (o as any).companyName || 'Aucune',
          phone: (o as any).clientPhone || (o.clientEmail ? 'Enregistré' : 'Inconnu'),
          totalOrders: 0
        };
      }
      clientsMap[email].totalOrders += 1;
    });

    let clientsList = Object.values(clientsMap);

    // Filter by text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      clientsList = clientsList.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.companyName.toLowerCase().includes(query)
      );
    }

    return clientsList.sort((a, b) => b.totalOrders - a.totalOrders);
  }, [orders, searchQuery]);

  // Security guard check
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
          navigate(`/pro/point/${userProfile.branchId}/clients`);
          return;
        }
      }
    }
  }, [userProfile, authLoading, branchId, navigate]);

  // Subscribe to branch orders
  useEffect(() => {
    if (!branchId) return;

    setLoading(true);
    const unsubscribe = subscribeOrdersByBranch(branchId, (syncedOrders) => {
      setOrders(syncedOrders);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [branchId]);

  const currentBranch = branches.find(b => b.id === branchId);

  // 🚧 2. Les retours conditionnels d'affichage viennent UNIQUEMENT ici
  if (authLoading || branchesLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4 animate-fade-in min-h-[50vh]">
        <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
        <div className="text-slate-400 font-bold text-xs uppercase tracking-wider font-mono">Vérification de la sécurité du siège...</div>
      </div>
    );
  }

  // 💻 3. Rendu principal
  return (
    <div className="space-y-6 text-white">
      
      {/* Header section with search */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <span className="text-[10px] uppercase font-black text-blue-400 tracking-wider bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/10">
            {currentBranch ? currentBranch.name : 'Siège'}
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1.5">Clients Partenaires Répertoriés</h1>
          <p className="text-xs text-slate-400 mt-1">
            Recherchez et consultez le portefeuille des clients ayant émis des bons d'impression au sein de votre point d'accès.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-450" />
          <input 
            type="text" 
            placeholder="Rechercher par nom, email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 pl-9 pr-4 py-2 bg-[#111A36] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Main rendering */}
      {loading ? (
        <div className="space-y-3 pt-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : distinctClients.length === 0 ? (
        <div className="bg-[#111A36]/40 border border-white/10 rounded-2xl py-16 px-4 text-center space-y-4 max-w-2xl mx-auto mt-6">
          <div className="p-5 bg-white/5 border border-white/5 rounded-full inline-flex text-slate-500">
            <Users className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-white">Aucun client répertorié</h3>
            <p className="text-xs text-slate-400 leading-normal max-w-sm mx-auto">
              {searchQuery.trim()
                ? `Aucun résultat pour la recherche "${searchQuery}".`
                : "Aucun client n'a encore passé de commande d'impression sur cette succursale."}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-[#111A36] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="text-xs text-slate-400 font-extrabold uppercase border-b border-white/10 bg-white/5">
                  <th className="py-4 px-4">Nom complet</th>
                  <th className="py-4 px-4">Société / Entreprise</th>
                  <th className="py-4 px-4">Adresse Email</th>
                  <th className="py-4 px-4 text-center">Bons d'impression déposés</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-200">
                {distinctClients.map((client) => (
                  <tr key={client.email} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 font-bold text-white text-sm">
                      {client.name}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>{client.companyName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 font-mono text-slate-300">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span>{client.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-500/10 text-blue-300 border border-blue-500/15">
                        <FileCheck2 className="w-3 h-3 text-blue-400" />
                        <span>{client.totalOrders} commandes</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}