import React from 'react';
import { Check, Clock, AlertTriangle, FileText, Settings, Play, CheckCircle2, ShoppingBag } from 'lucide-react';
import { Order } from '../../types';

interface OrderTimelineProps {
  status: Order['status'];
}

export default function OrderTimeline({ status }: OrderTimelineProps) {
  // 6 milestones listed in instructions: Reçue → Vérification → Devis → Production → Prête → Livrée
  const steps = [
    { 
      key: 'received', 
      label: 'Reçue', 
      desc: 'Dossier créé',
      icon: ShoppingBag,
      matches: ['nouveau']
    },
    { 
      key: 'verification', 
      label: 'Vérification', 
      desc: 'Validation technique',
      icon: Settings,
      matches: ['en_verification']
    },
    { 
      key: 'quote', 
      label: 'Devis', 
      desc: 'Tarification',
      icon: FileText,
      matches: ['devis_envoye', 'devis_accepte']
    },
    { 
      key: 'production', 
      label: 'Production', 
      desc: 'Mise sous presse',
      icon: Play,
      matches: ['en_production']
    },
    { 
      key: 'ready', 
      label: 'Prête', 
      desc: 'Prête à l\'Atelier',
      icon: CheckCircle2,
      matches: ['pret']
    },
    { 
      key: 'delivered', 
      label: 'Livrée', 
      desc: 'Récupérée / Livrée',
      icon: CheckCircle2,
      matches: ['livre']
    }
  ];

  // If status is 'annule'
  const isCancelled = status === 'annule';

  // Determine active step index
  const getActiveStepIndex = () => {
    if (isCancelled) return -1;
    
    switch (status) {
      case 'nouveau':
        return 0;
      case 'en_verification':
        return 1;
      case 'devis_envoye':
      case 'devis_accepte':
        return 2;
      case 'en_production':
        return 3;
      case 'pret':
        return 4;
      case 'livre':
        return 5;
      default:
        return 0;
    }
  };

  const activeIndex = getActiveStepIndex();

  return (
    <div className="backdrop-blur-xl bg-slate-900/60 border border-white/5 rounded-3xl p-6 sm:p-8 space-y-6" id="order-status-timeline">
      
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <span className="text-[10px] text-green-400 font-extrabold tracking-widest uppercase block">SUIVI ÉTAPE PAR ÉTAPE</span>
        <span className="text-xs font-semibold text-slate-400">
          Statut actuel : <span className="text-white font-extrabold uppercase">
            {status === 'nouveau' && 'Dossier Reçu'}
            {status === 'en_verification' && 'Vérification Technique'}
            {status === 'devis_envoye' && 'Devis Envoyé (Attente Réponse)'}
            {status === 'devis_accepte' && 'Devis Accepté'}
            {status === 'en_production' && 'En cours d\'Impression'}
            {status === 'pret' && 'Prête à l\'Atelier'}
            {status === 'livre' && 'Commande Retirée / Livrée'}
            {status === 'annule' && 'Annulée'}
          </span>
        </span>
      </div>

      {isCancelled ? (
        <div className="py-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3.5 px-5">
          <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse shrink-0" />
          <div className="min-w-0">
            <h4 className="text-xs font-black text-rose-400">Cette commande a été annulée.</h4>
            <p className="text-[10px] text-slate-400 leading-normal mt-0.5">Le dossier n'est plus actif. Contactez notre support client si vous estimez qu'il s'agit d'une anomalie.</p>
          </div>
        </div>
      ) : (
        <div className="relative pt-2">
          
          {/* Timeline Bar Background Desktop only */}
          <div className="absolute top-[26px] left-[4%] right-[4%] h-0.5 bg-white/5 hidden md:block" />
          
          {/* Active Status line filler */}
          {activeIndex > 0 && (
            <div 
              className="absolute top-[26px] left-[5%] h-0.5 bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500 hidden md:block"
              style={{ width: `${(activeIndex / (steps.length - 1)) * 90}%` }}
            />
          )}

          {/* Stepper items container */}
          <div className="grid grid-cols-2 gap-y-6 md:flex md:items-start md:justify-between relative z-10">
            {steps.map((step, idx) => {
              const isCompleted = idx < activeIndex;
              const isActive = idx === activeIndex;
              const isUpcoming = idx > activeIndex;
              const StepIcon = step.icon;

              let circleStyle = 'bg-slate-950 border-white/10 text-slate-500';
              let labelStyle = 'text-slate-500';

              if (isCompleted) {
                circleStyle = 'bg-green-500/10 border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.15)]';
                labelStyle = 'text-slate-300 font-bold';
              } else if (isActive) {
                circleStyle = 'bg-green-600 border-green-400 text-white shadow-[0_0_15px_rgba(22,163,74,0.4)] ring-4 ring-green-600/35 scale-110 animate-pulse';
                labelStyle = 'text-white font-extrabold';
              }

              return (
                <div key={step.key} className="flex flex-col items-center text-center px-1 md:flex-1">
                  
                  {/* Step visual circle */}
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 mb-2 shrink-0 ${circleStyle}`}>
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <StepIcon className="w-4 h-4" />
                    )}
                  </div>

                  {/* Step information tags */}
                  <div className="space-y-0.5">
                    <span className={`text-[11px] truncate block ${labelStyle}`}>{step.label}</span>
                    <span className="text-[9px] text-slate-500 block leading-tight px-1 font-medium">{step.desc}</span>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
}
