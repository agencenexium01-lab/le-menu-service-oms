import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, X } from 'lucide-react';

export function OnlineIndicator() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [showStatus, setShowStatus] = useState<boolean>(false);
  const [temporaryOnline, setTemporaryOnline] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setTemporaryOnline(true);
        setShowStatus(true);
        // Hide "Connexion rétablie" banner after 3 seconds
        const timer = setTimeout(() => {
          setShowStatus(false);
          setTemporaryOnline(false);
          setWasOffline(false);
        }, 3000);
        return () => clearTimeout(timer);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setTemporaryOnline(false);
      setShowStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check: if starts as offline, show immediate offline banner
    if (!navigator.onLine) {
      setWasOffline(true);
      setShowStatus(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  if (!showStatus && isOnline) return null;

  return (
    <div 
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] max-w-sm w-full px-4 animate-bounce duration-1000"
      id="global-online-offline-indicator"
    >
      {!isOnline ? (
        // Offline state banner
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-rose-500 hover:bg-rose-600 border border-rose-400/20 text-white rounded-2xl shadow-xl shadow-rose-950/20 backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <WifiOff className="w-4 h-4 shrink-0 animate-pulse text-white" />
            <span className="text-[11px] font-black uppercase tracking-wider">
              Connexion perdue — Mode hors-ligne
            </span>
          </div>
        </div>
      ) : temporaryOnline ? (
        // Temporary Restored online success notice
        <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-600 border border-emerald-500/20 text-white rounded-2xl shadow-xl shadow-emerald-950/20 backdrop-blur-md">
          <Wifi className="w-4 h-4 shrink-0 animate-bounce text-emerald-300" />
          <span className="text-[11px] font-black uppercase tracking-wider">
            Connexion rétablie — En ligne
          </span>
        </div>
      ) : null}
    </div>
  );
}
