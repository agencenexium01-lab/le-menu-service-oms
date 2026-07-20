import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { Phone, MapPin, Mail, ArrowRight, ShieldAlert } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#111827] text-gray-300 py-12 border-t border-gray-800" id="global-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Column 1: Brand & Slogan */}
        <div className="space-y-4">
          <div className="flex items-start">
            <Logo variant="sidebar" className="!p-0" />
          </div>
          <p className="text-xs italic leading-relaxed text-gray-400 max-w-sm">
            &ldquo;We bet on the quality of your digital prints &rdquo; — &ldquo;Nous misons sur la qualité de vos impressions numériques&rdquo;
          </p>
          <div className="text-[11px] text-gray-500 font-mono pt-2">
            &copy; {new Date().getFullYear() === 2024 ? '2024' : '2026'} Le Menu Service. Tous droits réservés.
          </div>
        </div>

        {/* Column 2: Quick Links & Legal Documents */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Liens Rapides</h3>
          <ul className="text-xs space-y-2.5">
            <li>
              <Link to="/" className="hover:text-brand-pink transition-colors flex items-center gap-1.5 focus:text-brand-pink">
                <ArrowRight className="w-3 h-3 text-brand-pink" />
                Accueil
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-brand-pink transition-colors flex items-center gap-1.5 focus:text-brand-pink">
                <ArrowRight className="w-3 h-3 text-brand-pink" />
                Connexion Partenaire
              </Link>
            </li>
            <li>
              <Link to="/client/orders/new" className="hover:text-brand-pink transition-colors flex items-center gap-1.5 focus:text-brand-pink">
                <ArrowRight className="w-3 h-3 text-brand-pink" />
                Commander en ligne
              </Link>
            </li>
            <li>
              <Link to="/register" className="hover:text-brand-pink transition-colors flex items-center gap-1.5 focus:text-brand-pink">
                <ArrowRight className="w-3 h-3 text-brand-pink" />
                Créer un compte client
              </Link>
            </li>
          </ul>

          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider pt-3 border-t border-gray-800/60">Documents Légaux</h3>
          <ul className="text-[11px] space-y-2 text-gray-400">
            <li>
              <Link to="/mentions-legales" className="hover:text-brand-pink transition-colors flex items-center gap-1.5">
                <ShieldAlert className="w-3 h-3 text-slate-500" />
                Mentions Légales
              </Link>
            </li>
            <li>
              <Link to="/cgu" className="hover:text-brand-pink transition-colors flex items-center gap-1.5">
                <ShieldAlert className="w-3 h-3 text-slate-500" />
                CGU & Confidentialité
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Contact Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Contact &amp; Siège</h3>
          <ul className="text-xs space-y-3">
            <li className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-brand-pink shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-gray-200">Abomey-Calavi, Bénin</span>
                <p className="text-[10px] text-gray-400">Siège Général - Direction Technique</p>
              </div>
            </li>
            
            <li className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
              <a 
                href="tel:+2290196100789" 
                className="hover:text-brand-pink transition-colors font-semibold text-gray-200 focus:text-brand-pink"
                title="Appeler Le Menu Service"
              >
                +229 0196100789
              </a>
            </li>

            <li className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-blue-400 shrink-0" />
              <a 
                href="mailto:lemenuservice@gmail.com" 
                className="hover:text-brand-pink transition-colors font-semibold text-gray-200 focus:text-brand-pink"
                title="Envoyer un e-mail"
              >
                lemenuservice@gmail.com
              </a>
            </li>

            <li className="pt-2 border-t border-gray-800/60 mt-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Nos 3 points de vente :</span>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                📍 Siège 1: En face du CEG Kansounkpa (Calavi)<br />
                📍 Siège 2: Pavé Kérékou, côté marché Tanto<br />
                📍 Siège 3: Kpodji les Monts
              </p>
            </li>
          </ul>
        </div>

      </div>
    </footer>
  );
}