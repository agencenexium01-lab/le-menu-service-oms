import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOrders } from '@/hooks/useOrders';
import { useBranches } from '@/hooks/useBranches';
import Logo from '@/components/shared/Logo';
import Footer from '@/components/shared/Footer';
import { Building2, Users, LayoutDashboard, LogOut, FileText, BadgeAlert, Building, Menu, X, BarChart3 } from 'lucide-react';
import NotificationBell, { NotificationPermissionBanner } from '@/components/shared/NotificationBell';
import { requestNotificationPermission } from '@/lib/notifications';

interface ProLayoutProps {
  children: React.ReactNode;
}

export default function ProLayout({ children }: ProLayoutProps) {
  const { logout, userProfile, loading } = useAuth();
  const { orders } = useOrders();
  const { branches } = useBranches();
  const location = useLocation();
  const navigate = useNavigate();
  const { branchId } = useParams();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (userProfile && userProfile.role !== 'client' && userProfile.active !== false) {
      requestNotificationPermission();
    }
  }, [userProfile]);

  useEffect(() => {
    if (!loading) {
      if (!userProfile) navigate('/pro/connexion');
      else if (userProfile.role === 'client') navigate('/connexion');
    }
  }, [userProfile, loading, navigate]);

  if (loading || !userProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 bg-[#0E1735] text-white">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-mono text-slate-400 animate-pulse">Vérification de l'habilitation professionnelle...</p>
      </div>
    );
  }

  if (userProfile.active === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 bg-[#0E1735] text-white">
        <div className="bg-[#1A1A6E] border border-red-500/25 p-8 rounded-2xl max-w-sm w-full shadow-2xl space-y-4">
          <BadgeAlert className="w-16 h-16 text-red-500 mx-auto animate-bounce" />
          <h2 className="text-lg font-black tracking-tight uppercase">Accès Suspendu</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Votre compte de collaborateur a été désactivé. Vous n'êtes plus habilité à vous connecter.
          </p>
          <button
            onClick={() => { logout(); navigate('/pro/connexion'); }}
            className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs uppercase transition-colors"
          >
            Se Déconnecter
          </button>
        </div>
      </div>
    );
  }

  const isSuperAdmin = userProfile.role === 'super_admin' || userProfile.role === 'admin';
  const myBranchId = userProfile.branchId || branchId || '';

  const superAdminPendingCount = orders.filter(o => o.status === 'nouveau').length;
  const branchPendingCount = orders.filter(o => o.status === 'nouveau' && o.branchId === myBranchId).length;

  const adminNavItems = [
    { label: '🏢 Vue Globale', path: '/pro/proprietaire', icon: Building2 },
    { label: '📦 Toutes les Commandes', path: '/pro/proprietaire/commandes', icon: FileText, badge: superAdminPendingCount > 0 ? superAdminPendingCount : undefined },
    { label: '📊 Rapports', path: '/pro/proprietaire/rapports', icon: BarChart3 },
    { label: '🏬 Mes Sièges', path: '/pro/proprietaire/branches', icon: Building },
    { label: '👥 Mon Équipe', path: '/pro/proprietaire/equipe', icon: Users }
  ];

  const staffNavItems = [
    { label: '📊 Mon Dashboard', path: `/pro/point/${myBranchId}`, icon: LayoutDashboard },
    { label: '📦 Commandes', path: `/pro/point/${myBranchId}/commandes`, icon: FileText, badge: branchPendingCount > 0 ? branchPendingCount : undefined },
    { label: '👥 Clients', path: `/pro/point/${myBranchId}/clients`, icon: Users }
  ];

  const currentNavItems = isSuperAdmin ? adminNavItems : staffNavItems;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#0E1735]">
      
      {/* Mobile Bar */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-[#111A36] border-b border-white/10 text-white">
        <div className="flex items-center gap-2">
          <Logo variant="sidebar" />
          <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">PRO</span>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-white/80">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`${mobileMenuOpen ? 'flex' : 'hidden'} lg:flex w-full lg:w-72 bg-[#1A1A6E] border-b lg:border-b-0 lg:border-r border-white/10 flex-col shrink-0 text-white z-45 lg:sticky lg:top-0 lg:h-screen`}>
        <div className="p-6 border-b border-white/10 flex flex-col items-center justify-center gap-2">
          <Logo variant="sidebar" />
          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded bg-blue-400/10 text-blue-300 border border-blue-500/20">
            CONSOLE PRO
          </span>
        </div>

        <div className="px-6 py-3 border-b border-white/10 flex items-center justify-between bg-[#13135A]/30">
          <span className="text-[10px] font-black text-slate-400 uppercase">Alertes & Sons :</span>
          <NotificationBell />
        </div>

        <div className="p-4 mx-4 mt-4 bg-white/5 rounded-2xl space-y-1.5 text-[11px] border border-white/5">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Nom :</span>
            <span className="font-bold truncate max-w-[120px]">{userProfile.displayName || userProfile.email.split('@')[0]}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Accès :</span>
            <span className="text-yellow-400 font-extrabold text-[9px] bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20">
              {isSuperAdmin ? 'SUPER ADMIN' : 'CHEF POINT'}
            </span>
          </div>
        </div>

        <nav className="flex-grow p-4 space-y-4 overflow-y-auto">
          
          {/* ⚡ ACTION RAPIDE : Affichée uniquement pour le Chef de Point pour insérer manuellement une commande/client */}
          {!isSuperAdmin && (
            <div className="px-1 pb-2">
              <Link
                to={`/pro/point/${myBranchId}/commandes/nouvelle`}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase rounded-xl shadow-md transition-all border border-emerald-500/20 tracking-wider"
              >
                <span>➕ Nouveau Dépôt / Client</span>
              </Link>
            </div>
          )}

          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-3 block">Navigation</span>
          <div className="space-y-1">
            {currentNavItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/pro/proprietaire' && location.pathname.startsWith(item.path));
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-2 py-0.5 text-[9px] font-black bg-yellow-400 text-slate-900 rounded-full animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-white/10 bg-black/10">
          <button
            onClick={() => { logout(); navigate('/pro/connexion'); }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-red-400 hover:bg-red-500/10 rounded-xl text-xs font-bold transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Déconnexion Console</span>
          </button>
        </div>
      </aside>

      {/* Main Section */}
      <main className="flex-grow p-4 lg:p-8 text-white bg-[#0E1735] min-h-screen flex flex-col justify-between min-w-0" id="pro-main-section">
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in w-full flex-grow">
          <NotificationPermissionBanner />
          {children}
        </div>

        {/* Isolation thématique du footer pour le mode sombre */}
        <div className="max-w-7xl mx-auto w-full mt-16 pt-8 border-t border-white/5 bg-[#0E1735] rounded-xl">
          <Footer />
        </div>
      </main>

    </div>
  );
}