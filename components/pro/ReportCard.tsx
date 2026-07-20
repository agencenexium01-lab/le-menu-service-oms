import React from 'react';

interface ReportCardProps {
  title: string;
  value: string | number;
  subValue?: string | number;
  subText?: string;
  icon: React.ReactNode;
  bgClass?: string;
  borderClass?: string;
  iconBgClass?: string;
  id?: string;
}

export default function ReportCard({
  title,
  value,
  subValue,
  subText,
  icon,
  bgClass = 'bg-[#111A36]/60',
  borderClass = 'border-[#2B3553]/40',
  iconBgClass = 'bg-blue-500/10 text-blue-400',
  id
}: ReportCardProps) {
  return (
    <div 
      id={id}
      className={`backdrop-blur-xl border rounded-3xl p-6 shadow-xl transition-all hover:scale-[1.01] hover:border-white/20 flex flex-col justify-between h-full ${bgClass} ${borderClass}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            {title}
          </span>
          <div className="text-2xl font-black text-white tracking-tight">
            {value}
          </div>
        </div>
        <div className={`p-3 rounded-2xl border border-white/5 flex items-center justify-center ${iconBgClass}`}>
          {icon}
        </div>
      </div>

      {(subValue !== undefined || subText) && (
        <div className="mt-4 pt-3 border-t border-white/5 flex items-baseline gap-1.5 text-xs">
          {subValue !== undefined && (
            <span className="font-extrabold text-slate-200">
              {subValue}
            </span>
          )}
          {subText && (
            <span className="text-slate-450 font-medium">
              {subText}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
