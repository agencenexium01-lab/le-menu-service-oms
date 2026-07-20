import { useState, useEffect } from 'react';
import { Branch } from '../types';
import { getBranches } from '../lib/firebase/firestore';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/config';

/**
 * Hook qui charge la liste des branches actives.
 */
export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    async function loadBranches() {
      try {
        setLoading(true);
        const data = await getBranches();
        if (active) {
          setBranches(data);
        }
      } catch (err) {
        console.error("Erreur de récupération des branches dans useBranches:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    loadBranches();
    return () => {
      active = false;
    };
  }, []);

  // AJOUT : Permettre au Propriétaire de modifier un siège (Nom, Téléphone, Localisation)
  const updateBranch = async (branchId: string, updates: Partial<Omit<Branch, 'id'>>) => {
    try {
      setUpdating(true);
      const branchRef = doc(db, 'branches', branchId);
      await updateDoc(branchRef, updates);
      
      // Mettre à jour l'état local
      setBranches(prev => prev.map(b => b.id === branchId ? { ...b, ...updates } : b));
    } catch (err) {
      console.error(`Erreur lors de la mise à jour de la branche ${branchId}:`, err);
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  return { branches, loading, updateBranch, updating };
}

/**
 * Hook pour récupérer UNE branche par ID.
 */
export function useBranch(branchId: string): { branch: Branch | null; loading: boolean } {
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!branchId) {
      setBranch(null);
      setLoading(false);
      return;
    }

    let active = true;
    async function loadBranch() {
      try {
        setLoading(true);
        const branchRef = doc(db, 'branches', branchId);
        const docSnap = await getDoc(branchRef);
        if (active) {
          if (docSnap.exists()) {
            setBranch({ id: docSnap.id, ...docSnap.data() } as Branch);
          } else {
            setBranch(null);
          }
        }
      } catch (err) {
        console.error(`Erreur de récupération de la branche ${branchId}:`, err);
        if (active) {
          setBranch(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    loadBranch();
    return () => {
      active = false;
    };
  }, [branchId]);

  return { branch, loading };
}