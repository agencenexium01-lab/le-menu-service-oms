import React from 'react';
import { Settings, RefreshCw, AlertTriangle } from 'lucide-react';

export function MaintenanceScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#070b19] px-4 text-center select-none" id="maintenance-overlay-page">
      <div className="max-w-md w-full space-y-8 p-10 bg-[#0c1226]/80 border border-white/5 rounded-3xl relative overflow-hidden shadow-2xl">
        {/* Shimmer glowing backgrounds */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-amber-500 to-indigo-500 animate-pulse" />
        <div className="absolute inset-0 bg-pink-500/5 rounded-3xl blur-2xl pointer-events-none" />

        {/* Header Visual with double spinning gear illustration */}
        <div className="flex justify-center items-center gap-4 relative">
          <Settings className="w-10 h-10 text-pink-500 animate-spin duration-3000" />
          <div className="relative bg-[#101b33] border-2 border-[#E91E8C] rounded-2xl p-4 shadow-xl">
            <img 
              src="/logo.png" 
              className="h-10 w-10 object-contain" 
              alt="Le Menu Service" 
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextSibling) {
                  (e.currentTarget.nextSibling as HTMLElement).style.display = 'block';
                }
              }}
            />
            <div className="hidden font-black text-[#E91E8C] text-lg">LMS</div>
          </div>
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin duration-5000" />
        </div>

        {/* Message and status updates */}
        <div className="space-y-3 relative z-10">
          <span className="text-[9.5px] font-black uppercase tracking-widest text-[#E91E8C] bg-pink-500/10 border border-pink-500/20 px-3.5 py-1 rounded-full inline-block">
            MAINTENANCE EN COURS 🚧
          </span>
          
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
            Atelier numérique en cours de mise en conformité technique
          </h2>
          
          <p className="text-slate-400 text-xs leading-relaxed font-semibold">
            Notre plateforme OMS de gestion d'impression grand format subit des réajustements structurels programmés afin de vous garantir une fluidité de tarification accrue.
          </p>
        </div>

        {/* Estimation label info card */}
        <div className="bg-[#111A36] border border-white/5 p-4 rounded-2xl flex items-center gap-3 text-left">
          <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white">Date de retour estimée</h4>
            <p className="text-[10px] text-slate-400 leading-normal font-semibold">
              Mise à jour planifiée en cours — Retour en ligne sous peu.
            </p>
          </div>
        </div>

        {/* Standard reassurance indicator */}
        <div className="pt-2">
          <p className="text-[9px] text-slate-650 font-mono tracking-wider uppercase font-bold">
            Le Menu Service — OMS Atelier d'Édition
          </p>
        </div>

      </div>
    </div>
  );
}
