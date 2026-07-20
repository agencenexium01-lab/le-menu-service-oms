import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import NotificationBell, { NotificationPermissionBanner } from '@/components/shared/NotificationBell';
import { requestNotificationPermission } from '@/lib/notifications';
import Footer from '../../../components/shared/Footer';
import { PlusCircle, ListOrdered, LogOut, User as UserIcon, ChevronDown } from 'lucide-react';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const { logout, userProfile } = useAuth();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (userProfile) {
      requestNotificationPermission();
    }
  }, [userProfile]);

  const menuItems = [
    { label: 'Mes Commandes', path: '/client', icon: ListOrdered, exact: true },
    { label: 'Nouvelle Commande', path: '/client/orders/new', icon: PlusCircle, exact: false }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-brand-dark" id="client-root-layout">
      {/* Barre de Navigation Haute */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/95 border-b border-brand-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Zone Logo */}
          <div className="flex items-center gap-8">
            <Link to="/client" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
              <div className="w-9 h-9 bg-brand-pink rounded-lg flex items-center justify-center text-white font-black text-lg shadow-md">
                M
              </div>
              <div className="hidden sm:block">
                <span className="font-extrabold text-brand-dark text-base tracking-tight block">Le Menu <span className="text-brand-pink">Service</span></span>
                <span className="text-[10px] text-brand-muted font-bold block leading-none uppercase tracking-wider">Espace Client</span>
              </div>
            </Link>

            {/* Liens de Navigation */}
            <nav className="flex items-center gap-1 sm:gap-2">
              {menuItems.map((item) => {
                const isActive = item.exact 
                  ? location.pathname === item.path || location.pathname === '/client/orders'
                  : location.pathname.startsWith(item.path);
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
                      isActive 
                        ? 'bg-brand-pink/10 text-brand-pink border border-brand-pink/20 shadow-sm' 
                        : 'text-brand-muted hover:text-brand-pink hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">{item.label}</span>
                    <span className="inline md:hidden">{item.label === 'Nouvelle Commande' ? 'Commander' : 'Mes Commandes'}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Actions Droite */}
          <div className="flex items-center gap-4">
            <NotificationBell />

            {/* Menu Profil */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 bg-slate-50 border border-brand-border hover:bg-slate-100 rounded-xl transition-all cursor-pointer text-brand-dark"
              >
                <div className="w-6 h-6 rounded-lg bg-brand-pink-light text-brand-pink flex items-center justify-center font-bold text-xs border border-brand-pink-light">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
                <span className="hidden sm:inline text-xs font-bold truncate max-w-[100px]">
                  {userProfile?.displayName?.split(' ')[0] || 'Client'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-brand-muted" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2.5 w-56 bg-white border border-brand-border rounded-2xl shadow-2xl p-2 z-50 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 py-2 border-b border-brand-border text-left mb-1.5">
                    <span className="text-[9px] uppercase font-black text-brand-muted tracking-wider block">ID PARTENAIRE</span>
                    <span className="text-xs font-extrabold text-brand-dark block truncate leading-tight mt-0.5">{userProfile?.displayName || 'Partenaire Le Menu'}</span>
                    <span className="text-[10px] text-brand-muted block truncate font-mono mt-0.5">{userProfile?.email}</span>
                  </div>

                  <button
                    type="button"
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent rounded-xl text-xs font-bold transition-all text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Déconnexion</span>
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </header>
      
      <NotificationPermissionBanner />

      {/* Contenu Principal — flex-grow pousse le footer vers le bas */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>

      <Footer />
    </div>
  );
}