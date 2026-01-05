
import { GoogleGenAI } from "@google/genai";

// Strictly follow GenAI SDK guidelines for initialization and usage.
export const getGeminiStreamingResponse = async function* (prompt: string) {
  try {
    // Initialize GoogleGenAI with a named parameter using process.env.API_KEY directly.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Use ai.models.generateContentStream with strictly supported model and config properties.
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are an expert AI assistant for an aquaculture management system. Provide helpful, professional advice regarding fish farming, water quality, and environmental conditions. Use markdown for rich text formatting. Keep responses professional yet accessible.",
      }
    });

    // Iterate through the stream response chunks.
    for await (const chunk of responseStream) {
      // The text property provides the generated text content from the response chunk.
      const text = chunk.text;
      if (text) yield text;
    }
  } catch (error) {
    console.error("Gemini Streaming API Error:", error);
    yield "Error: Could not connect to the AI service.";
  }
};
