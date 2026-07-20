import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Smartphone, Download, X } from 'lucide-react';

export default function PwaInstallModal() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentUrl, setCurrentUrl] = useState<string>('');

  useEffect(() => {
    // Récupérer l'URL courante
    setCurrentUrl(window.location.origin);

    // Écouter l'événement d'installation PWA (Android / Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <>
      {/* Bouton de déclenchement */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-[#E91E8C]/10 text-[#E91E8C] border border-[#E91E8C]/20 rounded-xl text-xs font-bold hover:bg-[#E91E8C] hover:text-white transition-all cursor-pointer"
      >
        <Smartphone className="w-4 h-4" />
        <span>Installer / Scanner</span>
      </button>

      {/* Pop-up Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111A36] border border-white/10 rounded-2xl max-w-sm w-full p-6 text-center relative space-y-5 shadow-2xl">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-black text-white">Application Le Menu Service</h3>
              <p className="text-xs text-slate-400 mt-1">
                Accédez à la plateforme en un clic depuis votre écran d'accueil.
              </p>
            </div>

            {/* QR CODE SECTION */}
            <div className="bg-white p-4 rounded-xl inline-block shadow-inner">
              {currentUrl && (
                <QRCodeSVG
                  value={currentUrl}
                  size={160}
                  bgColor={"#FFFFFF"}
                  fgColor={"#000000"}
                  level={"L"}
                  includeMargin={false}
                />
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Scannez ce QR Code avec votre téléphone pour ouvrir le site.
            </p>

            {/* BOUTON D'INSTALLATION DIRECT (PWA) */}
            {deferredPrompt ? (
              <button
                onClick={handleInstallClick}
                className="w-full py-2.5 bg-[#E91E8C] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-[#c21875] transition-all shadow-lg"
              >
                <Download className="w-4 h-4" />
                <span>Ajouter à l'écran d'accueil</span>
              </button>
            ) : (
              <div className="bg-white/5 p-3 rounded-xl text-[11px] text-slate-300 space-y-1 text-left border border-white/5">
                <span className="font-bold text-[#E91E8C] block">iPhone / iOS :</span>
                <p>Appuyez sur le bouton **Partager** (<span className="font-mono">Safari</span>), puis sélectionnez **« Sur l'écran d'accueil »**.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}