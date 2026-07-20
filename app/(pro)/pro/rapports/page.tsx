'use client';

import React, { useState } from 'react';
import { aggregateStats } from '@/lib/firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ReportsPage() {
  const [range, setRange] = useState({ start: '', end: '' });
  const [branch, setBranch] = useState('all');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!range.start || !range.end) return alert('Veuillez sélectionner les dates.');
    setLoading(true);
    const stats = await aggregateStats(new Date(range.start), new Date(range.end), branch);
    setData(stats);
    setLoading(false);
  };

  const exportToCSV = () => {
    if (!data) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Metrique,Valeur\n";
    csvContent += `Commandes Totales,${data.totalOrders}\n`;
    csvContent += `Commandes Actives,${data.activeOrders}\n`;
    csvContent += `CA Encaisse (FCFA),${data.revenueEncashed}\n`;
    csvContent += `CA En Attente (FCFA),${data.revenuePending}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rapport_LeMenuService_${range.start}_a_${range.end}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = data ? Object.entries(data.serviceDistribution).map(([name, val]) => ({ name, Quantite: val })) : [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Génération de Rapports d'Activité</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg shadow-sm">
        <div>
          <label className="block text-sm font-medium mb-1">Date Début</label>
          <input type="date" className="w-full border rounded p-2" onChange={e => setRange({...range, start: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date Fin</label>
          <input type="date" className="w-full border rounded p-2" onChange={e => setRange({...range, end: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Siège</label>
          <select className="w-full border rounded p-2" value={branch} onChange={e => setBranch(e.target.value)}>
            <option value="all">Tous les sièges</option>
            <option value="siege_1">Siège 1 (Calavi)</option>
            <option value="siege_2">Siège 2</option>
            <option value="siege_3">Siège 3</option>
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={handleGenerate} className="w-full bg-blue-600 text-white rounded p-2 font-medium hover:bg-blue-700">
            {loading ? 'Calcul...' : 'Générer'}
          </button>
        </div>
      </div>

      {data && (
        <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Résultats consolidés</h2>
            <button onClick={exportToCSV} className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700">
              Exporter en CSV
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-500">Commandes</p>
              <p className="text-2xl font-bold">{data.totalOrders}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-500">Actives</p>
              <p className="text-2xl font-bold text-blue-600">{data.activeOrders}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-500">CA Encaissé</p>
              <p className="text-2xl font-bold text-emerald-600">{data.revenueEncashed} FCFA</p>
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-500">En attente</p>
              <p className="text-2xl font-bold text-amber-600">{data.revenuePending} FCFA</p>
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            <p className="text-sm font-medium mb-2 text-gray-700">Répartition par type de service</p>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Quantite" fill="#3b82f6" name="Nombre de commandes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}