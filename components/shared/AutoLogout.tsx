import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LogOut } from 'lucide-react';

export function AutoLogout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    // If user is not authenticated, check if we just logged out for inactivity
    if (!user) {
      if (localStorage.getItem('inactivity_logout_alert') === 'true') {
        setShowToast(true);
        localStorage.removeItem('inactivity_logout_alert');
        const timer = setTimeout(() => {
          setShowToast(false);
        }, 5000);
        return () => clearTimeout(timer);
      }
      return;
    }

    const path = location.pathname;
    let timeoutDelay = 0;

    if (path.startsWith('/pro') || path.startsWith('/admin')) {
      timeoutDelay = 60 * 60 * 1000; // 60 minutes
    } else if (path.startsWith('/client')) {
      timeoutDelay = 120 * 60 * 1000; // 120 minutes
    }

    if (timeoutDelay === 0) return;

    let inactivityTimer: NodeJS.Timeout;

    const performLogout = async () => {
      try {
        await logout();
        localStorage.setItem('inactivity_logout_alert', 'true');
        
        // Redirect based on current section
        if (path.startsWith('/pro') || path.startsWith('/admin')) {
          navigate('/pro/connexion');
        } else {
          navigate('/connexion');
        }
      } catch (err) {
        console.error("Auto logout error:", err);
      }
    };

    const resetTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(performLogout, timeoutDelay);
    };

    // User activity events listeners
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    activityEvents.forEach(evt => {
      window.addEventListener(evt, resetTimer);
    });

    // Start initial timer
    resetTimer();

    return () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      activityEvents.forEach(evt => {
        window.removeEventListener(evt, resetTimer);
      });
    };
  }, [user, location.pathname, logout, navigate]);

  if (!showToast) return null;

  return (
    <div 
      className="fixed bottom-6 right-6 z-[9999] max-w-sm w-full px-4 animate-fade-in"
      id="inactivity-logout-toast"
    >
      <div className="flex items-center gap-3 px-4 py-3 bg-[#111A36] border border-[#2B3553] text-rose-400 rounded-2xl shadow-2xl">
        <div className="p-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg shrink-0">
          <LogOut className="w-4 h-4 text-rose-400" />
        </div>
        <div>
          <h4 className="text-xs font-black text-white leading-snug">Session expirée</h4>
          <p className="text-[10px] text-slate-400 leading-normal font-medium">Déconnecté automatiquement pour inactivité.</p>
        </div>
      </div>
    </div>
  );
}
