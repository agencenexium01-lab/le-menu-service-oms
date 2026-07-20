import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Clock, 
  FileText, 
  AlertTriangle, 
  Check, 
  Volume2, 
  VolumeX, 
  ShoppingBag,
  Inbox,
  X
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { isSoundEnabled, toggleSound, requestNotificationPermission } from '@/lib/notifications';

/**
 * Format timestamp to a reader-friendly French time description
 */
export function formatTimeAgo(timestamp: any): string {
  if (!timestamp) return "";
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffMs = new Date().getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 10) return "À l'instant";
    if (diffSec < 60) return `Il y a ${diffSec} s`;
    
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `Il y a ${diffHrs} h`;
    
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  } catch (err) {
    return "";
  }
}

/**
 * Clean NotificationBell Component
 */
export default function NotificationBell() {
  const { userProfile } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(userProfile?.uid);
  const [showDropdown, setShowDropdown] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setSoundOn(isSoundEnabled());
  }, []);

  const handleToggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = toggleSound();
    setSoundOn(updated);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_order':
        return <ShoppingBag className="w-4 h-4 text-emerald-500" />;
      case 'quote_received':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'quote_responded':
        return <Inbox className="w-4 h-4 text-yellow-400" />;
      case 'status_updated':
        return <Clock className="w-4 h-4 text-cyan-400" />;
      case 'file_issue':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  // Safe navigation according to user context
  const getNotificationRedirect = (notif: any) => {
    if (!userProfile) return "/";
    const role = userProfile.role;
    
    if (role === 'client') {
      return notif.orderId ? `/client/orders/${notif.orderId}` : '/client';
    } else if (role === 'chef_point' && userProfile.branchId) {
      return notif.orderId ? `/pro/point/${userProfile.branchId}/commandes/${notif.orderId}` : `/pro/point/${userProfile.branchId}/commandes`;
    } else {
      // Admins/Super Admins
      return "/pro/proprietaire/commandes";
    }
  };

  const getSeeAllLink = () => {
    if (!userProfile) return "/";
    if (userProfile.role === 'client') return "/client";
    if (userProfile.role === 'chef_point' && userProfile.branchId) return `/pro/point/${userProfile.branchId}/commandes`;
    return "/pro/proprietaire/commandes";
  };

  return (
    <div className="relative inline-block text-left" id="notification-bell-container">
      {/* Bell Trigger */}
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        className={`p-2.5 rounded-xl border transition-all relative cursor-pointer ${
          showDropdown 
            ? 'bg-amber-500/10 text-yellow-400 border-yellow-500/40' 
            : 'bg-slate-900/50 hover:bg-slate-900 text-slate-300 hover:text-white border-white/5 hover:border-white/10'
        }`}
        aria-label="Notifications"
      >
        <Bell className="w-4.5 h-4.5" />
        {unreadCount > 0 && (
          <>
            {/* Pulsing red effect badge */}
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 animate-ping"></span>
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 border border-slate-950"></span>
          </>
        )}
      </button>

      {/* dropdown panels */}
      {showDropdown && (
        <>
          {/* click overlay shield to dismiss */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)}
          ></div>

          <div className="absolute right-0 mt-3 w-80 md:w-96 bg-[#16203a] border border-white/10 rounded-2xl shadow-2xl p-4.5 space-y-3.5 z-50 animate-fade-in text-white">
            
            {/* Header section with toggleSound */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <span className="font-extrabold text-xs tracking-wider text-slate-300 uppercase">Avis & Notifications ({unreadCount})</span>
              
              <div className="flex items-center gap-3">
                {/* Toggle Sound */}
                <button
                  type="button"
                  onClick={handleToggleSound}
                  className="flex items-center gap-1.5 text-[10px] font-extrabold px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer border border-white/5"
                  title={soundOn ? "Désactiver le son" : "Activer le son"}
                >
                  {soundOn ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      <span className="hidden sm:inline">Son Activé</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-slate-450" />
                      <span className="hidden sm:inline">Son Sourd</span>
                    </>
                  )}
                </button>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      await markAllAsRead();
                    }}
                    className="text-[10px] text-yellow-400 hover:text-yellow-350 font-black cursor-pointer flex items-center gap-0.5 transition-colors"
                  >
                    <Check className="w-3 h-3" />
                    <span>Tout lire</span>
                  </button>
                )}
              </div>
            </div>

            {/* List entries */}
            <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-medium">
                  Aucune notification disponible.
                </div>
              ) : (
                notifications.slice(0, 5).map((notif) => {
                  const path = getNotificationRedirect(notif);
                  return (
                    <div
                      key={notif.id}
                      className={`block p-3 rounded-xl transition-all border text-left ${
                        notif.read 
                          ? 'bg-slate-900/30 border-white/5 text-slate-300 opacity-65 hover:opacity-100' 
                          : 'bg-white/5 hover:bg-white/8 border-white/10 text-white shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded-lg bg-white/5 shrink-0 mt-0.5">
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div className="flex-grow space-y-1 min-w-0">
                          <div className="flex justify-between items-baseline gap-2">
                            <span className="font-extrabold text-xs block truncate pr-1">
                              {notif.title}
                            </span>
                            <span className="text-[9px] font-mono text-slate-400 shrink-0 block">
                              {formatTimeAgo(notif.createdAt)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed font-medium break-words">
                            {notif.message}
                          </p>
                          <div className="pt-1 flex justify-end gap-2.5">
                            {!notif.read && (
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  if (notif.id) await markAsRead(notif.id);
                                }}
                                className="text-[10px] font-bold text-yellow-500 hover:text-yellow-400 cursor-pointer flex items-center gap-0.5"
                              >
                                <Check className="w-3 h-3" />
                                <span>Marquer lu</span>
                              </button>
                            )}
                            <Link
                              to={path}
                              onClick={() => setShowDropdown(false)}
                              className="text-[10px] font-black text-blue-400 hover:text-blue-350"
                            >
                              Consulter
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* See All link */}
            {notifications.length > 5 && (
              <div className="text-center border-t border-white/5 pt-2">
                <Link
                  to={getSeeAllLink()}
                  onClick={() => setShowDropdown(false)}
                  className="text-[10px] text-blue-400 hover:text-blue-350 font-black tracking-wider uppercase transition-colors"
                >
                  Voir toutes les notifications
                </Link>
              </div>
            )}

          </div>
        </>
      )}
    </div>
  );
}

/**
 * Clean & Beautiful Floating Banner asking for permission if not granted
 */
export function NotificationPermissionBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    
    const isDismissed = localStorage.getItem('lms_push_dismissed') === 'true';
    const isGrantedOrDenied = Notification.permission !== 'default';
    
    if (!isGrantedOrDenied && !isDismissed) {
      // Delay slightly for presentation
      const timer = setTimeout(() => setVisible(true), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleRequest = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('lms_push_dismissed', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div 
      className="w-full bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-yellow-500/5 border-b border-yellow-500/20 text-yellow-300 py-3.5 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 text-xs font-bold animate-fade-in"
      id="notifications-permission-panel"
    >
      <div className="flex items-center gap-2.5">
        <span className="text-base animate-bounce">🔔</span>
        <p className="leading-relaxed">
          Activez les notifications de bureau de <span className="text-white font-black">Le Menu Service</span> pour être prévenu instantanément des devis et statuts d'ateliers !
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleRequest}
          className="px-3.5 py-1.5 bg-yellow-500 hover:bg-yellow-450 text-slate-950 font-black rounded-lg transition-all cursor-pointer uppercase text-[10px] tracking-wider shadow-sm"
        >
          Activer
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1.5 rounded-lg text-slate-400 hover:text-yellow-300 hover:bg-white/5 transition-all cursor-pointer"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
