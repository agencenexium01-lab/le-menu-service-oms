// Utiliser des sons synthétisés avec Web Audio API pour éviter les fichiers externes et problèmes de CORS
export const playNotificationSound = (type: 'new_order' | 'quote_response' | 'status_update') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioCtx = new AudioContextClass();
    
    // Resume audio context if suspended (browser security autoplays)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    // Sons distincts par type d'événement
    switch (type) {
      case 'new_order':
        // 3 bips courts montants — son d'alerte urgente
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, now);
        oscillator.frequency.setValueAtTime(1100, now + 0.1);
        oscillator.frequency.setValueAtTime(1320, now + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        
        oscillator.start(now);
        oscillator.stop(now + 0.5);
        break;

      case 'quote_response':
        // 2 bips doux — réponse client
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(660, now);
        oscillator.frequency.setValueAtTime(880, now + 0.15);
        
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        
        oscillator.start(now);
        oscillator.stop(now + 0.4);
        break;

      case 'status_update':
        // 1 bip simple — mise à jour statut
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523, now);
        
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        
        oscillator.start(now);
        oscillator.stop(now + 0.3);
        break;
    }
  } catch (err) {
    console.warn("Impossible de jouer le son de notification:", err);
  }
};

// Demander la permission pour les notifications browser
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (err) {
    console.warn("Erreur de demande de permission de notification:", err);
    return false;
  }
};

// Envoyer une notification browser (visible même si onglet en arrière-plan)
export const sendBrowserNotification = (title: string, body: string, icon?: string) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    const notification = new Notification(title, {
      body,
      icon: icon || '/logo.png',
      badge: '/logo.png',
      tag: 'le-menu-service',  // Remplace les notifs précédentes
      requireInteraction: false,
    });
    // Fermeture automatique après 5 secondes
    setTimeout(() => notification.close(), 5000);
    // Clic → focus sur l'onglet
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (err) {
    console.warn("Erreur d'envoi de notification système:", err);
  }
};

// Vérifier si le son est activé (stocké dans localStorage de l'utilisateur)
export const isSoundEnabled = (): boolean => {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('lms_sound_enabled') !== 'false';
};

export const toggleSound = (): boolean => {
  if (typeof window === 'undefined') return true;
  const current = isSoundEnabled();
  localStorage.setItem('lms_sound_enabled', String(!current));
  return !current;
};
