
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

export const getGeminiStreamingResponse = async function* (prompt: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are an expert AI assistant for an aquaculture management system. Provide helpful, professional advice regarding fish farming, water quality, and environmental conditions. Use markdown for rich text formatting. Keep responses professional yet accessible.",
      }
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) yield text;
    }
  } catch (error) {
    console.error("Gemini Streaming API Error:", error);
    yield "Error: Could not connect to the AI service.";
  }
};
