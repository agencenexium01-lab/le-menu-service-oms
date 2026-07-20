import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, onSnapshot, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  branchId: string;
  role: 'chef_point';
  isActive: boolean;
  createdAt: any;
}

export const useStaff = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'users')); // Filtré par rôle côté client ou via index
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const staffList: StaffMember[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.role === 'chef_point') {
          staffList.push({ id: doc.id, ...data } as StaffMember);
        }
      });
      setStaff(staffList);
      setLoading(false);
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createStaff = async (member: Omit<StaffMember, 'id' | 'createdAt' | 'role' | 'isActive'>) => {
    try {
      // Note : La création d'utilisateur Firebase Auth doit idéalement passer par une Cloud Function 
      // ou être gérée côté admin. Ici, on prépare le document Firestore lié au UID généré.
      const newStaffRef = doc(collection(db, 'users'));
      await setDoc(newStaffRef, {
        ...member,
        role: 'chef_point',
        isActive: true,
        createdAt: serverTimestamp()
      });
    } catch (err: any) {
      throw new Error("Erreur lors de la création du membre d'équipe : " + err.message);
    }
  };

  const toggleStaffStatus = async (staffId: string, currentStatus: boolean) => {
    try {
      const staffRef = doc(db, 'users', staffId);
      await updateDoc(staffRef, { isActive: !currentStatus });
    } catch (err: any) {
      throw new Error("Erreur de modification du statut : " + err.message);
    }
  };

  return { staff, loading, error, createStaff, toggleStaffStatus };
};