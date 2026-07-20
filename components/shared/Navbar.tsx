import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Logo from './Logo';
import NotificationBell from './NotificationBell';
import PwaInstallModal from './PwaInstallModal'; // <--- IMPORT DU COMPOSANT PWA
import { useNotifications } from '../../hooks/useNotifications';
import { 
  Menu, 
  X, 
  Bell, 
  User as UserIcon, 
  LogOut, 
  ChevronDown,
  Clock, 
  CheckCircle, 
  AlertTriangle,
  FileText
} from 'lucide-react';

export default function Navbar() {
  const { user, userProfile, logout } = useAuth();
  // Fetch actual notifications for logged-in user
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(userProfile?.uid);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Close overlays on location/path shifts
  useEffect(() => {
    setMobileMenuOpen(false);
    setShowNotifications(false);
    setShowUserMenu(false);
  }, [location.pathname]);

  const scrollToServices = (e: React.MouseEvent) => {
    if (location.pathname === '/') {
      e.preventDefault();
      const servicesElement = document.getElementById('services');
      if (servicesElement) {
        servicesElement.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Allow standard transition to home page anchor
      navigate('/#services');
    }
    setMobileMenuOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'quote_received':
        return <FileText className="w-4 h-4 text-brand-pink" />;
      case 'status_updated':
        return <Clock className="w-4 h-4 text-brand-cyan" />;
      case 'file_issue':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      default:
        return <Bell className="w-4 h-4 text-brand-muted" />;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-brand-border shadow-sm" id="public-header-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left Side: Logo */}
        <div className="flex items-center">
          <Logo variant="navbar" />
        </div>

        {/* Center: Main Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-brand-dark">
          <Link 
            to="/" 
            className={`transition-colors hover:text-brand-pink ${location.pathname === '/' && !location.hash.includes('services') ? 'text-brand-pink' : 'text-brand-muted'}`}
          >
            Accueil
          </Link>
          <a 
            href="/#services" 
            onClick={scrollToServices}
            className={`transition-colors hover:text-brand-pink ${location.hash.includes('services') ? 'text-brand-pink' : 'text-brand-muted'}`}
          >
            Nos Services
          </a>
          
          {user && (
            <Link 
              to="/client/orders" 
              className={`transition-colors hover:text-brand-pink ${location.pathname.startsWith('/client') ? 'text-brand-pink' : 'text-brand-muted'}`}
            >
              Mes Commandes
            </Link>
          )}
        </nav>

        {/* Right Side: Actions (Desktop) */}
        <div className="hidden md:flex items-center gap-4">
          
          {/* BOUTON PWA & QR CODE (DEKTOP) */}
          <PwaInstallModal />

          {user ? (
            <>
              {/* Notification Overlay Toggle Button */}
              <NotificationBell />

              {/* User Dropdown Profile Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowNotifications(false);
                  }}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 bg-slate-50 border border-brand-border hover:bg-slate-100 rounded-xl transition-all cursor-pointer text-brand-dark"
                >
                  <div className="w-6 h-6 rounded-lg bg-brand-pink-light text-brand-pink flex items-center justify-center font-bold text-xs border border-brand-pink-light">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold truncate max-w-[120px]">
                    {userProfile?.displayName?.split(' ')[0] || 'Client'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-brand-muted" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2.5 w-56 bg-white border border-brand-border rounded-2xl shadow-2xl p-2 z-50 animate-fade-in space-y-1">
                    <div className="px-3 py-2 border-b border-brand-border text-left mb-1.5">
                      <span className="text-[9px] uppercase font-black text-brand-muted tracking-wider block">ESPACE</span>
                      <span className="text-xs font-extrabold text-brand-dark block truncate leading-tight mt-0.5">{userProfile?.displayName || 'Partenaire'}</span>
                      <span className="text-[10px] text-brand-muted block truncate font-mono mt-0.5">{userProfile?.email}</span>
                      <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-bold rounded uppercase bg-brand-pink/15 text-brand-pink border border-brand-pink/20">
                        {userProfile?.role === 'admin' ? 'Administrateur' : 'Client OMS'}
                      </span>
                    </div>

                    <Link
                      to={userProfile?.role === 'admin' ? '/admin' : '/client'}
                      className="flex items-center gap-2 px-3 py-2 text-brand-muted hover:text-brand-pink hover:bg-brand-pink-light/20 rounded-xl text-xs font-bold transition-all text-left"
                    >
                      <UserIcon className="w-3.5 h-3.5" />
                      <span>Console Dashboard</span>
                    </Link>

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
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link 
                to="/login" 
                className="px-4 py-2 border border-brand-border rounded-xl text-xs font-bold text-brand-muted hover:text-brand-pink hover:bg-slate-50 transition-all"
              >
                Connexion
              </Link>
              <Link 
                to="/register" 
                className="btn-primary px-4 py-2 text-xs font-bold shadow-pink rounded-xl"
              >
                Créer un compte
              </Link>
            </div>
          )}
        </div>

        {/* Mobile: Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          {user && (
            <div className="relative mr-1">
              <Link
                to="/client/orders"
                className="p-2 bg-slate-50 border border-brand-border rounded-xl text-brand-muted hover:text-brand-pink transition-all relative block"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 flex items-center justify-center text-[8px] font-black bg-brand-pink text-white rounded-full animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </Link>
            </div>
          )}
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 bg-slate-50 border border-brand-border text-brand-dark hover:text-brand-pink rounded-xl transition-colors cursor-pointer"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-brand-border animate-fade-in h-[calc(100vh-4rem)] overflow-y-auto" id="mobile-drawer-menu">
          <div className="px-4 pt-4 pb-6 space-y-4">
            
            {/* BOUTON PWA & QR CODE (MOBILE) */}
            <div className="flex justify-center pb-2 border-b border-brand-border">
              <PwaInstallModal />
            </div>

            {/* User Profile Info Card on Mobile */}
            {user && (
              <div className="bg-slate-50 p-4 border border-brand-border rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-brand-muted uppercase font-bold block">ID Connecté</span>
                  <p className="text-sm font-bold text-brand-dark truncate max-w-[180px]">{userProfile?.displayName || user.email}</p>
                </div>
                <div className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-brand-pink-light/40 text-brand-pink border border-brand-pink-light">
                  {userProfile?.role === 'admin' ? 'Admin' : 'Client'}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              <Link 
                to="/" 
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-xl text-sm font-bold transition-all ${location.pathname === '/' && !location.hash.includes('services') ? 'bg-brand-pink-light/35 text-brand-pink border border-brand-pink-light/20 shadow-sm' : 'text-brand-muted hover:bg-slate-50'}`}
              >
                Accueil
              </Link>
              <a 
                href="/#services" 
                onClick={scrollToServices}
                className={`px-4 py-3 rounded-xl text-sm font-bold transition-all block ${location.hash.includes('services') ? 'bg-brand-pink-light/35 text-brand-pink border border-brand-pink-light/20 shadow-sm' : 'text-brand-muted hover:bg-slate-50'}`}
              >
                Nos Services
              </a>
              
              {user && (
                <>
                  <Link 
                    to="/client/orders" 
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-xl text-sm font-bold transition-all ${location.pathname.startsWith('/client/orders') && !location.pathname.endsWith('/new') ? 'bg-brand-pink-light/35 text-brand-pink border border-brand-pink-light/20 shadow-sm' : 'text-brand-muted hover:bg-slate-50'}`}
                  >
                    Mes Commandes
                  </Link>
                  <Link 
                    to="/client/orders/new" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-primary text-center py-3 text-sm font-bold shadow-pink rounded-xl block"
                  >
                    + Nouvelle Commande
                  </Link>
                  
                  <Link 
                    to={userProfile?.role === 'admin' ? '/admin' : '/client'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-xl text-sm font-bold transition-all text-brand-dark bg-brand-cyan-light border border-brand-cyan-light/20 hover:bg-brand-cyan-light/40 text-center block"
                  >
                    Aller au Tableau de Bord
                  </Link>
                </>
              )}
            </div>

            {/* CTA action buttons for guest (Mobile) */}
            {!user && (
              <div className="pt-4 border-t border-brand-border space-y-2">
                <Link 
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center block px-4 py-3 border border-brand-border rounded-xl text-sm font-bold text-brand-muted hover:text-brand-pink hover:bg-slate-50 transition-colors"
                >
                  Connexion
                </Link>
                <Link 
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center block btn-primary px-4 py-3 text-sm font-bold shadow-pink rounded-xl"
                >
                  Créer un compte
                </Link>
              </div>
            )}

            {/* Logout button (Mobile) */}
            {user && (
              <div className="pt-4 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-xl text-sm font-bold text-rose-600 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Déconnexion</span>
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </header>
  );
}