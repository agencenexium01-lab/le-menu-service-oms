import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: Request) {
  try {
    const { service, width, height, quantity, description } = await request.json();

    const prompt = `En tant qu'assistant de tarification pour Le Menu Service, une imprimerie numérique grand format au Bénin, calcule un prix juste (en FCFA) pour le service suivant :
    Service: ${service}
    Dimensions: ${width}x${height} cm
    Quantité: ${quantity}
    Détails additionnels: ${description}
    Donne uniquement une estimation chiffrée claire, le délai recommandé en jours ouvrables et une brève justification technique.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return NextResponse.json({ result: response.text });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}