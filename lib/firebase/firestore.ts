import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc, 
  getDocs,
  query, 
  where, 
  orderBy, 
  Timestamp,
  onSnapshot,
  Unsubscribe,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';
import { Order, Quote, User as AppUser, Notification, ServiceType, Branch, SERVICE_LABELS } from '../../types';

/**
 * Creates a new order in FireStore
 */
export async function createOrder(order: Omit<Order, 'id'>): Promise<string> {
  const ordersRef = collection(db, 'orders');
  const newOrderDoc = doc(ordersRef);
  
  const finalOrder: Order = {
    ...order,
    id: newOrderDoc.id,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };

  await setDoc(newOrderDoc, finalOrder);

  const id_court = finalOrder.orderNumber;

  // 1. Notifier le client
  try {
    await createNotification({
      userId: finalOrder.clientId,
      type: 'status_updated',
      title: "Commande enregistrée",
      message: `Votre commande #${id_court} a été enregistrée avec succès. Vous recevrez une notification dès qu'un devis sera prêt.`,
      orderId: newOrderDoc.id,
      read: false
    });
  } catch (err) {
    console.warn("Erreur notification client creation:", err);
  }

  // 2. Notifier les super_admin, admin, et chef_point de la branch
  try {
    await notifyProsForOrder(newOrderDoc.id, finalOrder.assignedBranchId || finalOrder.branchId || undefined, {
      type: 'new_order',
      title: "Nouvelle commande",
      message: `Une nouvelle commande #${id_court} vient d'être créée.`
    });
  } catch (err) {
    console.warn("Erreur notification pros creation:", err);
  }

  return newOrderDoc.id;
}

/**
 * Helper to notify professional accounts (chefs and admins) for an order change
 */
export async function notifyProsForOrder(
  orderId: string, 
  branchId: string | undefined, 
  notifData: { type: Notification['type']; title: string; message: string }
): Promise<void> {
  try {
    const usersRef = collection(db, 'users');
    const usersSnap = await getDocs(usersRef);
    const notifyPromises: Promise<string>[] = [];
    
    usersSnap.forEach((userDoc) => {
      const uData = userDoc.data();
      const shouldNotify = 
        (uData.role === 'chef_point' && branchId && uData.branchId === branchId) ||
        (uData.role === 'admin' || uData.role === 'super_admin');
        
      if (shouldNotify) {
        notifyPromises.push(
          createNotification({
            userId: userDoc.id,
            type: notifData.type,
            title: notifData.title,
            message: notifData.message,
            orderId,
            branchId: branchId || undefined,
            read: false
          })
        );
      }
    });
    await Promise.all(notifyPromises);
  } catch (err) {
    console.warn("Erreur notifyProsForOrder:", err);
  }
}

/**
 * Helper to notify only super admins & admins for an order change
 */
export async function notifyOnlyAdminsAndSuperAdmins(
  orderId: string,
  notifData: { type: Notification['type']; title: string; message: string }
): Promise<void> {
  try {
    const usersRef = collection(db, 'users');
    const usersSnap = await getDocs(usersRef);
    const notifyPromises: Promise<string>[] = [];
    
    usersSnap.forEach((userDoc) => {
      const uData = userDoc.data();
      const shouldNotify = uData.role === 'admin' || uData.role === 'super_admin';
        
      if (shouldNotify) {
        notifyPromises.push(
          createNotification({
            userId: userDoc.id,
            type: notifData.type,
            title: notifData.title,
            message: notifData.message,
            orderId,
            read: false
          })
        );
      }
    });
    await Promise.all(notifyPromises);
  } catch (err) {
    console.warn("Erreur notifyOnlyAdminsAndSuperAdmins:", err);
  }
}

/**
 * Updates an order's status and other fields in Firestore
 * Alignement strict sur les 7 statuts officiels du cahier des charges.
 */
