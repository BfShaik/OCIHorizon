import { GoogleGenAI, Type } from "@google/genai";
import { OCIConsumptionRow, ReleaseNote, StrategicInsight } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const summarizeAndMatch = async (
  currentNotes: ReleaseNote[],
  skus: OCIConsumptionRow[]
): Promise<{ notes: ReleaseNote[], groundingSources: any[] }> => {
  if (skus.length === 0) return { notes: currentNotes, groundingSources: [] };

  // Only use Top 10 SKUs for matching to reduce latency and noise
  const topSkus = skus.slice(0, 10);
  const serviceKeywords = [...new Set(topSkus.map(s => s.productName.split(' - ')[0]))].join(", ");

  const searchPrompt = `
    Find OCI Release Notes from docs.oracle.com/en-us/iaas/releasenotes/ for these services: ${serviceKeywords}.
    Return the 5 most recent updates from the last 30 days. Include Title, Date, Service, Summary, and URL.
  `;

  try {
    const searchResponse = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: searchPrompt,
      config: { tools: [{ googleSearch: {} }] }
    });

    const rawSearchData = searchResponse.text;
    const groundingMetadata = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    const structPrompt = `
      Map these release notes to this customer footprint: ${JSON.stringify(topSkus.map(s => s.productName))}.
      Notes: ${rawSearchData}
      Return a JSON array of matched notes with a matchScore (0-100).
    `;

    const structResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: structPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              date: { type: Type.STRING },
              service: { type: Type.STRING },
              summary: { type: Type.STRING },
              url: { type: Type.STRING },
              matchScore: { type: Type.NUMBER }
            },
            required: ["title", "date", "service", "summary", "url", "matchScore"]
          }
        }
      }
    });

    const results = JSON.parse(structResponse.text || "[]");
    return { 
      notes: results.map((res: any, idx: number) => ({
        id: `live-${idx}-${Date.now()}`,
        ...res,
        isRelevant: res.matchScore > 50
      })),
      groundingSources: groundingMetadata 
    };
  } catch (error) {
    console.error("Performance issue in Scraper:", error);
    return { notes: currentNotes, groundingSources: [] };
  }
};

export const generateInsights = async (
  notes: ReleaseNote[],
  skus: OCIConsumptionRow[]
): Promise<StrategicInsight[]> => {
  if (notes.length === 0 || skus.length === 0) return [];

  const prompt = `
    Based on OCI Release Notes: ${JSON.stringify(notes.slice(0, 5).map(n => n.title))}
    And Customer Footprint: ${JSON.stringify(skus.slice(0, 5).map(s => s.productName))}
    Provide 4 strategic architectural insights (cost, optimization, security).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ['optimization', 'security', 'architecture', 'cost', 'growth'] },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              impact: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
              actionLabel: { type: Type.STRING },
              savings: { type: Type.STRING }
            },
            required: ["type", "title", "description", "impact", "actionLabel"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    return [];
  }
};

export const generateEmailDigest = async (
  relevantNotes: ReleaseNote[],
  customerName: string,
  insights: StrategicInsight[] = []
): Promise<string> => {
  const prompt = `Generate a high-level OCI Strategy Email for ${customerName} based on these insights: ${JSON.stringify(insights.map(i => i.title))}. Use HTML formatting.`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    return response.text || "Synthesis failed.";
  } catch (error) {
    return "Email generation error.";
  }
};