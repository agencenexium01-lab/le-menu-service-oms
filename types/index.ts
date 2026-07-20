import { Timestamp } from 'firebase/firestore';

export type UserRole = 'client' | 'chef_point' | 'super_admin' | 'admin';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone: string;
  companyName?: string;
  // Uniquement pour le rôle chef_point — null pour les autres
  branchId?: string | null;
  active?: boolean;      // ← NOUVEAU : permet de désactiver un compte sans le supprimer
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export type ServiceType =
  | 'impression_grand_format'   // Impression Grand Format (bâche, toile, roll-up)
  | 'photocopie_impression'     // Photocopies & Impression (A5, A4, A3)
  | 'conception_graphique'      // Conception Graphique (affiche, carte de visite...)
  | 'tableau_personnalise'      // Tableau Personnalisé
  | 'kakemono_rollup'           // Kakémono / Roll-up / Pull-up
  | 'impression_textile'        // Impression Textile (t-shirt, maillot)
  | 'impression_tasse'          // Impression sur Tasse / Mug
  | 'photo_identite'            // Photo d'Identité
  | 'autocollant_pub'           // Publicité Autocollants + Installation
  | 'documents_ligne'           // Documents & Publications en ligne
  | 'formation_bureautique'     // Formation Secrétariat Bureautique
  | 'formation_graphisme'       // Formation Graphisme PAO
  | 'autre';                    // Autre (préciser dans description)

// Mapper les serviceType vers les labels FR pour l'affichage
export const SERVICE_LABELS: Record<ServiceType, string> = {
  impression_grand_format: '🖨️ Impression Grand Format',
  photocopie_impression:   '📄 Photocopies & Impression',
  conception_graphique:    '🎨 Conception Graphique',
  tableau_personnalise:    '🖼️ Tableau Personnalisé',
  kakemono_rollup:         '📜 Kakémono / Roll-up / Pull-up',
  impression_textile:      '👕 Impression Textile (T-shirt / Maillot)',
  impression_tasse:        '☕ Impression sur Tasse / Mug',
  photo_identite:          '📸 Photo d\'Identité',
  autocollant_pub:         '🏷️ Publicité Autocollants',
  documents_ligne:         '📋 Documents & Publications',
  formation_bureautique:   '🖥️ Formation Bureautique',
  formation_graphisme:     '🎭 Formation Graphisme PAO',
  autre:                   '✏️ Autre (préciser dans la description)',
};

export interface Order {
  id?: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  serviceType: ServiceType;
  description: string;
  dimensions: { width: number; height: number; unit: 'cm' | 'm' };
  quantity: number;
  fileUrls: string[];
  fileNames: string[];
  status: 'nouveau' | 'en_verification' | 'devis_envoye' | 'devis_accepte' | 'en_production' | 'pret' | 'livre' | 'annule';
  specialNote?: string;
  adminNotes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // NOUVEAUX CHAMPS (ajouter, ne pas remplacer)
  branchId?: string;           // Annexe qui a REÇU la commande (optionnel pour les existants)
  assignedBranchId?: string;  // Annexe qui TRAITE la commande (peut différer)
  branchName?: string;        // Dénormalisé pour les listes

  // PAIEMENT
  paymentStatus?: 'pending' | 'paid';  // pending par défaut
  paidAt?: Timestamp;                  // Date de validation du paiement
  paidBy?: string;                     // UID du staff qui a validé
  paidByName?: string;                 // Nom dénormalisé

  // COMMANDE MANUELLE (physique)
  isManualOrder?: boolean;             // true si créée par le staff (pas via portail client)
  walkInClientName?: string;           // Nom du client walk-in (si pas de compte)
  walkInClientPhone?: string;          // Téléphone du client walk-in
  walkInClientCompany?: string;        // Entreprise du client walk-in (optionnel)
  manualOrderNote?: string;            // Note interne sur la commande physique
}

export type PaymentFilter = 'all' | 'paid' | 'pending';
export type OrderSourceFilter = 'all' | 'digital' | 'manual';

export interface Branch {
  id: string;           // 'annexe_1' | 'annexe_2' | 'annexe_3'
  name: string;         // "Annexe 1 — Kansounkpa"
  shortName: string;    // "A1"
  address: string;      // "Face au CEG Kansounkpa, Abomey-Calavi"
  phone: string;        // "+229 0196100789"
  active: boolean;
  sortOrder: number;    // 1, 2, 3
  createdAt: Timestamp;
}

export interface Quote {
  id?: string;
  orderId: string;
  clientId: string;
  adminId: string;
  amount: number;
  description: string;
  deliveryDays: number;
  validUntil: Timestamp;
  status: 'pending' | 'accepted' | 'refused';
  clientComment?: string;
  createdAt: Timestamp;
  respondedAt?: Timestamp;
}

export interface Notification {
  id?: string;
  userId: string;
  type: 'new_order' | 'quote_received' | 'quote_responded' | 'status_updated' | 'file_issue';
  title: string;
  message: string;
  orderId?: string;
  read: boolean;
  createdAt: Timestamp;
  branchId?: string;    // Pour filtrage par annexe
}