export async function updateOrder(orderId: string, updates: Partial<Order>): Promise<void> {
  const oldOrder = await getOrderById(orderId);
  const orderRef = doc(db, 'orders', orderId);
  await updateDoc(orderRef, {
    ...updates,
    updatedAt: Timestamp.now()
  });

  const orderNumber = oldOrder ? oldOrder.orderNumber : '';

  // 1. Si la branche assignée change (Réassignation par le Propriétaire)
  if (updates.assignedBranchId && (!oldOrder || oldOrder.assignedBranchId !== updates.assignedBranchId)) {
    try {
      await notifyAnnexChefsAndAdmins(
        orderId,
        updates.assignedBranchId,
        orderNumber,
        oldOrder?.clientName || 'Le Client'
      );
    } catch (err) {
      console.warn("Erreur notification reassignment:", err);
    }
  }

  // 2. Gestion des transitions de statut (Conforme au workflow officiel)
  if (updates.status && (!oldOrder || oldOrder.status !== updates.status)) {
    try {
      let title = '';
      let message = '';
      let targetType: Notification['type'] = 'status_updated';

      if (updates.status === 'En production') {
        title = "Préparation lancée";
        message = `Votre commande #${orderNumber} est en cours de préparation dans notre atelier.`;
      } else if (updates.status === 'Prêt') {
        title = "Commande prête !";
        message = `Bonne nouvelle ! Votre commande #${orderNumber} est prête. Vous pouvez venir la récupérer au Siège.`;
      } else if (updates.status === 'Livré') {
        title = "Commande récupérée";
        message = `Merci de votre confiance. Votre commande #${orderNumber} a été marquée comme récupérée.`;
      }

      if (title && message && oldOrder) {
        await createNotification({
          userId: oldOrder.clientId,
          type: targetType,
          title,
          message,
          orderId,
          read: false
        });
      }
    } catch (err) {
      console.warn("Erreur notification statut updateOrder:", err);
    }
  }

  // 3. Fichiers complémentaires téléversés
  if (updates.fileUrls && oldOrder && oldOrder.fileUrls) {
    try {
      if (updates.fileUrls.length > oldOrder.fileUrls.length) {
        await notifyProsForOrder(orderId, oldOrder.assignedBranchId || oldOrder.branchId || undefined, {
          type: 'file_issue',
          title: "Fichier complémentaire déposé",
          message: `Un nouveau document a été ajouté par le client à la commande #${orderNumber}.`
        });
      }
    } catch (err) {
      console.warn("Erreur notification fichier complémentaire:", err);
    }
  }
}

/**
 * Sends targeted notifications to relevant annex chefs and super_admins / admins
 */
export async function notifyAnnexChefsAndAdmins(
  orderId: string,
  targetBranchId: string,
  orderNumber: string,
  clientName: string
): Promise<void> {
  try {
    const usersRef = collection(db, 'users');
    const usersSnap = await getDocs(usersRef);
    
    const notifyPromises: Promise<string>[] = [];
    
    usersSnap.forEach((userDoc) => {
      const uData = userDoc.data();
      const shouldNotify = 
        (uData.role === 'chef_point' && uData.branchId === targetBranchId) ||
        (uData.role === 'admin' || uData.role === 'super_admin');
        
      if (shouldNotify) {
        notifyPromises.push(
          createNotification({
            userId: userDoc.id,
            type: 'new_order',
            title: `Commande affectée - #${orderNumber}`,
            message: `La commande #${orderNumber} (${clientName}) est rattachée au siège ${targetBranchId.toUpperCase()}.`,
            orderId,
            branchId: targetBranchId,
            read: false
          })
        );
      }
    });
    
    await Promise.all(notifyPromises);
  } catch (err) {
    console.warn("Erreur notifyAnnexChefsAndAdmins:", err);
  }
}

/**
 * Fetches a single order document from Firestore
 */
export async function getOrderById(orderId: string): Promise<Order | null> {
  const orderRef = doc(db, 'orders', orderId);
  const docSnap = await getDoc(orderRef);
  if (docSnap.exists()) {
    return docSnap.data() as Order;
  }
  return null;
}

/**
 * Creates or updates a quote for an order
 */
export async function saveQuote(quote: Omit<Quote, 'id'> & { id?: string }): Promise<string> {
  const quotesRef = collection(db, 'quotes');
  const quoteDoc = quote.id ? doc(quotesRef, quote.id) : doc(quotesRef);
  
  const finalQuote: Quote = {
    ...quote,
    id: quoteDoc.id,
    createdAt: quote.createdAt || Timestamp.now(),
    respondedAt: quote.respondedAt || undefined
  };

  await setDoc(quoteDoc, finalQuote);
  return quoteDoc.id;
}

/**
 * Fetches the active quote for a given order
 */
export async function getQuoteByOrderId(orderId: string): Promise<Quote | null> {
  const quotesRef = collection(db, 'quotes');
  const q = query(quotesRef, where('orderId', '==', orderId), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].data() as Quote;
  }
  return null;
}

export interface OrderHistoryItem {
  id: string;
  status: Order['status'] | string;
  changedAt: Timestamp;
  changedBy: string;
  note?: string;
}

/**
 * Adds an entry to the status history subcollection of an order
 */
export async function addOrderStatusHistory(
  orderId: string,
  status: Order['status'] | string,
  changedBy: string,
  note?: string
): Promise<string> {
  const historyRef = collection(db, 'orders', orderId, 'history');
  const newDoc = doc(historyRef);
  const historyItem: OrderHistoryItem = {
    id: newDoc.id,
    status,
    changedAt: Timestamp.now(),
    changedBy,
    note: note || ''
  };
  await setDoc(newDoc, historyItem);
  return newDoc.id;
}

/**
 * Fetches the status history of an order sorted by changedAt ascending
 */
export async function getOrderStatusHistory(orderId: string): Promise<OrderHistoryItem[]> {
  const historyRef = collection(db, 'orders', orderId, 'history');
  const q = query(historyRef, orderBy('changedAt', 'asc'));
  const querySnapshot = await getDocs(q);
  const items: OrderHistoryItem[] = [];
  querySnapshot.forEach((docSnap) => {
    items.push(docSnap.data() as OrderHistoryItem);
  });
  return items;
}

