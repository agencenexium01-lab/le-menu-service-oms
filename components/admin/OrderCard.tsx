import React from 'react';
import { Link } from 'react-router-dom';
import { Order } from '../../types';
import StatusBadge from './StatusBadge';
import { Calendar, Layers, Maximize } from 'lucide-react';

interface OrderCardProps {
  order: Order;
}

import { SERVICE_LABELS, ServiceType } from '../../types';

export function getServiceTypeLabel(type: Order['serviceType']): string {
  if (SERVICE_LABELS[type]) {
    return SERVICE_LABELS[type];
  }
  switch (type as string) {
    case 'bache':
      return 'Bâche PVC Grand Format';
    case 'panneau':
      return 'Panneau Alu/Chantier';
    case 'menu':
      return 'Menu Personnalisé';
    case 'autocollant':
      return 'Autocollant / Vinyle';
    case 'enseigne':
      return 'Enseigne & Lettres découpées';
    case 'roll_up':
      return 'Roll-up d\'exposition';
    case 'flyer':
      return 'Flyer & Support Papier';
    default:
      return 'Autre Impression Numérique';
  }
}

const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const isNew = order.status === 'nouveau';

  // Format creation date safely from Firestore Timestamp
  const getFormattedDate = () => {
    if (!order.createdAt) return 'Date inconnue';
    const date = typeof order.createdAt.toDate === 'function' 
      ? order.createdAt.toDate() 
      : new Date(order.createdAt as any);
    
    return date.toLocaleDateString('fr-BJ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Link 
      id={`order-card-${order.id}`}
      to={`/admin/orders/${order.id}`} 
      className={`block rounded-2xl border transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl overflow-hidden ${
        isNew 
          ? 'bg-gradient-to-br from-red-950/20 to-slate-900 border-red-500/40 shadow-red-950/20 hover:border-red-400' 
          : 'bg-[#1e293b]/60 hover:bg-[#1e293b]/80 border-white/10 hover:border-white/20'
      }`}
    >
      {isNew && (
        <div className="bg-gradient-to-r from-red-600 to-amber-600 text-[10px] text-white font-extrabold uppercase px-3 py-1 flex items-center justify-between tracking-widest leading-none">
          <span>⚠️ NOUVELLE COMMANDE À CHIFFRER</span>
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
        </div>
      )}
      
      <div className="p-5 space-y-4">
        {/* Card Header information */}
        <div className="flex flex-wrap items-start justify-between gap-2.5">
          <div className="space-y-1">
            <span className="font-mono text-xs text-yellow-400 font-extrabold tracking-tight bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/10">
              #{order.orderNumber}
            </span>
            <h4 className="font-extrabold text-white text-base mt-2 leading-tight">
              {order.clientName}
            </h4>
            {(order as any).companyName && (
              <p className="text-xs text-slate-400 font-medium">{(order as any).companyName}</p>
            )}
            <p className="text-[11px] text-slate-500">{order.clientEmail}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {/* Technical specs of the print job */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-green-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider leading-none mb-1">Service</span>
              <span className="font-bold block truncate">{getServiceTypeLabel(order.serviceType)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Maximize className="w-4 h-4 text-indigo-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider leading-none mb-1">Format</span>
              <span className="font-bold block truncate text-slate-100">
                {order.dimensions?.width} x {order.dimensions?.height} {order.dimensions?.unit || 'm'}
              </span>
            </div>
          </div>
        </div>

        {/* Date and Quantity footnote */}
        <div className="flex items-center justify-between gap-4 pt-3 border-t border-white/5 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{getFormattedDate()}</span>
          </div>
          <div className="font-semibold px-2 py-0.5 rounded bg-white/5 border border-white/5 text-slate-300">
            Qté : {order.quantity || 1}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default OrderCard;
