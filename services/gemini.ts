import { ImageSize } from '../types';

const API_BASE_URL = '/api';

// Response interfaces for type safety
interface TheologicalResponse {
  isLutheran: boolean;
  feedback: string;
}

const DEFAULT_THEOLOGICAL_ERROR: TheologicalResponse = {
  isLutheran: false,
  feedback: "Der Geist ist willig, aber die Verbindung ist schwach. Bitte versuche es erneut."
};

const DEFAULT_DEEPDIVE_ERROR = "Meine Gedanken sind tief, aber gerade unergründlich. Versuche es später erneut.";

/**
 * Fast check using Backend
 */
export const checkTheologicalArgument = async (
  userArgument: string,
  context: string
): Promise<TheologicalResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/check-theology`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userArgument, context }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error:", error);
    return DEFAULT_THEOLOGICAL_ERROR;
  }
};

/**
 * Deep theological explanation using Backend
 */
export const askLutherDeepDive = async (question: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/deep-dive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    const data = await response.json();
    return data.text || DEFAULT_DEEPDIVE_ERROR;
  } catch (error) {
    console.error("API Error:", error);
    return DEFAULT_DEEPDIVE_ERROR;
  }
};

/**
 * Generate a texture/image using Backend
 */
export const generateGameAsset = async (
  prompt: string,
  size: ImageSize
): Promise<string | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-asset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, size }),
    });
    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error("API Error:", error);
    return null;
  }
};

/**
 * Edit an existing texture using Backend
 */
export const editGameTexture = async (
  base64Image: string,
  instruction: string
): Promise<string | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/edit-asset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Image, instruction }),
    });
    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error("API Error:", error);
    return null;
  }
};
