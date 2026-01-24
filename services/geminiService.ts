import { GoogleGenAI, Type, Schema } from "@google/genai";
import { MarketingReport, ModelType, InputMode } from '../types';

// Helper to retrieve the API Key from various possible sources
const getApiKey = (): string | undefined => {
  // 1. Check for Runtime Injection (Cloudflare Worker Strategy)
  // We check if the value exists AND is not the placeholder string
  const runtimeKey = (window as any).RUNTIME_CONFIG?.API_KEY;
  if (runtimeKey && runtimeKey !== '__CLOUDFLARE_RUNTIME_API_KEY__') {
    console.debug("GeminiService: Using Runtime API Key");
    return runtimeKey;
  }

  // 2. Check for Build-Time Injection (Local Dev / Vite .env)
  if (process.env.API_KEY) {
    console.debug("GeminiService: Using Build-time API Key");
    return process.env.API_KEY;
  }

  console.warn("GeminiService: No API Key found. Runtime config:", (window as any).RUNTIME_CONFIG);
  return undefined;
};

// Initialize the client. 
const getAiClient = (keyOverride?: string) => {
  const apiKey = keyOverride || getApiKey();
  
  if (!apiKey) {
     throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    showInfo: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        summary: { type: Type.STRING },
        genre: { type: Type.STRING },
        stars: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["title", "summary", "genre", "stars"],
    },
    audienceProfile: {
      type: Type.OBJECT,
      properties: {
        ageRange: { type: Type.STRING },
        locations: { type: Type.ARRAY, items: { type: Type.STRING } },
        averageIncome: { type: Type.STRING },
        interests: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["ageRange", "locations", "averageIncome", "interests"],
    },
    competitorAnalysis: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          success: { type: Type.STRING },
          reason: { type: Type.STRING },
        },
        required: ["title", "success", "reason"],
      },
    },
    marketingPlan: {
      type: Type.OBJECT,
      properties: {
        adPlacements: { type: Type.STRING },
        socialStrategy: { type: Type.STRING },
        adBuyImplementation: { type: Type.STRING },
        crossPromotionShows: { type: Type.ARRAY, items: { type: Type.STRING } },
        budgetBreakdown: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              percentage: { type: Type.NUMBER },
              tactics: { type: Type.STRING },
            },
            required: ["category", "percentage", "tactics"],
          },
        },
        marketingEvents: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING },
            },
            required: ["title", "description", "category"],
          },
        },
      },
      required: ["adPlacements", "socialStrategy", "adBuyImplementation", "crossPromotionShows", "budgetBreakdown", "marketingEvents"],
    },
    keyArtConcepts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          prompt: { type: Type.STRING },
        },
        required: ["title", "description", "prompt"],
      },
    },
  },
  required: ["showInfo", "audienceProfile", "competitorAnalysis", "marketingPlan", "keyArtConcepts"],
};

// Helper to handle API Key selection flow
const ensureApiKey = async () => {
  // If we have a key from env or runtime, we are good.
  if (getApiKey()) return;

  // If not, and we are in an environment that supports dynamic selection:
  if ((window as any).aistudio && (window as any).aistudio.openSelectKey) {
     const hasKey = await (window as any).aistudio.hasSelectedApiKey();
     if (!hasKey) {
       await (window as any).aistudio.openSelectKey();
     }
     return;
  }
};

export const generateMarketingStrategy = async (
  input: string,
  modelType: ModelType,
  mode: InputMode
): Promise<MarketingReport> => {
  
  // Enforce Paid Key Selection for Advanced Models
  if (modelType === 'pro' || modelType === 'thinking') {
    if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
      }
    }
  }

  // Attempt to resolve key issues if missing
  try {
     getAiClient(); 
  } catch (e: any) {
    if (e.message === 'API_KEY_MISSING') {
      await ensureApiKey();
    }
  }

  // Explicit check before proceeding
  let ai;
  try {
      ai = getAiClient();
  } catch(e) {
      throw new Error("API Key is missing. Please provide it via settings or select a project.");
  }
  
  let modelName = 'gemini-3-flash-preview';
  if (modelType === 'pro' || modelType === 'thinking') {
    modelName = 'gemini-3-pro-image-preview'; // Using Pro Image model for Search capability as per spec
  }

  const tools: any[] = [];
  if (modelType === 'pro' || modelType === 'thinking') {
    tools.push({ googleSearch: {} });
  }

  const thinkingConfig = modelType === 'thinking' ? { thinkingBudget: 32768 } : undefined;

  const systemInstruction = `You are a world-class TV Marketing Executive. 
  Your task is to generate a comprehensive marketing report for a TV show.
  ${mode === 'existing' ? 'Verify facts about the show using Google Search.' : 'This is a new concept. Be creative and inventive.'}
  
  Output MUST be valid JSON matching the schema provided.
  For 'budgetBreakdown', ensure percentages sum to roughly 100.
  For 'keyArtConcepts', provide 3 distinct visual directions with detailed image generation prompts.
  `;

  const prompt = `Generate a marketing strategy for the following ${mode === 'existing' ? 'existing TV show' : 'new TV show concept'}:
  "${input}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        tools: tools.length > 0 ? tools : undefined,
        thinkingConfig: thinkingConfig,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text response from Gemini");

    let data: MarketingReport;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("JSON Parse Error", e);
      throw new Error("Failed to parse AI response as JSON.");
    }

    // Extract grounding URLs if available
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const groundingUrls: string[] = [];
    if (groundingChunks) {
        groundingChunks.forEach((chunk: any) => {
            if (chunk.web?.uri) groundingUrls.push(chunk.web.uri);
        });
    }
    
    // Deduplicate URLs
    data.groundingUrls = Array.from(new Set(groundingUrls));
    data.modelUsed = modelType;

    return data;

  } catch (error: any) {
    if (error.message && (error.message.includes("API_KEY") || error.message.includes("403"))) {
       if ((window as any).aistudio && (window as any).aistudio.openSelectKey) {
         await (window as any).aistudio.openSelectKey();
         // Retry once recursivly or throw specific error asking user to try again
         throw new Error("API Key updated. Please try generating again.");
       }
    }
    throw error;
  }
};

export const generateKeyArtImage = async (prompt: string): Promise<string> => {
  // Always use pro image model for high quality assets
  if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
      }
  }

  // Check key existence
  try { getAiClient(); } 
  catch(e: any) { if (e.message === 'API_KEY_MISSING') await ensureApiKey(); }

  let ai;
  try {
      ai = getAiClient();
  } catch(e) {
      throw new Error("API Key is missing.");
  }

  const modelName = 'gemini-3-pro-image-preview';

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      imageConfig: {
        aspectRatio: "16:9",
        imageSize: "1K", // High quality
      }
    }
  });

  // Extract image
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image generated.");
};