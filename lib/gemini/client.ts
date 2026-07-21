import { GoogleGenerativeAI } from "@google/generative-ai";
import { Order } from '../../types';

// Initialisation du client SDK Gemini avec la clé d'environnement
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// Modèle réutilisable pour l'assistant
const guideModel = genAI.getGenerativeModel({
  model: "gemini-flash-latest", 
  systemInstruction: "Tu es un assistant virtuel expert en impression grand format pour 'Le Menu Service'. Aide les clients à choisir les bons matériaux (bâche, vinyle, dibond, etc.), finitions et dimensions en fonction de leur projet."
});

/**
 * [Nouveau] Assistant Virtuel Gemini en Mode Streaming (temps réel)
 */
export async function* askOrderGuideStream(prompt: string, formData: Partial<Order>) {
  try {
    const fullPrompt = `
Formulaire actuel complété par le client :
${JSON.stringify(formData, null, 2)}

Question/Message du client :
${prompt}
    `;

    const result = await guideModel.generateContentStream(fullPrompt);

    for await (const chunk of result.stream) {
      yield chunk.text();
    }
  } catch (error: any) {
    console.error("Erreur dans askOrderGuideStream:", error);
    yield "Désolé, une erreur s'est produite lors de la génération de la réponse.";
  }
}

/**
 * Pose une question à l'assistant guide de commande (Mode classique sans streaming)
 */
export async function askOrderGuide(userMessage: string, currentFormData: Partial<Order>): Promise<string> {
  try {
    const fullPrompt = `
Formulaire actuel complété par le client :
${JSON.stringify(currentFormData, null, 2)}

Question/Message du client :
${userMessage}
    `;

    const result = await guideModel.generateContent(fullPrompt);
    const response = await result.response;
    return response.text() || "Désolé, je ne parviens pas à traiter votre demande actuellement.";
  } catch (error: any) {
    console.error("Erreur dans askOrderGuide:", error);
    throw new Error(error.message || "La communication avec l'assistant a échoué.");
  }
}

/**
 * Propose une suggestion de prix basée sur les détails de la commande
 */
export async function suggestQuotePrice(order: Order): Promise<{ suggestedPrice: number; reasoning: string }> {
  try {
    const response = await fetch('/api/gemini/suggest-price', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ order }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Impossible d'obtenir une suggestion IA.");
    }

    const data = await response.json();
    return {
      suggestedPrice: typeof data.suggestedPrice === 'number' ? data.suggestedPrice : parseInt(data.suggestedPrice) || 0,
      reasoning: data.reasoning || "Calculé d'après la grille de l'Atelier Le Menu Service."
    };
  } catch (error: any) {
    console.error("Erreur dans suggestQuotePrice:", error);
    throw new Error(error.message || "La suggestion IA a échoué.");
  }
}

/**
 * Analyse un fichier téléversé par le client
 */
export async function analyzeUploadedFile(
  fileUrl: string,
  fileName: string,
  orderDimensions: { width: number; height: number; unit: string }
): Promise<{ status: 'ok' | 'warning' | 'error'; issues: string[]; recommendations: string[] }> {
  try {
    const response = await fetch('/api/gemini/analyze-file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileUrl, fileName, orderDimensions }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Impossible d'analyser le fichier.");
    }

    return await response.json();
  } catch (error: any) {
    console.error("Erreur dans analyzeUploadedFile:", error);
    return {
      status: 'warning',
      issues: ["Analyse IA temporairement indisponible."],
      recommendations: ["Veuillez faire un contrôle visuel manuel de ce fichier."]
    };
  }
}