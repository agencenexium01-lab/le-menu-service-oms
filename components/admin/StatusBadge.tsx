import React from 'react';

export type OrderStatus = 
  | 'nouveau' 
  | 'en_verification' 
  | 'devis_envoye' 
  | 'devis_accepte' 
  | 'en_production' 
  | 'pret' 
  | 'livre' 
  | 'annule';

interface StatusBadgeProps {
  status: OrderStatus;
}

export function getStatusLabel(status: OrderStatus): string {
  switch (status) {
    case 'nouveau':
      return 'Nouveau';
    case 'en_verification':
      return 'En vérification';
    case 'devis_envoye':
      return 'Devis envoyé';
    case 'devis_accepte':
      return 'Devis accepté';
    case 'en_production':
      return 'En production';
    case 'pret':
      return 'Prêt à livrer';
    case 'livre':
      return 'Livré';
    case 'annule':
      return 'Annulé';
    default:
      return status;
  }
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  let badgeClasses = '';

  switch (status) {
    case 'nouveau':
      badgeClasses = 'bg-red-100 text-red-800 border-red-200';
      break;
    case 'en_verification':
      badgeClasses = 'bg-orange-100 text-orange-800 border-orange-200';
      break;
    case 'devis_envoye':
      badgeClasses = 'bg-yellow-100 text-yellow-800 border-yellow-200';
      break;
    case 'devis_accepte':
      badgeClasses = 'bg-blue-100 text-blue-800 border-blue-200';
      break;
    case 'en_production':
      badgeClasses = 'bg-indigo-100 text-indigo-800 border-indigo-200';
      break;
    case 'pret':
      badgeClasses = 'bg-emerald-100 text-emerald-800 border-emerald-200';
      break;
    case 'livre':
      badgeClasses = 'bg-green-100 text-green-800 border-green-200';
      break;
    case 'annule':
      badgeClasses = 'bg-gray-100 text-gray-500 border-gray-200';
      break;
    default:
      badgeClasses = 'bg-slate-100 text-slate-800 border-slate-200';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full border shadow-sm ${badgeClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse"></span>
      {getStatusLabel(status)}
    </span>
  );
}
