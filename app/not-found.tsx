import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, HelpCircle } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] text-center px-4" id="custom-404-view">
      <div className="max-w-md w-full space-y-6">
        
        {/* Animated branded illustration block */}
        <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
          <div className="absolute inset-0 bg-pink-500/10 rounded-full blur-2xl animate-pulse" />
          <div className="relative bg-[#111A36] border-2 border-[#E91E8C] rounded-3xl p-6 shadow-2xl animate-bounce duration-1000">
            <img 
              src="/logo.png" 
              className="h-16 w-16 object-contain" 
              alt="Le Menu Service" 
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Return a nice fallback vector shape if img fails to load inside the sandbox
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextSibling) {
                  (e.currentTarget.nextSibling as HTMLElement).style.display = 'block';
                }
              }}
            />
            <div className="hidden text-3xl font-black text-[#E91E8C] font-display">LMS</div>
          </div>
          
          {/* Question badge overlay */}
          <div className="absolute -bottom-1 -right-1 bg-[#E91E8C] text-white p-2 rounded-full border border-slate-900 shadow">
            <HelpCircle className="w-4 h-4" />
          </div>
        </div>

        {/* Informative typography texts */}
        <div className="space-y-3">
          <h1 className="text-4xl font-black text-white tracking-tight">Erreur 404</h1>
          <h2 className="text-lg font-black text-[#E91E8C] tracking-wide">
            Oups ! La maquette est introuvable.
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm px-6 leading-relaxed font-semibold">
            Il semble que le dossier ou la page d'impression que vous cherchez n'existe plus ou a été déplacé par l'Atelier.
          </p>
        </div>

        {/* Navigation Action Buttons links */}
        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link
            to="/"
            className="w-full sm:w-auto px-6 py-3 bg-[#E91E8C] hover:bg-[#C4166F] text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 duration-100 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Retourner à l'accueil</span>
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto px-6 py-3 bg-[#111A36]/60 hover:bg-[#111A36] border border-white/5 hover:border-white/10 text-slate-300 hover:text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 duration-100"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Page précédente</span>
          </button>
        </div>

      </div>
    </div>
  );
}
