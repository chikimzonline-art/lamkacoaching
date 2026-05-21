/**
 * Helper to call Google Gemini API (gemini-2.5-flash) using standard fetch.
 * Fully compatible with serverless, edge, and standard Next.js runtimes.
 */
export async function callGeminiAPI(payload: {
  contents: { role: 'user' | 'model'; parts: { text: string }[] }[];
  systemInstruction?: { parts: { text: string }[] };
  generationConfig?: {
    responseMimeType?: 'application/json' | 'text/plain';
    responseSchema?: any;
    temperature?: number;
  };
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not defined.');
  }

  // Define candidate models in preference order
  const modelsToTry = [
    'gemma-4-31b-it',
    'gemma-4-26b-a4b-it',
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash'
  ];

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      // Inject the model used in the response so endpoints can trace it if needed
      if (data) {
        data._usedModel = model;
      }
      
      return data;
    } catch (err: any) {
      console.warn(`[callGeminiAPI] Model ${model} failed, trying next... Error:`, err.message || err);
      lastError = err;
    }
  }

  throw new Error(`All Gemini API models failed. Last error: ${lastError?.message || lastError}`);
}

/**
 * Extracts clean, non-thought text from a Gemini/Gemma API response.
 * Filters out thought/reasoning blocks which are returned by models like Gemma 4 31B.
 */
export function extractTextFromResponse(result: any): string {
  const parts = result?.candidates?.[0]?.content?.parts;
  if (!parts) return '';

  // Filter out thinking/reasoning parts
  const nonThoughtParts = parts.filter((p: any) => !p.thought);
  if (nonThoughtParts.length > 0) {
    return nonThoughtParts.map((p: any) => p.text).join('\n');
  }

  // Fallback to first part if everything was filtered
  return parts[0]?.text || '';
}
