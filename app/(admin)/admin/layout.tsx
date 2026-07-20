import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useOrders } from '../../../hooks/useOrders';
import Logo from '../../../components/shared/Logo';
import Footer from '../../../components/shared/Footer';
import { History, Users, LayoutDashboard, LogOut } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { logout, userProfile } = useAuth();
  const { orders } = useOrders();
  const location = useLocation();

  const newOrdersCount = orders.filter(order => order.status === 'nouveau').length;

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Commandes', path: '/admin/orders', icon: History, badge: newOrdersCount > 0 ? newOrdersCount : undefined },
    { label: 'Clients Partenaires', path: '/admin/clients', icon: Users }
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-brand-bg">
      
      {/* Sidebar Admin */}
      <aside className="w-full lg:w-72 bg-brand-navy border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col shrink-0 text-white">
        <div className="p-6 border-b border-white/10 flex flex-col justify-center gap-1">
          <Logo variant="sidebar" />
          <span className="text-[10px] font-bold text-white/50 pl-11 uppercase tracking-wider block">Console Admin</span>
        </div>

        <nav className="flex-grow p-4 space-y-2">
          <div className="text-[10px] font-black tracking-widest text-white/50 uppercase px-3 mb-2 block">
            Navigation Atelier
          </div>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold transition-all duration-150 ${
                  isActive 
                    ? 'bg-brand-pink text-white shadow-lg' 
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 text-[10px] font-black bg-brand-yellow text-brand-dark rounded-full shadow-sm animate-bounce">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Métadonnées */}
        <div className="p-4 mx-4 mb-4 bg-white/5 border border-white/5 rounded-2xl space-y-1 text-[11px]">
          <div className="flex justify-between text-white/70">
            <span>Rôle :</span>
            <span className="text-brand-yellow font-bold">Administrateur</span>
          </div>
          <div className="flex justify-between text-white/70">
            <span>Zone :</span>
            <span className="text-white/90">Cotonou, Bénin</span>
          </div>
        </div>

        {/* Déconnexion */}
        <div className="p-4 border-t border-white/10 bg-black/10">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-3 text-red-300 hover:text-red-100 hover:bg-red-500/10 rounded-xl text-sm font-bold transition-all duration-150"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Zone principale */}
      <main className="flex-grow p-6 lg:p-8 min-w-0 flex flex-col justify-between min-h-screen" id="admin-main-section">
        <div className="w-full flex-grow">
          {children}
        </div>

        {/* Footer Admin */}
        <div className="w-full mt-16 pt-6 border-t border-brand-border">
          <Footer />
        </div>
      </main>

    </div>
  );
}