import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { orderId, clientPhone, status, branchName } = await request.json();
  
  // Formatage du message pour une notification ou une redirection vers le canal WhatsApp [cite: 61, 147, 158]
  let message = `Le Menu Service : Votre commande n° ${orderId} est passée au statut : ${status}.`;
  if (status === 'Prêt') {
    message = `Le Menu Service : Votre commande n° ${orderId} est prête ! Vous pouvez venir la récupérer au siège : ${branchName}.`;
  }

  // Logique d'intégration SMS locale ou Passerelle WhatsApp tierce à placer ici.
  return NextResponse.json({ success: true, messageSent: message });
}