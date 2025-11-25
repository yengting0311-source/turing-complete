import { GoogleGenAI } from "@google/genai";
import { Level } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getAIHint = async (level: Level, userQuestion: string): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key is missing. Please configure it to use the AI Assistant.";
  }

  const prompt = `
    You are a friendly and expert computer engineer teaching a student about digital logic gates.
    The student is playing a game called "Logic Architect".
    
    Current Level: ${level.name}
    Goal: ${level.goal}
    Description: ${level.description}
    Available Gates: ${level.availableGates.join(', ')}

    The user asks: "${userQuestion}"

    Provide a concise, helpful hint without directly giving the full answer if possible. Guide them to the solution.
    Explain the logic concepts simply. 
    If the user is frustrated, you can be more direct.
    Keep the response under 100 words.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "I couldn't generate a hint at this moment.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Sorry, I'm having trouble connecting to the logic mainframe.";
  }
};