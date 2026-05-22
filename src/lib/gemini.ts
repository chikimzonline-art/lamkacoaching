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
  // Gemma models: 1,500 RPD + unlimited TPM (generous free tier)
  // Gemini models: only 20 RPD + 250K TPM (used as last resort)
  const modelsToTry = [
    'gemma-4-31b-it',
    'gemma-4-26b-a4b-it',
    'gemini-3.1-flash-lite',
  ];

  let lastError: any = null;

  for (const model of modelsToTry) {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        // Construct customized payload for this model
        const modelPayload: any = {
          contents: payload.contents,
        };

        // Gemma models fail with 500 if both systemInstruction and generationConfig are present.
        // Therefore, we omit generationConfig for Gemma models.
        if (payload.generationConfig && !model.startsWith('gemma')) {
          modelPayload.generationConfig = payload.generationConfig;
        }

        if (payload.systemInstruction) {
          modelPayload.systemInstruction = {
            role: 'system',
            parts: payload.systemInstruction.parts,
          };
        }

        // Use AbortController to enforce a 30s timeout per model request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(modelPayload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          // If it's a transient server error, wait and retry
          if (response.status === 500 || response.status === 503) {
            console.warn(`[callGeminiAPI] Model ${model} returned transient error ${response.status} (attempt ${attempts}/${maxAttempts}). Retrying in 1.5s...`);
            await new Promise((resolve) => setTimeout(resolve, 1500));
            continue;
          }
          throw new Error(`Status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        
        // Inject the model used in the response so endpoints can trace it if needed
        if (data) {
          data._usedModel = model;
        }
        
        return data;
      } catch (err: any) {
        lastError = err;
        if (attempts >= maxAttempts) {
          console.warn(`[callGeminiAPI] Model ${model} failed after ${maxAttempts} attempts, trying next model... Error:`, err.message || err);
        } else {
          console.warn(`[callGeminiAPI] Model ${model} failed (attempt ${attempts}/${maxAttempts}). Retrying in 1.5s... Error:`, err.message || err);
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }
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
