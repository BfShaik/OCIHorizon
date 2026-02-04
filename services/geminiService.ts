import { OCIConsumptionRow, ReleaseNote, StrategicInsight } from "../types";

// OCI Generative AI Configuration
const OCI_ENDPOINT = "https://inference.generativeai.us-chicago-1.oci.oraclecloud.com";
const OCI_API_KEY = process.env.OCI_GENAI_API_KEY || "";
const COMPARTMENT_ID = process.env.OCI_COMPARTMENT_ID || "";

// Helper function to make OCI API calls
async function callOCIInference(modelId: string, prompt: string, tools?: any[], responseSchema?: any) {
  const payload: any = {
    modelId,
    compartmentId: COMPARTMENT_ID,
    prompt,
    inferenceRequestType: "ON_DEMAND",
    runtimeParams: {
      temperature: 0.7,
      maxOutputTokens: 2048
    }
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  if (responseSchema) {
    payload.responseSchema = responseSchema;
  }

  const response = await fetch(`${OCI_ENDPOINT}/inference/generateText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OCI_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`OCI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.generatedTexts?.[0]?.text || "";
}

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
    // Use OCI Gemini 2.5 Pro for search with Google Search tool
    const rawSearchData = await callOCIInference(
      "google.gemini-2.5-pro",
      searchPrompt,
      [{ googleSearch: {} }]
    );

    const groundingMetadata = []; // OCI may not return grounding metadata in the same format

    const structPrompt = `
      Map these release notes to this customer footprint: ${JSON.stringify(topSkus.map(s => s.productName))}.
      Notes: ${rawSearchData}
      Return a JSON array of matched notes with a matchScore (0-100).
    `;

    // Use OCI Gemini 2.5 Flash for structured JSON response
    const structResponse = await callOCIInference(
      "google.gemini-2.5-flash",
      structPrompt,
      [],
      {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            date: { type: "string" },
            service: { type: "string" },
            summary: { type: "string" },
            url: { type: "string" },
            matchScore: { type: "number" }
          },
          required: ["title", "date", "service", "summary", "url", "matchScore"]
        }
      }
    );

    const results = JSON.parse(structResponse || "[]");
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
    const response = await callOCIInference(
      "google.gemini-2.5-flash",
      prompt,
      [],
      {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: { type: "string", enum: ['optimization', 'security', 'architecture', 'cost', 'growth'] },
            title: { type: "string" },
            description: { type: "string" },
            impact: { type: "string", enum: ['high', 'medium', 'low'] },
            actionLabel: { type: "string" },
            savings: { type: "string" }
          },
          required: ["type", "title", "description", "impact", "actionLabel"]
        }
      }
    );
    return JSON.parse(response || "[]");
  } catch (error) {
    console.error("Insights generation error:", error);
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
    const response = await callOCIInference(
      "google.gemini-2.5-flash",
      prompt
    );
    return response || "Synthesis failed.";
  } catch (error) {
    console.error("Email generation error:", error);
    return "Email generation error.";
  }
};
