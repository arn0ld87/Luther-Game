import { GoogleGenAI, Type } from "@google/genai";
import { ImageSize } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Fast check using Gemini 2.5 Flash Lite
 * Checks if a user's typed argument aligns with Luther's theology.
 */
export const checkTheologicalArgument = async (userArgument: string, context: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite-latest', // Fast AI responses
      contents: `
        Du bist Martin Luther. Ein Schüler antwortet auf eine theologische Frage zu Matthäus 7,21.
        Kontext: ${context}
        Schüler-Antwort: "${userArgument}"
        
        Analysiere kurz (max 2 Sätze): Ist das im Sinne der Rechtfertigungslehre (Sola Gratia)?
        Antworte im Format:
        {"isLutheran": boolean, "feedback": "string"}
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isLutheran: { type: Type.BOOLEAN },
            feedback: { type: Type.STRING },
          },
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Flash Lite Error:", error);
    return { isLutheran: false, feedback: "Der Geist ist willig, aber die Verbindung ist schwach." };
  }
};

/**
 * Deep theological explanation using Gemini 3 Pro with Thinking
 */
export const askLutherDeepDive = async (question: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Think more when needed
      contents: `Erkläre als Theologieprofessorin Frau Jana Zwarg (aber im Geiste Luthers) folgende Frage für eine 12. Klasse: "${question}". Beziehe dich auf Matthäus 7,21, Erasmus von Rotterdam und die Unterscheidung von Gesetz und Evangelium.`,
      config: {
        thinkingConfig: { thinkingBudget: 32768 }, // High thinking budget
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Pro Thinking Error:", error);
    return "Meine Gedanken sind tief, aber gerade unergründlich. Versuche es später erneut.";
  }
};

/**
 * Generate a texture/image using Gemini 3 Pro Image Preview
 */
export const generateGameAsset = async (prompt: string, size: ImageSize) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview', // Generate images with Nano Banana Pro
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          imageSize: size,
          aspectRatio: "1:1"
        }
      }
    });
    
    // Find image part
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    return null;
  }
};

/**
 * Edit an existing texture using Gemini 2.5 Flash Image
 */
export const editGameTexture = async (base64Image: string, instruction: string) => {
  try {
    // Strip prefix if present
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Nano banana powered app
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: cleanBase64
            }
          },
          { text: instruction }
        ]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Gemini Image Edit Error:", error);
    return null;
  }
};