/**
 * Récupère toutes les commandes avec filtres optionnels harmonisés en français
 */
export async function getAllOrders(filters?: {
  status?: Order['status'];
  branchId?: string;
  clientId?: string;
  isManualOrder?: boolean;
  paymentStatus?: 'Payé' | 'Non payé';
}): Promise<Order[]> {
  try {
    const ordersRef = collection(db, 'orders');
    const constraints: any[] = [];

    if (filters?.status) {
      constraints.push(where('status', '==', filters.status));
    }
    if (filters?.branchId) {
      constraints.push(where('assignedBranchId', '==', filters.branchId));
    }
    if (filters?.clientId) {
      constraints.push(where('clientId', '==', filters.clientId));
    }
    if (filters?.isManualOrder !== undefined) {
      constraints.push(where('isManualOrder', '==', filters.isManualOrder));
    }
    if (filters?.paymentStatus) {
      constraints.push(where('paymentStatus', '==', filters.paymentStatus));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    const q = query(ordersRef, ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
  } catch (error) {
    console.error("Erreur getAllOrders:", error);
    throw error;
  }
}

/**
 * FONCTION UNIQUE ET HARMONISÉE DE VALIDATION DE PAIEMENT
 * Utilisée pour les règlements physiques au comptoir (M. ADOGBA ou Chefs de siège).
 */
export async function validateOrderPayment(
  orderId: string,
  staffUid: string,
  staffName: string
): Promise<void> {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const oldOrder = await getOrderById(orderId);
    const orderNumber = oldOrder ? oldOrder.orderNumber : orderId;

    await updateDoc(orderRef, {
      paymentStatus: 'Payé',
      paidAt: Timestamp.now(),
      paidBy: staffUid,
      paidByName: staffName,
      updatedAt: Timestamp.now()
    });

    // Enregistrement unifié dans l'historique
    await addOrderStatusHistory(
      orderId,
      'Paiement Validé',
      staffName,
      `Règlement physique enregistré avec succès par ${staffName}.`
    );

    // Notification Client
    if (oldOrder) {
      await createNotification({
        userId: oldOrder.clientId,
        type: 'status_updated',
        title: "Paiement confirmé",
        message: `Le paiement pour votre commande #${oldOrder.orderNumber} a été validé. La production suit son cours.`,
        orderId,
        read: false
      });
    }

    // Notification en temps réel pour le propriétaire (Super Admin)
    await createNotificationForRole('super_admin', {
      type: 'status_updated',
      title: '💰 Paiement validé',
      message: `La commande #${orderNumber} a été marquée comme payée par ${staffName}.`,
      orderId,
    });

  } catch (error) {
    console.error("Erreur dans validateOrderPayment:", error);
    throw error;
  }
}

export async function validatePayment(
  orderId: string,
  staff: { uid: string; name: string }
): Promise<void> {
  return validateOrderPayment(orderId, staff.uid, staff.name);
}

/**
 * Creates a notification in Firestore
 */
export async function createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<string> {
  const notificationsRef = collection(db, 'notifications');
  const newDoc = doc(notificationsRef);
  const finalNotification = {
    ...notification,
    id: newDoc.id,
    read: false,
    createdAt: Timestamp.now()
  };
  await setDoc(newDoc, finalNotification);
  return newDoc.id;
}

/**
 * Creates a new quote inside Firestore, updates order status & logs transition
 */
export async function addQuote(
  quote: Omit<Quote, 'id' | 'createdAt'>,
  changedBy: string
): Promise<string> {
  const quotesRef = collection(db, 'quotes');
  const newQuoteDoc = doc(quotesRef);
  const finalQuote: Quote = {
    ...quote,
    id: newQuoteDoc.id,
    createdAt: Timestamp.now()
  };
  await setDoc(newQuoteDoc, finalQuote);

  const orderDoc = await getOrderById(quote.orderId);
  const orderNumber = orderDoc ? orderDoc.orderNumber : '';

  // Passage officiel au statut "Devis envoyé"
  await updateOrder(quote.orderId, {
    status: 'Devis envoyé'
  });

  await addOrderStatusHistory(
    quote.orderId,
    'Devis envoyé',
    changedBy,
    `Devis émis : ${quote.amount.toLocaleString('fr-BJ')} XOF (Délai estimé : ${quote.deliveryDays} jours).`
  );

  await createNotification({
    userId: quote.clientId,
    type: 'quote_received',
    title: 'Votre devis est prêt',
    message: `Le devis de ${quote.amount.toLocaleString('fr-BJ')} XOF pour votre commande #${orderNumber} est disponible.`,
    orderId: quote.orderId,
    read: false
  });

  return newQuoteDoc.id;
}

/**
 * Processes client's response to an active quote (accept or refuse)
 */
export async function respondToQuote(
  quoteId: string,
  accept: boolean,
  clientComment?: string
): Promise<void> {
  const quoteRef = doc(db, 'quotes', quoteId);
  const quoteSnap = await getDoc(quoteRef);
  if (!quoteSnap.exists()) {
    throw new Error("Le devis spécifié n'existe pas.");
  }

  const quote = quoteSnap.data() as Quote;
  const newStatus = accept ? 'accepted' : 'refused';

  await updateDoc(quoteRef, {
    status: newStatus,
    clientComment: clientComment || '',
    respondedAt: Timestamp.now()
  });

  const orderDoc = await getOrderById(quote.orderId);
  const orderNumber = orderDoc ? orderDoc.orderNumber : '';

  // Prochaine étape logique selon le choix du client
  const nextOrderStatus = accept ? 'Devis accepté' : 'En verification';

  await updateOrder(quote.orderId, {
    status: nextOrderStatus
  });

  const responseLabel = accept ? 'Devis accepté par le client' : 'Devis refusé par le client';
  const finalNotes = clientComment ? `Commentaires : "${clientComment}"` : 'Aucun commentaire.';
  
  await addOrderStatusHistory(
    quote.orderId,
    nextOrderStatus,
    orderDoc?.clientName || 'Le Client',
    `${responseLabel}. ${finalNotes}`
  );

  try {
    if (accept) {
      await notifyProsForOrder(quote.orderId, orderDoc?.assignedBranchId || orderDoc?.branchId || undefined, {
        type: 'quote_responded',
        title: "Devis accepté",
        message: `Le devis pour la commande #${orderNumber} a été validé en ligne par le client. Attente de paiement.`
      });
    } else {
      await notifyOnlyAdminsAndSuperAdmins(quote.orderId, {
        type: 'quote_responded',
        title: "Devis refusé",
        message: `Le client a décliné le devis pour la commande #${orderNumber}.${clientComment ? ` Motif : "${clientComment}"` : ''}`
      });
    }
  } catch (err) {
    console.warn("Erreur de notification lors de la réponse au devis:", err);
  }
}

/**
 * Seeds the 'services' collection in Firestore with official prices if empty
 */
export async function seedServices(): Promise<boolean> {
  try {
    const appSettingsRef = doc(db, 'settings', 'app');
    const settingsSnap = await getDoc(appSettingsRef);
    if (settingsSnap.exists() && settingsSnap.data()?.servicesSeedDone === true) {
      return false;
    }

    const servicesRef = collection(db, 'services');
    const servicesSnap = await getDocs(servicesRef);
    if (!servicesSnap.empty) {
      await setDoc(appSettingsRef, { servicesSeedDone: true }, { merge: true });
      return false;
    }

    const OFFICIAL_SERVICES: Record<ServiceType, { label: string; description: string; basePrice: number; unit: string }> = {
      impression_grand_format: {
        label: "Impression Grand Format",
        description: "Impression de bâche publicitaire PVC, toiles tendues canvas ou roll-up haute définition.",
        basePrice: 2000,
        unit: "m²"
      },
      photocopie_impression: {
        label: "Photocopies & Impression",
        description: "Impression laser de documents administratifs officiels A5, A4, A3 en N&B ou couleur.",
        basePrice: 100,
        unit: "page"
      },
      conception_graphique: {
        label: "Conception Graphique",
        description: "Conception de logos uniques, chartes graphiques, maquettes d'affiches professionnelles et supports imprimés.",
        basePrice: 10000,
        unit: "projet"
      },
      tableau_personnalise: {
        label: "Tableau Personalise",
        description: "Impression de toiles d'art personnalisées avec châssis rigide robuste, parfait pour un cadeau unique.",
        basePrice: 15000,
        unit: "pièce"
      },
      kakemono_rollup: {
        label: "Kakémono / Roll-up / Pull-up",
        description: "Dispositif d'exposition complet avec support portable, sacoche et impression haute définition.",
        basePrice: 15000,
        unit: "pièce"
      },
      impression_textile: {
        label: "Impression Textile",
        description: "Flocage professionnel ou sublimation sur textile (T-shirt de sport, maillots, casquettes, etc.).",
        basePrice: 3500,
        unit: "pièce"
      },
      impression_tasse: {
        label: "Impression sur Tasse / Mug",
        description: "Mugs personnalisés thermoréactifs ou classiques pour cadeaux d'entreprise ou événements spécifiques.",
        basePrice: 2500,
        unit: "pièce"
      },
      photo_identite: {
        label: "Photo d'Identité",
        description: "Prises de vue et tirages de clichés d'identités conformes aux normes préfectorales et d'ambassades.",
        basePrice: 1500,
        unit: "tirage"
      },
      autocollant_pub: {
        label: "Publicité Autocollants",
        description: "Impression sur vinyle adhésif adéquat malléable pour vitrines, murs ou véhicules avec pose soignée.",
        basePrice: 3000,
        unit: "m²"
      },
      documents_ligne: {
        label: "Documents & Publications",
        description: "Mise en page de mémoires d'étudiants, rapports d'activité, documents de recherche et aide à la publication.",
        basePrice: 1500,
        unit: "page"
      },
      formation_bureautique: {
        label: "Formation Secrétariat Bureautique",
        description: "Formation de secrétaire bureautique certifiante, apprentissage de Word, Excel et PowerPoint pro.",
        basePrice: 45000,
        unit: "session"
      },
      formation_graphisme: {
        label: "Formation Graphisme PAO",
        description: "Formation de concepteur graphiste assisté complet sur la suite infographique (Photoshop, Illustrator, InDesign).",
        basePrice: 60000,
        unit: "session"
      },
      autre: {
        label: "Autre Prestation",
        description: "Travaux d'impression, reprographie, reliure ou secrétariat numérique spécifiques à la demande.",
        basePrice: 5000,
        unit: "devis"
      }
    };

    const promises = Object.entries(OFFICIAL_SERVICES).map(async ([type, s]) => {
      const docRef = doc(db, 'services', type);
      return setDoc(docRef, {
        id: type,
        label: s.label,
        description: s.description,
        basePrice: s.basePrice,
        unit: s.unit,
        createdAt: Timestamp.now()
      });
    });
    
    await Promise.all(promises);
    await setDoc(appSettingsRef, { servicesSeedDone: true, seededAt: Timestamp.now() }, { merge: true });
    return true;

  } catch (error) {
    console.error("Erreur de seeding des services Firestore:", error);
    return false;
  }
}

/**
 * Checks if the services collection is empty to toggle the setup button
 */
export async function isServicesCollectionEmpty(): Promise<boolean> {
  try {
    const appSettingsRef = doc(db, 'settings', 'app');
    const settingsSnap = await getDoc(appSettingsRef);
    if (settingsSnap.exists() && settingsSnap.data()?.servicesSeedDone === true) {
      return false;
    }
    
    const servicesSnap = await getDocs(collection(db, 'services'));
    return servicesSnap.empty;
  } catch (e) {
    console.error(e);
    return true;
  }
}

// ─── BRANCHES ───────────────────────────────────────

export async function getBranches(): Promise<Branch[]> {
  try {
    const branchesRef = collection(db, 'branches');
    const q = query(branchesRef, where('active', '==', true), orderBy('sortOrder', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch));
  } catch (error) {
    console.error("Erreur getBranches:", error);
    throw error;
  }
}

export async function createBranch(branchData: Omit<Branch, 'id' | 'createdAt'>): Promise<Branch> {
  try {
    const branchId = `annexe_${Date.now()}`;
    const newBranch: Branch = {
      id: branchId,
      ...branchData,
      createdAt: Timestamp.now()
    };
    await setDoc(doc(db, 'branches', branchId), newBranch);
    return newBranch;
  } catch (error) {
    console.error("Erreur createBranch:", error);
    throw error;
  }
}

export async function updateBranch(branchId: string, updates: Partial<Branch>): Promise<void> {
  try {
    const branchRef = doc(db, 'branches', branchId);
    await updateDoc(branchRef, updates);
  } catch (error) {
    console.error("Erreur updateBranch:", error);
    throw error;
  }
}

export async function deleteBranch(branchId: string): Promise<void> {
  try {
    const branchRef = doc(db, 'branches', branchId);
    await updateDoc(branchRef, { active: false });
  } catch (error) {
    console.error("Erreur deleteBranch:", error);
    throw error;
  }
}

export async function getBranchById(branchId: string): Promise<Branch | null> {
  try {
    const branchRef = doc(db, 'branches', branchId);
    const snap = await getDoc(branchRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Branch;
    }
    return null;
  } catch (error) {
    console.error("Erreur getBranchById:", error);
    throw error;
  }
}

export async function seedBranches(): Promise<void> {
  try {
    const appSettingsRef = doc(db, 'settings', 'branches_app');
    const settingsSnap = await getDoc(appSettingsRef);
    if (settingsSnap.exists() && settingsSnap.data()?.branchesSeedDone === true) {
      return;
    }

    const branchesRef = collection(db, 'branches');
    const branchesSnap = await getDocs(branchesRef);
    if (!branchesSnap.empty) {
      await setDoc(appSettingsRef, { branchesSeedDone: true }, { merge: true });
      return;
    }

    const INITIAL_BRANCHES: Branch[] = [
      {
        id: "annexe_1",
        name: "Siège 1 — Kansounkpa",
        shortName: "S1",
        address: "Face au CEG Kansounkpa, Abomey-Calavi",
        phone: "+229 0196100789",
        active: true,
        sortOrder: 1,
        createdAt: Timestamp.now()
      },
      {
        id: "annexe_2",
        name: "Siège 2 — Pavé Kérékou",
        shortName: "S2",
        address: "À côté du marché Tanto, Pavé Kérékou",
        phone: "+229 0196100789",
        active: true,
        sortOrder: 2,
        createdAt: Timestamp.now()
      },
      {
        id: "annexe_3",
        name: "Siège 3 — Kpodji les Monts",
        shortName: "S3",
        address: "Kpodji les Monts",
        phone: "+229 0196100789",
        active: true,
        sortOrder: 3,
        createdAt: Timestamp.now()
      }
    ];

    const promises = INITIAL_BRANCHES.map(b => {
      return setDoc(doc(db, 'branches', b.id), b);
    });

    await Promise.all(promises);
    await setDoc(appSettingsRef, { branchesSeedDone: true, seededAt: Timestamp.now() }, { merge: true });
  } catch (error) {
    console.error("Erreur de seeding des branches:", error);
    throw error;
  }
}

export async function renameBranchesInFirestore(): Promise<void> {
  const updates = [
    { id: 'annexe_1', name: 'Siège 1 — Kansounkpa', shortName: 'S1' },
    { id: 'annexe_2', name: 'Siège 2 — Pavé Kérékou', shortName: 'S2' },
    { id: 'annexe_3', name: 'Siège 3 — Kpodji les Monts', shortName: 'S3' },
  ];
  const batch = writeBatch(db);
  updates.forEach(({ id, name, shortName }) => {
    batch.update(doc(db, 'branches', id), { name, shortName });
  });
  await batch.commit();
}

// ─── COMMANDES PAR BRANCHE ──────────────────────────

export function subscribeOrdersByBranch(
  branchId: string,
  callback: (orders: Order[]) => void
): Unsubscribe {
  const ordersRef = collection(db, 'orders');
  const q = query(
    ordersRef,
    where('branchId', '==', branchId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const orders: Order[] = [];
    snapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() } as Order);
    });
    callback(orders);
  }, (error) => {
    console.error(`Erreur subscribeOrdersByBranch ${branchId}:`, error);
  });
}

