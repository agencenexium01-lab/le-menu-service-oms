import { Order } from '../../types';

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

export async function askOrderGuide(userMessage: string, currentFormData: Partial<Order>): Promise<string> {
  try {
    const response = await fetch('/api/gemini/ask-guide', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userMessage, currentFormData }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Impossible d'obtenir une réponse de l'assistant.");
    }

    const data = await response.json();
    return data.reply || "Désolé, je ne parviens pas à traiter votre demande actuellement.";
  } catch (error: any) {
    console.error("Erreur dans askOrderGuide:", error);
    throw new Error(error.message || "La communication avec l'assistant a échoué.");
  }
}

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
    // Return a warning status for gracefully handling in UI
    return {
      status: 'warning',
      issues: ["Analyse IA temporairement indisponible."],
      recommendations: ["Veuillez faire un contrôle visuel manuel de ce fichier."]
    };
  }
}

