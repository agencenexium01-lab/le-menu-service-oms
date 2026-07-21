import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Logo from '../components/shared/Logo';
import { 
  Printer, 
  Copy, 
  Palette, 
  Image as ImageIcon, 
  BookOpen, 
  Shirt, 
  Coffee, 
  Camera, 
  Tag, 
  FileText, 
  Monitor, 
  Compass, 
  MapPin, 
  Phone, 
  Mail,
  ArrowRight, 
  Award, 
  CheckCircle,
  HelpCircle,
  Users,
  Layers,
  Sparkles
} from 'lucide-react';

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleOrderCTA = () => {
    if (user) {
      navigate('/client/orders/new');
    } else {
      navigate('/register');
    }
  };

  const services = [
    {
      id: 1,
      title: "Impression Grand Format",
      description: "Impression haute définition sur bâches, autocollants grand format, toiles enduites frontlit/backlit de haute qualité pour votre visibilité.",
      icon: Printer,
      color: "from-pink-500 to-rose-600",
      bgLight: "bg-pink-50"
    },
    {
      id: 2,
      title: "Photocopies & Impression",
      description: "Services rapides de reproduction noir & blanc et couleur. Tous formats de documents, fort volume, impression rapide et nette.",
      icon: Copy,
      color: "from-blue-500 to-cyan-600",
      bgLight: "bg-cyan-50"
    },
    {
      id: 3,
      title: "Conception Graphique",
      description: "Donnez vie à vos idées. Création d'identité visuelle de marque, design de flyers, maquettes publicitaires, logos par des professionnels.",
      icon: Palette,
      color: "from-indigo-500 to-purple-600",
      bgLight: "bg-indigo-50"
    },
    {
      id: 4,
      title: "Tableaux Personnalisés",
      description: "Sublimez vos souvenirs et décorez vos bureaux ou intérieurs avec nos impressions sur toiles montées sur châssis en haute résolution.",
      icon: ImageIcon,
      color: "from-emerald-500 to-teal-600",
      bgLight: "bg-emerald-50"
    },
    {
      id: 5,
      title: "Kakémono / Roll-up / Pull-up",
      description: "Supports d'affichage mobile publicitaires idéaux pour vos foires, salons d'exposition et présentations commerciales marquantes.",
      icon: BookOpen,
      color: "from-amber-500 to-orange-600",
      bgLight: "bg-amber-50"
    },
    {
      id: 6,
      title: "Impression Textile",
      description: "Sublimation et flocage professionnel sur t-shirts, pulls, polos, gilets et uniformes de travail aux couleurs de votre entreprise.",
      icon: Shirt,
      color: "from-red-500 to-rose-600",
      bgLight: "bg-rose-50"
    },
    {
      id: 7,
      title: "Impression sur Tasse",
      description: "Mugs personnalisés, verres et supports céramiques publicitaires ou mugs cadeaux de haute résistance d'impression au lavage.",
      icon: Coffee,
      color: "from-cyan-500 to-blue-600",
      bgLight: "bg-blue-50"
    },
    {
      id: 8,
      title: "Photo d'Identité",
      description: "Service de prises de vues express conformes pour documents d'identité officiels, passeport et cartes professionnelles en haute définition.",
      icon: Camera,
      color: "from-violet-500 to-purple-600",
      bgLight: "bg-violet-50"
    },
    {
      id: 9,
      title: "Publicité Autocollants",
      description: "Autocollants sur-mesure, stickers, microperforés et vinyles adhésifs extérieurs pour le lettrage de vos vitrines et véhicules commerciaux.",
      icon: Tag,
      color: "from-sky-500 to-indigo-600",
      bgLight: "bg-sky-50"
    },
    {
      id: 10,
      title: "Documents & Publications",
      description: "Conception, impression et reliure de vos rapports annuels, thèses de recherche, brochures institutionnelles et magazines.",
      icon: FileText,
      color: "from-teal-500 to-green-600",
      bgLight: "bg-teal-50"
    }
  ];

  return (
    <div className="bg-[#FAFBFD] text-brand-dark min-h-screen flex flex-col" id="landing-page-root">
      
      {/* SECTION 1: HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-[#FAFBFD] pt-16 pb-20 sm:pt-20 sm:pb-28 border-b border-slate-100">
        
        {/* Decorative Grid Gradients */}
        <div className="absolute inset-x-0 top-0 -z-10 h-96 bg-gradient-to-b from-brand-pink-light/10 to-transparent"></div>
        <div className="absolute -left-48 top-12 -z-10 w-96 h-96 bg-brand-cyan/5 rounded-full filter blur-3xl"></div>
        <div className="absolute -right-48 top-12 -z-10 w-96 h-96 bg-brand-pink/5 rounded-full filter blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          
          {/* Logo variant full is rendered here */}
          <div className="animate-fade-in duration-700">
            <Logo variant="full" />
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-pink/10 text-brand-pink border border-brand-pink/15">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Atelier de fabrication agréé à Abomey-Calavi, Bénin</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-brand-dark tracking-tight leading-tight">
              L'Impression Numérique Nouvelle Génération : <br />
              <span className="bg-gradient-to-r from-brand-pink via-brand-pink-dark to-brand-cyan bg-clip-text text-transparent">
                Précision, Rapidité &amp; Suivi en Temps Réel
              </span>
            </h2>
            
            <p className="text-sm sm:text-base text-brand-muted max-w-2xl mx-auto leading-relaxed font-medium">
              Gérez efficacement tous vos travaux d'impression grand format, du dépôt de vos maquettes à la validation instantanée de vos devis d'ateliers par Firebase.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={handleOrderCTA}
              className="w-full sm:w-auto px-8 py-3.5 bg-brand-pink hover:bg-brand-pink-dark text-white rounded-2xl font-extrabold text-sm shadow-pink transition-all hover:scale-[1.02] duration-200 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{user ? 'Lancer une commande en ligne' : 'Créer un compte & Commander'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            
            <a 
              href="#services"
              className="w-full sm:w-auto px-8 py-3.5 bg-white border border-brand-border text-brand-muted hover:text-brand-pink hover:bg-slate-50 transition-colors rounded-2xl font-bold text-sm text-center"
            >
              Découvrir nos services
            </a>
          </div>

          {/* Core USP Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-10 text-left">
            <div className="bg-white p-4 rounded-xl border border-brand-border/60 shadow-sm flex gap-3.5">
              <CheckCircle className="w-5 h-5 text-brand-pink shrink-0" />
              <div>
                <h4 className="text-xs font-extrabold text-brand-dark">Qualité Certifiée</h4>
                <p className="text-[10px] text-brand-muted leading-tight mt-0.5">CMYK Haute Précision</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-brand-border/60 shadow-sm flex gap-3.5">
              <CheckCircle className="w-5 h-5 text-brand-cyan shrink-0" />
              <div>
                <h4 className="text-xs font-extrabold text-brand-dark">Validation Rapide</h4>
                <p className="text-[10px] text-brand-muted leading-tight mt-0.5">Devis immédiats en ligne</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-brand-border/60 shadow-sm flex gap-3.5">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <h4 className="text-xs font-extrabold text-brand-dark">Fichiers Sécurisés</h4>
                <p className="text-[10px] text-brand-muted leading-tight mt-0.5">Vérification technique</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-brand-border/60 shadow-sm flex gap-3.5">
              <CheckCircle className="w-5 h-5 text-brand-yellow shrink-0" />
              <div>
                <h4 className="text-xs font-extrabold text-brand-dark">Proximité Locale</h4>
                <p className="text-[10px] text-brand-muted leading-tight mt-0.5">3 Points de vente au Bénin</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 2: SERVICES & ATELIERS DE FORMULATION (GRID OF 10) */}
      <section className="py-20 bg-white" id="services">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs uppercase font-black text-brand-pink tracking-widest bg-brand-pink-light border border-brand-pink-light/30 px-3.5 py-1 rounded-full">
              Prestations &amp; Savoir-faire
            </span>
            <h3 className="text-3xl font-extrabold text-brand-dark tracking-tight">
              Nos 10 Prestations d'Impression Professionnelle
            </h3>
            <p className="text-sm text-brand-muted font-medium">
              Des équipements modernes et une expertise unique pour couvrir tous les supports de votre strategy de communication.
            </p>
          </div>

          {/* Bento-like Grid of 10 Services */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((svc) => {
              const Icon = svc.icon;
              return (
                <div 
                  key={svc.id}
                  className="bg-slate-50 border border-brand-border/60 hover:border-brand-pink-light/60 p-6 rounded-2xl transition-all hover:shadow-md hover:bg-white group duration-200 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${svc.color} text-white flex items-center justify-center shadow-sm`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-base font-extrabold text-brand-dark group-hover:text-brand-pink transition-colors">
                        {svc.id}. {svc.title}
                      </h4>
                      <p className="text-xs text-brand-muted leading-relaxed font-medium">
                        {svc.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100 mt-5 flex justify-end">
                    <button 
                      onClick={handleOrderCTA}
                      className="text-[11px] font-bold text-brand-pink hover:text-brand-pink-dark flex items-center gap-1 cursor-pointer"
                    >
                      <span>Commander</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* PROFESSIONAL TRAINING SECTION */}
          <div className="mt-20 pt-12 border-t border-slate-100">
            <div className="bg-gradient-to-br from-brand-navy to-slate-900 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-xl">
              <div className="absolute right-0 top-0 -translate-y-12 translate-x-12 w-64 h-64 bg-brand-pink/10 rounded-full filter blur-3xl"></div>
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                <div className="lg:col-span-5 space-y-4 text-left">
                  <span className="inline-block px-3 py-1 text-[10px] font-black uppercase bg-brand-pink text-white rounded-full tracking-wider">
                    Centre Académique LMS
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                    Développez vos compétences en Bureautique &amp; Design Infographique
                  </h3>
                  <p className="text-xs sm:text-sm text-brand-navy-pale/70 leading-relaxed font-medium">
                    Le Menu Service dispense des sessions de formations complètes et certifiantes animées par des experts métiers pour booster votre insertion professionnelle au Bénin.
                  </p>
                  <div className="flex gap-4 pt-1">
                    <a 
  href="https://wa.me/2290196100789?text=Bonjour,%20je%20souhaite%20m'inscrire%20%C3%A0%20une%20formation." 
  target="_blank" 
  rel="noopener noreferrer" 
  className="inline-flex items-center gap-2 text-xs font-bold bg-brand-pink hover:bg-brand-pink-dark text-white px-5 py-3 rounded-xl transition-all shadow-pink cursor-pointer"
>
  <MessageCircle className="w-3.5 h-3.5" />
  <span>S'inscrire (WhatsApp)</span>
</a>
                  </div>
                </div>

                <div className="lg:col-span-1"></div>

                <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Module 1 */}
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-5 rounded-2xl text-left space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-cyan/25 flex items-center justify-center">
                      <Monitor className="w-5 h-5 text-brand-cyan" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white">Secrétariat Bureautique</h4>
                      <p className="text-[10px] text-brand-navy-pale/60 leading-normal mt-1">Conçu pour maîtriser la gestion administrative professionnelle moderne.</p>
                    </div>
                    <ul className="text-[11px] font-bold text-gray-200 grid grid-cols-2 gap-x-1 gap-y-1 pt-1.5 border-t border-white/5">
                      <li>• Microsoft Word</li>
                      <li>• Microsoft Excel</li>
                      <li>• PowerPoint</li>
                      <li>• MS Publisher</li>
                    </ul>
                  </div>

                  {/* Module 2 */}
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-5 rounded-2xl text-left space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-pink/25 flex items-center justify-center">
                      <Layers className="w-5 h-5 text-brand-pink" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white">Graphisme &amp; PAO</h4>
                      <p className="text-[10px] text-brand-navy-pale/60 leading-normal mt-1">Apprenez à concevoir des maquettes graphiques de niveau pro.</p>
                    </div>
                    <ul className="text-[11px] font-bold text-gray-200 grid grid-cols-2 gap-x-1 gap-y-1 pt-1.5 border-t border-white/5">
                      <li>• Adobe Photoshop</li>
                      <li>• Illustrator</li>
                      <li>• Adobe InDesign</li>
                      <li>• Théorie des couleurs</li>
                    </ul>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* SECTION 3: CONTACT & ADRESSES */}
      <section className="py-20 bg-[#FAFBFD] border-t border-slate-100" id="contact">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs uppercase font-black text-brand-pink tracking-widest bg-brand-pink-light border border-brand-pink-light/30 px-3.5 py-1 rounded-full">
              Points de contact
            </span>
            <h3 className="text-3xl font-extrabold text-brand-dark tracking-tight">
              Où nous trouver au Bénin ?
            </h3>
            <p className="text-sm text-brand-muted font-medium">
              Un réseau de 3 sièges de proximité à Abomey-Calavi et Cotonou pour recueillir vos demandes d'impression et assurer la livraison physique de vos supports.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Quick Contact Form or Card block */}
            <div className="lg:col-span-4 bg-white border border-brand-border/60 p-6 rounded-2xl flex flex-col justify-between">
              <div className="space-y-6 text-left">
                <div className="space-y-1.5">
                  <h4 className="text-lg font-extrabold text-brand-dark">Standard Général</h4>
                  <p className="text-xs text-brand-muted">Une écoute téléphonique à votre service pour le devis d'impression grand format d'urgence ou d'information.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 border border-emerald-500/10 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-brand-muted font-black uppercase leading-none block">Téléphone / WhatsApp</span>
                      <a href="tel:+2290196100789" className="text-sm font-extrabold text-brand-dark hover:text-brand-pink transition-colors">
                        +229 0196100789
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 border border-blue-500/10 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-brand-muted font-black uppercase leading-none block">E-mail de support</span>
                      <a href="mailto:lemenuservice@gmail.com" className="text-sm font-extrabold text-brand-dark hover:text-brand-pink transition-colors break-all">
                        lemenuservice@gmail.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-brand-pink-light text-brand-pink border border-brand-pink-light flex items-center justify-center shrink-0">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-brand-muted font-black uppercase leading-none block">Zone d'Activités</span>
                      <p className="text-sm font-extrabold text-brand-dark">Abomey-Calavi / Cotonou</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 mt-6 space-y-3">
                <p className="text-[10.5px] italic text-brand-muted font-medium leading-relaxed">
                  &ldquo;Avez-vous besoin d'une étude technique sur-mesure pour votre enseigne Alucobond ? Appelez nos techniciens directement.&rdquo;
                </p>
                <a 
                  href="https://wa.me/2290196100789" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-full text-center block bg-emerald-500 hover:bg-emerald-650 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-emerald-500/10 transition-colors"
                >
                  Lancer une discussion WhatsApp
                </a>
              </div>
            </div>

            {/* Grid of the 3 branches addresses */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Branch 1 */}
              <div className="bg-white border border-brand-border/60 p-6 rounded-2xl text-left flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-9 h-9 rounded-xl bg-brand-pink-light/40 text-brand-pink border border-brand-pink-light flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                    S1
                  </div>
                  <h4 className="text-sm font-extrabold text-brand-dark">Siège 1 : Kansounkpa</h4>
                  <p className="text-xs text-brand-muted leading-relaxed font-medium">
                    Face au CEG Kansounkpa. Point technique d'Abomey-Calavi ouvert du lundi au samedi.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-50 mt-6 flex gap-2 items-center text-[10.5px] font-bold text-brand-muted">
                  <MapPin className="w-3.5 h-3.5 text-brand-pink" />
                  <span>Abomey-Calavi</span>
                </div>
              </div>

              {/* Branch 2 */}
              <div className="bg-white border border-brand-border/60 p-6 rounded-2xl text-left flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-9 h-9 rounded-xl bg-brand-cyan-light/40 text-brand-cyan border border-brand-cyan-light flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                    S2
                  </div>
                  <h4 className="text-sm font-extrabold text-brand-dark">Siège 2 : Pavé Kérékou</h4>
                  <p className="text-xs text-brand-muted leading-relaxed font-medium">
                    Dans la voie à côté du marché Tanto, sur le pavé Kérékou. Bureau commercial de prise de commandes.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-50 mt-6 flex gap-2 items-center text-[10.5px] font-bold text-brand-muted">
                  <MapPin className="w-3.5 h-3.5 text-brand-cyan" />
                  <span>Pavé Kérékou, Bénin</span>
                </div>
              </div>

              {/* Branch 3 */}
              <div className="bg-white border border-brand-border/60 p-6 rounded-2xl text-left flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 border border-amber-200 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                    S3
                  </div>
                  <h4 className="text-sm font-extrabold text-brand-dark">Siège 3 : Kpodji les Monts</h4>
                  <p className="text-xs text-brand-muted leading-relaxed font-medium">
                    Station commerciale d'accueil de vos demandes et retraits de bâches imprimées de proximité.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-50 mt-6 flex gap-2 items-center text-[10.5px] font-bold text-brand-muted">
                  <MapPin className="w-3.5 h-3.5 text-brand-yellow" />
                  <span>Kpodji les Monts</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* SECTION 4: CTA FINAL */}
      <section className="bg-gradient-to-br from-brand-pink to-brand-pink-dark text-white py-14 sm:py-16 relative overflow-hidden text-center shadow-inner">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full filter blur-3xl -z-10 animate-pulse"></div>
        
        <div className="max-w-4xl mx-auto px-4 space-y-6 relative z-10">
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2 leading-tight">
            Prêt à lancer vos impressions numériques de haute qualité ?
          </h3>
          <p className="text-xs sm:text-sm text-brand-navy-pale font-medium max-w-xl mx-auto leading-relaxed">
            Créez votre compte en 2 minutes ou connectez-vous pour déposer vos maquettes d'ateliers, calculer un devis précis et suivre la mise sous presse de vos ouvrages.
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center pt-2">
            {user ? (
              <Link 
                to="/client/orders/new" 
                className="px-8 py-3 bg-white text-brand-pink hover:text-brand-pink-dark font-extrabold text-sm rounded-xl hover:scale-[1.02] transition-transform duration-150 inline-flex items-center gap-2 shadow-2xl"
              >
                <span>Saisir une nouvelle commande</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link 
                  to="/register" 
                  className="px-8 py-3 bg-white text-brand-pink hover:text-brand-pink-dark font-extrabold text-sm rounded-xl hover:scale-[1.02] transition-transform duration-150 inline-flex items-center gap-2 shadow-2xl"
                >
                  <span>Créer un compte</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link 
                  to="/login"
                  className="px-8 py-3 bg-brand-pink-dark/40 hover:bg-brand-pink-dark/60 text-white font-bold text-sm rounded-xl border border-white/20 transition-all"
                >
                  Me connecter
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}