export function subscribeAllOrders(
  callback: (orders: Order[]) => void
): Unsubscribe {
  const ordersRef = collection(db, 'orders');
  const q = query(
    ordersRef,
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const orders: Order[] = [];
    snapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() } as Order);
    });
    callback(orders);
  }, (error) => {
    console.error("Erreur subscribeAllOrders:", error);
  });
}

// ─── GESTION ÉQUIPE ─────────────────────────────────

export async function createStaffAccount(data: {
  uid?: string;
  email: string;
  displayName: string;
  phone: string;
  branchId: string;
}): Promise<void> {
  try {
    const usersRef = collection(db, 'users');
    const newStaffDoc = data.uid ? doc(usersRef, data.uid) : doc(usersRef);
    const staffUser: AppUser = {
      uid: newStaffDoc.id,
      email: data.email,
      displayName: data.displayName,
      phone: data.phone,
      role: 'chef_point',
      branchId: data.branchId,
      active: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    await setDoc(newStaffDoc, staffUser);
  } catch (error) {
    console.error("Erreur createStaffAccount:", error);
    throw error;
  }
}

export async function getStaffAccounts(): Promise<AppUser[]> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', 'in', ['chef_point', 'super_admin']));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as AppUser));
  } catch (error) {
    console.error("Erreur getStaffAccounts:", error);
    throw error;
  }
}

