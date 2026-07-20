import React, { useState, useEffect, useRef } from 'react';
import OrderForm from '../../../../../components/client/OrderForm';
import { askOrderGuide } from '../../../../../lib/gemini/client';
import { Order } from '../../../../../types';
import { 
  MessageSquare, 
  X, 
  Send, 
  Loader2, 
  Bot
} from 'lucide-react';

export default function ClientNewOrderPage() {
  const [messages, setMessages] = useState<Array<{ sender: 'assistant' | 'user'; text: string }>>([
    {
      sender: 'assistant',
      text: "Bonjour ! Je suis là pour vous aider à passer votre commande. Quelle est la nature de votre projet ?"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isMobileDrawerOpen]);

  // Query DOM in real time to capture active input values
  const grabCurrentFormData = (): Partial<Order> => {
    try {
      const select = document.querySelector('select') as HTMLSelectElement | null;
      const inputs = Array.from(document.querySelectorAll('input'));
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement | null;

      const widthInput = inputs.find(i => i.placeholder === 'Largeur');
      const heightInput = inputs.find(i => i.placeholder === 'Hauteur');
      const qtyInput = inputs.find(i => i.type === 'number' && !i.placeholder);
      const specNoteInput = inputs.find(i => i.placeholder?.startsWith('Ex : Urgent'));

      const unitButton = document.querySelector('.bg-slate-950 .bg-green-600') as HTMLButtonElement | null;
      const unit = unitButton ? (unitButton.textContent?.trim().toLowerCase() === 'cm' ? 'cm' : 'm') : 'm';

      return {
        serviceType: select?.value as any || 'bache',
        quantity: qtyInput ? parseInt(qtyInput.value) || 1 : 1,
        dimensions: {
          width: widthInput ? parseFloat(widthInput.value) || 0 : 0,
          height: heightInput ? parseFloat(heightInput.value) || 0 : 0,
          unit: unit as 'cm' | 'm'
        },
        description: textarea?.value || '',
        specialNote: specNoteInput?.value || ''
      };
    } catch (e) {
      console.warn("Could not grab form data from DOM:", e);
      return {};
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    if (userMessageCount >= 10) {
      return;
    }

    const currentMsg = input.trim();
    setInput('');
    
    const updatedMessages = [...messages, { sender: 'user' as const, text: currentMsg }];
    setMessages(updatedMessages);
    setUserMessageCount(prev => prev + 1);
    setLoading(true);

    try {
      const currentFormData = grabCurrentFormData();
      const reply = await askOrderGuide(currentMsg, currentFormData);
      
      setMessages(prev => [...prev, { sender: 'assistant' as const, text: reply }]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [
        ...prev, 
        { 
          sender: 'assistant' as const, 
          text: "Je suis spécialisé dans l'aide aux commandes d'impression. Pour toute autre question, contactez-nous directement." 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const isLimitReached = userMessageCount >= 10;

  const renderChatInterface = () => (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl">
      {/* Header panel */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <Bot className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-xs font-bold tracking-tight text-slate-900 leading-none">Assistant Virtuel</h3>
            <span className="text-[10px] text-slate-500 font-medium block mt-1">Le Menu Service • En ligne</span>
          </div>
        </div>
        
        {/* Mobile close button */}
        <button 
          onClick={() => setIsMobileDrawerOpen(false)} 
          className="lg:hidden p-1.5 hover:bg-slate-200/60 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Message history layout */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex items-start gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
            {msg.sender === 'assistant' ? (
              <div className="w-6 h-6 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200 text-[9px] font-bold">
                LM
              </div>
            ) : (
              <div className="w-6 h-6 bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border border-slate-300 text-[9px] font-bold">
                US
              </div>
            )}
            
            <div className={`p-3 rounded-2xl text-[12px] leading-relaxed font-medium max-w-[80%] shadow-sm ${
              msg.sender === 'user'
                ? 'bg-emerald-600 text-white rounded-tr-none'
                : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-2 animate-pulse">
            <div className="w-6 h-6 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200 text-[9px] font-bold">
              LM
            </div>
            <div className="bg-white text-slate-600 rounded-2xl rounded-tl-none p-3 border border-slate-200 flex items-center gap-1.5 text-[12px] font-medium shadow-sm">
              <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
              <span>Rédaction du conseil...</span>
            </div>
          </div>
        )}

        {isLimitReached && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-[11px] font-semibold tracking-wide text-center leading-relaxed shadow-sm">
            Pour continuer, contactez-nous directement.
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Chat sender area */}
      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading || isLimitReached}
          placeholder={isLimitReached ? "Limite de messages atteinte" : "Bâche ou panneau rigide ?..."}
          className="flex-1 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:bg-white rounded-xl px-3.5 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || isLimitReached || !input.trim()}
          className="w-11 h-11 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );

  return (
    <div className="space-y-6 min-h-screen bg-slate-50 p-4 sm:p-6" id="client-new-order-page">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">Configurer mes travaux</h1>
        <p className="text-slate-600 text-xs sm:text-sm mt-1">Spécifiez les dimensions, les supports et téléversez vos visuels grand format pour chiffrage instantané.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Main configuration form */}
        <div className="flex-1 w-full bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm">
          <OrderForm />
        </div>

        {/* Sidebar Panel for Desktop screens */}
        <div className="hidden lg:block w-[320px] shrink-0 sticky top-6 self-start h-[550px]">
          {renderChatInterface()}
        </div>
      </div>

      {/* Quick advice action trigger on Mobile screen */}
      <button
        onClick={() => setIsMobileDrawerOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-xl z-40 flex items-center justify-center transition-all cursor-pointer border border-emerald-500/20 active:scale-95 duration-100"
        id="mobile-chat-trigger"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Floating Bottom Drawer for Mobile screen */}
      {isMobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex flex-col justify-end animate-fade-in" id="mobile-chat-overlay">
          {/* Backdrop trigger */}
          <div className="absolute inset-0" onClick={() => setIsMobileDrawerOpen(false)} />
          
          <div className="relative bg-white border-t border-slate-200 rounded-t-3xl overflow-hidden h-[75vh] w-full z-10 flex flex-col shadow-2xl">
            {renderChatInterface()}
          </div>
        </div>
      )}
    </div>
  );
}