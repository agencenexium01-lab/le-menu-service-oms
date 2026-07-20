import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, QueryConstraint } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { Order } from '../types';

export interface OrderFilters {
  branchId?: string;       // 'all' ou ID spécifique (ex: siege_1)
  status?: string;         // 'all' ou Nouveau, En production, Prêt, etc.
  source?: 'en_ligne' | 'physique';
  paymentStatus?: 'Payé' | 'Non payé';
}

/**
 * Custom Hook useOrders amélioré pour la conformité OMS Le Menu Service
 * Gère le cloisonnement par rôle et les filtres multicritères en temps réel.
 */
export function useOrders(userRole: 'super_admin' | 'chef_point' | 'client', userBranchId?: string, clientId?: string) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // État des filtres (utilisé principalement par le Propriétaire et les Chefs de siège)
  const [filters, setFilters] = useState<OrderFilters>({
    branchId: userRole === 'chef_point' ? userBranchId : 'all',
    status: 'all'
  });

  useEffect(() => {
    setLoading(true);
    const ordersRef = collection(db, 'orders');
    
    // Contraintes de base : toujours trier par date décroissante
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
    
    // 1. GESTION DES CLOISONNEMENTS PAR RÔLE
    if (userRole === 'client' && clientId) {
      constraints.push(where('clientId', '==', clientId));
    } 
    else if (userRole === 'chef_point') {
      // Sécurité stricte : Isolation totale obligatoire pour le chef de siège
      if (userBranchId) {
        constraints.push(where('branchId', '==', userBranchId));
      } else {
        setOrders([]);
        setLoading(false);
        return;
      }
    } 
    else if (userRole === 'super_admin') {
      // Le propriétaire peut choisir de filtrer par un siège en particulier
      if (filters.branchId && filters.branchId !== 'all') {
        constraints.push(where('branchId', '==', filters.branchId));
      }
    }

    // 2. APPLICATION DES FILTRES DE RECHERCHE DYNAMIQUES
    if (filters.status && filters.status !== 'all') {
      constraints.push(where('status', '==', filters.status));
    }
    if (filters.source) {
      constraints.push(where('source', '==', filters.source));
    }
    if (filters.paymentStatus) {
      constraints.push(where('paymentStatus', '==', filters.paymentStatus));
    }

    // Exécution de la requête temps réel
    const q = query(ordersRef, ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: Order[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() } as Order);
        });
        setOrders(items);
        setLoading(false);
      },
      (err) => {
        console.error("Erreur de synchronisation Firestore des commandes:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userRole, userBranchId, clientId, filters]);

  // AJOUT : Action de réassignation (Réservé au Propriétaire)
  const reassignOrder = async (orderId: string, newBranchId: string) => {
    if (userRole !== 'super_admin') {
      throw new Error("Action non autorisée. Seul le propriétaire peut réassigner des commandes.");
    }
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { branchId: newBranchId });
    } catch (err) {
      console.error("Erreur lors de la réassignation de la commande:", err);
      throw err;
    }
  };

  // AJOUT : Action de validation de paiement physique au comptoir
  const validatePayment = async (orderId: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { paymentStatus: 'Payé' });
    } catch (err) {
      console.error("Erreur lors de la validation du paiement:", err);
      throw err;
    }
  };

  return { 
    orders, 
    loading, 
    error, 
    filters, 
    setFilters, 
    reassignOrder, 
    validatePayment 
  };
}