export async function toggleStaffActive(uid: string, active: boolean): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      active,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error("Erreur toggleStaffActive:", error);
    throw error;
  }
}

export async function createNotificationForRole(
  role: string,
  notificationData: { type: string; title: string; message: string; orderId?: string }
): Promise<void> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', role));
    const usersSnap = await getDocs(q);
    const notifyPromises: Promise<string>[] = [];
    usersSnap.forEach((userDoc) => {
      notifyPromises.push(
        createNotification({
          userId: userDoc.id,
          type: notificationData.type as any,
          title: notificationData.title,
          message: notificationData.message,
          orderId: notificationData.orderId,
          read: false
        })
      );
    });
    await Promise.all(notifyPromises);
  } catch (err) {
    console.warn("Erreur createNotificationForRole:", err);
  }
}

/**
 * Créer une commande manuelle (physique au comptoir)
 * Statut initial fixé d'office sur "En production" et paymentStatus sur "Non payé"
 */
export async function createManualOrder(
  orderData: {
    serviceType: ServiceType;
    description: string;
    dimensions?: { width: number; height: number; unit: 'cm' | 'm' };
    quantity: number;
    walkInClientName: string;
    walkInClientPhone: string;
    walkInClientCompany?: string;
    manualOrderNote?: string;
    amount?: number;
  },
  createdBy: { uid: string; name: string; branchId: string; branchName: string }
): Promise<string> {
  const ordersRef = collection(db, 'orders');
  const allOrdersSnap = await getDocs(ordersRef);
  const nextNum = String(allOrdersSnap.size + 1).padStart(3, '0');
  const orderNumber = `LMS-${new Date().getFullYear()}-${nextNum}`;

  const defaultDimensions = orderData.dimensions || { width: 0, height: 0, unit: 'cm' as const };

  const newOrderDoc = doc(ordersRef);
  const orderId = newOrderDoc.id;

  const finalOrder: Order = {
    id: orderId,
    orderNumber,
    clientId: createdBy.uid,
    clientName: orderData.walkInClientName,
    clientEmail: 'walkin@lemenuservice.com',
    serviceType: orderData.serviceType,
    description: orderData.description,
    dimensions: defaultDimensions,
    quantity: orderData.quantity,
    fileUrls: [],
    fileNames: [],
    status: 'En production',
    paymentStatus: 'Non payé',
    isManualOrder: true,
    walkInClientName: orderData.walkInClientName,
    walkInClientPhone: orderData.walkInClientPhone,
    walkInClientCompany: orderData.walkInClientCompany || '',
    manualOrderNote: orderData.manualOrderNote || '',
    branchId: createdBy.branchId,
    assignedBranchId: createdBy.branchId,
    branchName: createdBy.branchName,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };

  await setDoc(newOrderDoc, finalOrder);

  if (orderData.amount && orderData.amount > 0) {
    const quotesRef = collection(db, 'quotes');
    const newQuoteDoc = doc(quotesRef);
    const quoteId = newQuoteDoc.id;

    await setDoc(newQuoteDoc, {
      id: quoteId,
      orderId: orderId,
      clientId: createdBy.uid,
      adminId: createdBy.uid,
      amount: orderData.amount,
      description: `Devis automatique pour commande physique: ${orderData.serviceType}`,
      deliveryDays: 1,
      validUntil: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
      status: 'accepted',
      createdAt: Timestamp.now(),
      respondedAt: Timestamp.now()
    });

    const historyRef = collection(db, 'orders', orderId, 'history');
    const histDoc1 = doc(historyRef);
    await setDoc(histDoc1, {
      id: histDoc1.id,
      status: 'Devis accepté',
      changedAt: Timestamp.now(),
      changedBy: createdBy.uid,
      note: `Devis de ${orderData.amount.toLocaleString('fr-BJ')} XOF accepté automatiquement à la création.`
    });
  }

  const historyRef = collection(db, 'orders', orderId, 'history');
  const histDoc2 = doc(historyRef);
  await setDoc(histDoc2, {
    id: histDoc2.id,
    status: 'Nouveau',
    changedAt: Timestamp.now(),
    changedBy: createdBy.uid,
    note: `Commande physique enregistrée par ${createdBy.name}. Lancée directement en production.`
  });

  try {
    await notifyProsForOrder(orderId, createdBy.branchId, {
      type: 'new_order',
      title: '🔌 Nouvelle commande physique',
      message: `Commande physique #${orderNumber} pour ${orderData.walkInClientName} enregistrée par ${createdBy.name}.`
    });
  } catch (err) {
    console.warn("Error notifying pros for manual order:", err);
  }

  return orderId;
}

