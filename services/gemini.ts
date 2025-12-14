import { GoogleGenAI, Type } from "@google/genai";
import { ImageSize } from '../types';

// Initialize Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Response interfaces for type safety
interface TheologicalResponse {
  isLutheran: boolean;
  feedback: string;
}

// Default responses for error cases
const DEFAULT_THEOLOGICAL_ERROR: TheologicalResponse = {
  isLutheran: false,
  feedback: "Der Geist ist willig, aber die Verbindung ist schwach. Bitte versuche es erneut."
};

const DEFAULT_DEEPDIVE_ERROR = "Meine Gedanken sind tief, aber gerade unergründlich. Versuche es später erneut.";

/**
 * Safely parses JSON with fallback
 */
const safeJsonParse = <T>(text: string | undefined, fallback: T): T => {
  if (!text) return fallback;
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    console.error("JSON parse error:", error);
    return fallback;
  }
};

/**
 * Validates that a response matches the expected TheologicalResponse shape
 */
const isValidTheologicalResponse = (data: unknown): data is TheologicalResponse => {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return typeof obj.isLutheran === 'boolean' && typeof obj.feedback === 'string';
};

/**
 * Fast check using Gemini 2.5 Flash Lite
 * Checks if a user's typed argument aligns with Luther's theology.
 */
export const checkTheologicalArgument = async (
  userArgument: string,
  context: string
): Promise<TheologicalResponse> => {
  // Input validation
  if (!userArgument?.trim()) {
    return { ...DEFAULT_THEOLOGICAL_ERROR, feedback: "Bitte gib eine Antwort ein." };
  }

  if (userArgument.length > 2000) {
    return { ...DEFAULT_THEOLOGICAL_ERROR, feedback: "Deine Antwort ist zu lang. Fasse dich kürzer." };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite-latest',
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

    const parsed = safeJsonParse<unknown>(response.text, null);

    if (isValidTheologicalResponse(parsed)) {
      return parsed;
    }

    console.warn("Invalid response shape from Gemini:", parsed);
    return DEFAULT_THEOLOGICAL_ERROR;
  } catch (error) {
    console.error("Gemini Flash Lite Error:", error);
    return DEFAULT_THEOLOGICAL_ERROR;
  }
};

/**
 * Deep theological explanation using Gemini 3 Pro with Thinking
 */
export const askLutherDeepDive = async (question: string): Promise<string> => {
  // Input validation
  if (!question?.trim()) {
    return "Bitte stelle eine Frage.";
  }

  if (question.length > 1000) {
    return "Deine Frage ist zu lang. Fasse sie kürzer.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Erkläre als Theologieprofessorin Frau Jana Zwarg (aber im Geiste Luthers) folgende Frage für eine 12. Klasse: "${question}". Beziehe dich auf Matthäus 7,21, Erasmus von Rotterdam und die Unterscheidung von Gesetz und Evangelium.`,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
      }
    });

    const text = response.text?.trim();
    return text || DEFAULT_DEEPDIVE_ERROR;
  } catch (error) {
    console.error("Gemini Pro Thinking Error:", error);
    return DEFAULT_DEEPDIVE_ERROR;
  }
};

/**
 * Extracts base64 image data from Gemini response
 */
const extractImageFromResponse = (response: { candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data: string } }> } }> }): string | null => {
  const parts = response.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;

  for (const part of parts) {
    if (part.inlineData?.data) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

/**
 * Generate a texture/image using Gemini 3 Pro Image Preview
 */
export const generateGameAsset = async (
  prompt: string,
  size: ImageSize
): Promise<string | null> => {
  // Input validation
  if (!prompt?.trim()) {
    console.warn("Empty prompt provided to generateGameAsset");
    return null;
  }

  if (prompt.length > 500) {
    console.warn("Prompt too long for image generation");
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
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

    return extractImageFromResponse(response);
  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    return null;
  }
};

/**
 * Edit an existing texture using Gemini 2.5 Flash Image
 */
export const editGameTexture = async (
  base64Image: string,
  instruction: string
): Promise<string | null> => {
  // Input validation
  if (!base64Image) {
    console.warn("No image provided to editGameTexture");
    return null;
  }

  if (!instruction?.trim()) {
    console.warn("No instruction provided to editGameTexture");
    return null;
  }

  if (instruction.length > 500) {
    console.warn("Instruction too long for image editing");
    return null;
  }

  try {
    // Strip data URI prefix if present
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    // Validate base64 format (basic check)
    if (!/^[A-Za-z0-9+/=]+$/.test(cleanBase64.slice(0, 100))) {
      console.warn("Invalid base64 image data");
      return null;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
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

    return extractImageFromResponse(response);
  } catch (error) {
    console.error("Gemini Image Edit Error:", error);
    return null;
  }
};
