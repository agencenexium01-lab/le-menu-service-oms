'use client';

import React, { useState, useEffect } from 'react';
import { getStaffAccounts, createStaffAccount, toggleStaffActive, getBranches } from '@/lib/firebase/firestore';
import { User as AppUser, Branch } from '@/types';
import { useStaff } from '@/hooks/useStaff'; // Utilisation du hook CRUD temps réel créé en phase 1

export default function EquipePage() {
  const { staff, loading, error, toggleStaffStatus } = useStaff();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showModal, setShowModal] = useState(false);
  
  // États du formulaire de création
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    branchId: '',
    password: '' // Pour l'enregistrement initial
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Charger les branches pour le sélecteur du formulaire
  useEffect(() => {
    async function loadBranches() {
      try {
        const data = await getBranches();
        setBranches(data);
      } catch (err) {
        console.error("Erreur chargement branches dans Équipe:", err);
      }
    }
    loadBranches();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    if (!formData.branchId) {
      setFormError("Veuillez assigner un siège à ce membre du personnel.");
      setSubmitting(false);
      return;
    }

    try {
      // Étape 1 : Création du compte dans Firebase Authentication via une route d'API dédiée
      // (Pour éviter les conflits de session où l'admin se déconnecte en créant un utilisateur)
      const authResponse = await fetch('/api/staff/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName
        })
      });

      const authData = await authResponse.json();
      if (!authResponse.ok) throw new Error(authData.error || "Erreur Auth");

      // Étape 2 : Enregistrement du profil Chef de Siège synchronisé dans Firestore avec son UID
      await createStaffAccount({
        uid: authData.uid,
        email: formData.email,
        displayName: formData.displayName,
        phone: formData.phone,
        branchId: formData.branchId
      });

      // Réinitialisation
      setShowModal(false);
      setFormData({ displayName: '', email: '', phone: '', branchId: '', password: '' });
    } catch (err: any) {
      setFormError(err.message || "Une erreur est survenue lors du processus.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion de l'Équipe</h1>
          <p className="text-sm text-gray-500">Contrôle des accès des Chefs de Siège pour les 3 annexes du Bénin.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          + Ajouter un Chef de Siège
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">
          Erreur de chargement : {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement des comptes collaborateurs...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="p-4">Nom & Prénom</th>
                <th className="p-4">Email</th>
                <th className="p-4">Téléphone</th>
                <th className="p-4">Siège Assigné</th>
                <th className="p-4">Statut</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {staff.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50/70 transition">
                  <td className="p-4 font-medium text-gray-900">{member.name}</td>
                  <td className="p-4 text-gray-500">{member.email}</td>
                  <td className="p-4">{member.phone || '—'}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-semibold uppercase">
                      {member.branchId}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                      member.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${member.isActive ? 'bg-emerald-600' : 'bg-red-600'}`} />
                      {member.isActive ? 'Actif' : 'Désactivé'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => toggleStaffStatus(member.id, member.isActive)}
                      className={`text-xs font-semibold px-3 py-1 rounded border transition ${
                        member.isActive 
                          ? 'border-red-200 text-red-600 hover:bg-red-50' 
                          : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {member.isActive ? 'Désactiver' : 'Activer'}
                    </button>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-gray-400">Aucun chef de siège enregistré pour le moment.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE CRÉATION DE COMPTE */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-lg font-bold text-gray-900">Nouveau Chef de Siège</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg">{formError}</div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Nom Complet</label>
                <input
                  type="text" required
                  className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ex: Jean HOUNDÉGNON"
                  value={formData.displayName}
                  onChange={e => setFormData({...formData, displayName: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Adresse Email</label>
                <input
                  type="email" required
                  className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="adresse@lemenuservice.com"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Numéro de Téléphone (Bénin)</label>
                <input
                  type="tel" required
                  className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ex: +229 01XXXXXXXX"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Mot de passe Initial</label>
                <input
                  type="password" required minLength={6}
                  className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Siège Rattaché</label>
                <select
                  required
                  className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  value={formData.branchId}
                  onChange={e => setFormData({...formData, branchId: e.target.value})}
                >
                  <option value="">Sélectionner une annexe...</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border text-gray-700 rounded-lg p-2 font-medium hover:bg-gray-50 text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white rounded-lg p-2 font-medium hover:bg-blue-700 text-sm disabled:opacity-50"
                >
                  {submitting ? 'Création...' : 'Créer le compte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}