export interface ReportData {
  period: { start: Date; end: Date };
  branchId: string | 'all';
  totalOrders: number;
  digitalOrders: number;
  manualOrders: number;
  ordersDelivered: number;
  ordersInProgress: number;
  ordersCancelled: number;
  totalRevenuePaid: number;
  totalRevenuePending: number;
  ordersNotPaid: number;
  topServices: Array<{
    serviceType: string;
    label: string;
    count: number;
    revenue: number;
  }>;
  byBranch?: Array<{
    branchId: string;
    branchName: string;
    shortName: string;
    totalOrders: number;
    delivered: number;
    revenuePaid: number;
    revenuePending: number;
  }>;
  newClients: number;
  orders?: Order[];
  quotes?: Quote[];
}

/**
 * Génère le rapport d'activité périodique consolidé pour M. ADOGBA
 */
export async function generateReport(
  branchId: string | 'all',
  startDate: Date,
  endDate: Date
): Promise<ReportData> {
  const startTm = Timestamp.fromDate(startDate);
  const endTm = Timestamp.fromDate(endDate);

  const ordersRef = collection(db, 'orders');
  const ordersQuery = query(
    ordersRef,
    where('createdAt', '>=', startTm),
    where('createdAt', '<=', endTm)
  );
  const ordersSnap = await getDocs(ordersQuery);
  const allOrders = ordersSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Order));

  const filteredOrders = allOrders.filter(o => {
    if (branchId === 'all') return true;
    return o.assignedBranchId === branchId || o.branchId === branchId;
  });

  const quotesRef = collection(db, 'quotes');
  const quotesQuery = query(
    quotesRef,
    where('createdAt', '>=', startTm),
    where('createdAt', '<=', endTm)
  );
  const quotesSnap = await getDocs(quotesQuery);
  const allQuotes = quotesSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Quote));

  const orderMap = new Map<string, Order>();
  allOrders.forEach(o => {
    if (o.id) orderMap.set(o.id, o);
  });

  const cacheOrder = async (orderId: string): Promise<Order | undefined> => {
    if (orderMap.has(orderId)) return orderMap.get(orderId);
    try {
      const oDoc = await getDoc(doc(db, 'orders', orderId));
      if (oDoc.exists()) {
        const ord = { id: oDoc.id, ...oDoc.data() } as Order;
        orderMap.set(orderId, ord);
        return ord;
      }
    } catch (err) {
      console.warn("Error fetching missing order for quote:", orderId, err);
    }
    return undefined;
  };

  const usersRef = collection(db, 'users');
  const usersQuery = query(
    usersRef,
    where('createdAt', '>=', startTm),
    where('createdAt', '<=', endTm)
  );
  const usersSnap = await getDocs(usersQuery);
  const newClients = usersSnap.docs.filter(uDoc => uDoc.data().role === 'client').length;

  let totalOrders = filteredOrders.length;
  let digitalOrders = 0;
  let manualOrders = 0;
  let ordersDelivered = 0;
  let ordersInProgress = 0;
  let ordersCancelled = 0;

  filteredOrders.forEach(o => {
    if (o.isManualOrder) {
      manualOrders++;
    } else {
      digitalOrders++;
    }

    if (o.status === 'Livré') {
      ordersDelivered++;
    } else if (o.status === 'Annulé') {
      ordersCancelled++;
    } else {
      ordersInProgress++;
    }
  });

  let totalRevenuePaid = 0;
  let totalRevenuePending = 0;

  for (const q of allQuotes) {
    if (q.status === 'accepted') {
      const o = await cacheOrder(q.orderId);
      if (o) {
        const matchesBranch = branchId === 'all' || o.assignedBranchId === branchId || o.branchId === branchId;
        if (matchesBranch) {
          if (o.paymentStatus === 'Payé') {
            totalRevenuePaid += q.amount;
          } else {
            totalRevenuePending += q.amount;
          }
        }
      }
    }
  }

  const ordersNotPaid = filteredOrders.filter(o => 
    (o.status === 'Prêt' || o.status === 'Livré') && o.paymentStatus !== 'Payé'
  ).length;

  const serviceStats: Record<string, { count: number; revenue: number }> = {};
  filteredOrders.forEach(o => {
    if (!serviceStats[o.serviceType]) {
      serviceStats[o.serviceType] = { count: 0, revenue: 0 };
    }
    serviceStats[o.serviceType].count++;
  });

  for (const q of allQuotes) {
    if (q.status === 'accepted') {
      const o = await cacheOrder(q.orderId);
      if (o) {
        const matchesBranch = branchId === 'all' || o.assignedBranchId === branchId || o.branchId === branchId;
        if (matchesBranch) {
          if (!serviceStats[o.serviceType]) {
            serviceStats[o.serviceType] = { count: 0, revenue: 0 };
          }
          serviceStats[o.serviceType].revenue += q.amount;
        }
      }
    }
  }

  const topServices = Object.entries(serviceStats).map(([serviceType, stats]) => {
    return {
      serviceType,
      label: SERVICE_LABELS[serviceType as ServiceType] || serviceType,
      count: stats.count,
      revenue: stats.revenue
    };
  })
  .sort((a, b) => b.revenue - a.revenue || b.count - a.count)
  .slice(0, 5);

  let byBranch: ReportData['byBranch'] = undefined;
  if (branchId === 'all') {
    const branches = await getBranches();
    const branchStatsMap = new Map<string, { 
      branchId: string; 
      branchName: string; 
      shortName: string;
      totalOrders: number; 
      delivered: number; 
      revenuePaid: number; 
      revenuePending: number; 
    }>();

    branches.forEach(b => {
      branchStatsMap.set(b.id, {
        branchId: b.id,
        branchName: b.name,
        shortName: b.shortName,
        totalOrders: 0,
        delivered: 0,
        revenuePaid: 0,
        revenuePending: 0
      });
    });

    allOrders.forEach(o => {
      const bId = o.assignedBranchId || o.branchId;
      if (bId && branchStatsMap.has(bId)) {
        const stats = branchStatsMap.get(bId)!;
        stats.totalOrders++;
        if (o.status === 'Livré') {
          stats.delivered++;
        }
      }
    });

    for (const q of allQuotes) {
      if (q.status === 'accepted') {
        const o = await cacheOrder(q.orderId);
        if (o) {
          const bId = o.assignedBranchId || o.branchId;
          if (bId && branchStatsMap.has(bId)) {
            const stats = branchStatsMap.get(bId)!;
            if (o.paymentStatus === 'Payé') {
              stats.revenuePaid += q.amount;
            } else {
              stats.revenuePending += q.amount;
            }
          }
        }
      }
    }

    byBranch = Array.from(branchStatsMap.values());
  }

  return {
    period: { start: startDate, end: endDate },
    branchId,
    totalOrders,
    digitalOrders,
    manualOrders,
    ordersDelivered,
    ordersInProgress,
    ordersCancelled,
    totalRevenuePaid,
    totalRevenuePending,
    ordersNotPaid,
    topServices,
    byBranch,
    newClients,
    orders: filteredOrders,
    quotes: allQuotes
  };
}