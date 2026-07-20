import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  variant: 'sidebar' | 'navbar' | 'full';
  className?: string;
}

export default function Logo({ variant, className = '' }: LogoProps) {
  const logoSrc = "/logo.png";

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Elegant fallback using CMYK dots simulation if image fails to load
    e.currentTarget.style.display = 'none';
  };

  if (variant === 'navbar') {
    return (
      <Link to="/" className={`flex items-center gap-3 ${className}`} id="logo-navbar">
        <div className="relative flex items-center justify-center shrink-0">
          <img 
            src={logoSrc} 
            alt="Le Menu Service" 
            className="h-10 w-auto object-contain rounded-full shadow-sm bg-brand-pink-light/20"
            onError={handleImageError}
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-brand-dark text-[15px] sm:text-base leading-tight tracking-tight">
            Le Menu <span className="text-brand-pink">Service</span>
          </span>
          <span className="text-[10px] text-brand-muted font-medium leading-none">
            Impression Numérique
          </span>
        </div>
      </Link>
    );
  }

  if (variant === 'sidebar') {
    return (
      <Link to="/" className={`flex items-center gap-2.5 ${className}`} id="logo-sidebar">
        <div className="relative flex items-center justify-center shrink-0">
          <img 
            src={logoSrc} 
            alt="Le Menu Service" 
            className="h-9 w-auto object-contain rounded-full bg-white/10"
            onError={handleImageError}
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex flex-col">
          <span className="font-black text-white text-sm sm:text-base leading-tight tracking-tight">
            Le Menu <span className="text-brand-pink">Service</span>
          </span>
          <span className="text-[9px] text-brand-navy-pale/70 font-extrabold uppercase tracking-widest block leading-none">
            Atelier OMS
          </span>
        </div>
      </Link>
    );
  }

  // variant === 'full'
  return (
    <div className={`flex flex-col items-center text-center gap-4 ${className}`} id="logo-full">
      <div className="relative p-2 bg-white rounded-full shadow-lg border border-brand-pink-light/30 transition-transform hover:scale-105 duration-300">
        <img 
          src={logoSrc} 
          alt="Le Menu Service" 
          className="h-20 w-auto object-contain rounded-full"
          onError={handleImageError}
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
          Le Menu <span className="text-brand-pink">Service</span>
        </h1>
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-brand-muted">
          Entreprise d'Impression Numérique
        </p>
        <p className="text-sm italic font-medium text-brand-muted/90 max-w-md mx-auto leading-relaxed mt-2 px-4">
          &ldquo;Nous misons sur la qualité de vos impressions numériques&rdquo;
        </p>
      </div>
    </div>
  );
}
