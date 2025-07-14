import { GoogleGenAI } from "@google/genai";
import { Subtopic, SubtopicContent } from "@shared/schema";

// Initialize Gemini AI with API key from environment
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "" 
});

// Utility function to clean malformed responses
function cleanResponse(text: string): string {
  // Remove any markdown formatting that might be present
  return text
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
    .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
    .replace(/#{1,6}\s/g, '') // Remove heading markers
    .replace(/^\s*[-*+]\s/gm, '') // Remove bullet points
    .replace(/^\s*\d+\.\s/gm, '') // Remove numbered lists
    .trim();
}

// Generate subtopics for a given unit
export async function generateSubtopics(unitTitle: string, courseTitle: string): Promise<Subtopic[]> {
  try {
    const prompt = `I'm studying a course on ${courseTitle}.
Generate a pedagogically logical list of subtopics for the unit "${unitTitle}" that build conceptual understanding step-by-step.

Use this format exactly, with no bullets, markdown, or numbering:

Subtopic Title ||| One-line concise description

Generate 6-8 subtopics that progress from basic concepts to more advanced applications.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const rawText = response.text || "";
    const cleanedText = cleanResponse(rawText);
    
    if (!cleanedText) {
      throw new Error("Empty response from Gemini");
    }

    // Parse the response into subtopics
    const lines = cleanedText.split('\n').filter(line => line.trim() && line.includes('|||'));
    
    const subtopics: Subtopic[] = lines.map((line, index) => {
      const [title, description] = line.split('|||').map(part => part.trim());
      
      if (!title || !description) {
        throw new Error(`Invalid subtopic format: ${line}`);
      }

      return {
        id: `${unitTitle.toLowerCase().replace(/\s+/g, '-')}-subtopic-${index + 1}`,
        unitId: unitTitle.toLowerCase().replace(/\s+/g, '-'),
        title: title,
        description: description,
        isCompleted: false,
      };
    });

    if (subtopics.length === 0) {
      throw new Error("No valid subtopics generated");
    }

    return subtopics;

  } catch (error) {
    console.error("Error generating subtopics:", error);
    throw new Error(`Failed to generate subtopics: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Generate textbook-style content for a subtopic
export async function generateSubtopicContent(
  subtopicTitle: string, 
  unitTitle: string, 
  courseTitle: string
): Promise<SubtopicContent> {
  try {
    const prompt = `I'm studying a course on ${courseTitle}.
Please write a detailed textbook-style explanation of the subtopic "${subtopicTitle}", which falls under the unit "${unitTitle}".

The response should be structured using the following format:

Definition:
<Comprehensive explanation of the concept with proper mathematical notation>

Method:
<Step-by-step approach with formulas and procedures>

Example:
<Complete worked example with all mathematical steps>

IMPORTANT: Use proper LaTeX notation for all mathematical expressions:
- Inline math: $x^2 + 1$, $\\frac{dy}{dx}$, $e^{-st}$
- Display math: $$\\int_0^\\infty e^{-st}f(t)dt = F(s)$$
- Use \\frac{numerator}{denominator} for fractions
- Use \\int for integrals, \\sum for summations
- Use \\lim_{x \\to a} for limits
- Use \\sqrt{expression} for square roots
- Use \\cdot for multiplication dots
- Format derivatives as \\frac{dy}{dx} or y'

Return clean text with LaTeX math expressions. Do not use markdown formatting.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const rawText = response.text || "";
    
    if (!rawText) {
      throw new Error("Empty response from Gemini");
    }

    // Parse the structured response
    const sections = rawText.split(/(?=Definition:|Method:|Example:)/);
    
    let definition = "";
    let method = "";
    let example = "";

    sections.forEach(section => {
      const trimmedSection = section.trim();
      
      if (trimmedSection.startsWith("Definition:")) {
        definition = trimmedSection.replace("Definition:", "").trim();
      } else if (trimmedSection.startsWith("Method:")) {
        method = trimmedSection.replace("Method:", "").trim();
      } else if (trimmedSection.startsWith("Example:")) {
        example = trimmedSection.replace("Example:", "").trim();
      }
    });

    // Fallback parsing if the structured format wasn't followed
    if (!definition || !method || !example) {
      const fallbackSections = rawText.split('\n\n').filter(section => section.trim());
      
      if (fallbackSections.length >= 3) {
        definition = definition || fallbackSections[0].trim();
        method = method || fallbackSections[1].trim();
        example = example || fallbackSections.slice(2).join('\n\n').trim();
      } else {
        // If all else fails, use the entire response as definition
        definition = definition || rawText.trim();
        method = method || "Please refer to the definition above for the general approach.";
        example = example || "Example will be provided in future updates.";
      }
    }

    const content: SubtopicContent = {
      subtopicId: subtopicTitle.toLowerCase().replace(/\s+/g, '-'),
      definition: definition,
      method: method,
      example: example,
      generatedAt: new Date().toISOString(),
    };

    return content;

  } catch (error) {
    console.error("Error generating subtopic content:", error);
    throw new Error(`Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Generate chat response for user questions
export async function generateChatResponse(message: string, context: string = ""): Promise<string> {
  try {
    const systemPrompt = `You are an expert mathematics tutor specializing in differential equations and advanced mathematics. 
You provide clear, helpful explanations and can answer questions about mathematical concepts, methods, and problem-solving techniques.

Keep your responses concise but thorough. Use plain text format without markdown.
If asked about specific problems, provide step-by-step solutions.
If concepts need clarification, break them down into understandable parts.`;

    const fullPrompt = context 
      ? `${systemPrompt}\n\nContext:\n${context}\n\nStudent Question: ${message}`
      : `${systemPrompt}\n\nStudent Question: ${message}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
      },
      contents: fullPrompt,
    });

    const rawText = response.text || "";
    
    if (!rawText) {
      throw new Error("Empty response from Gemini");
    }

    return cleanResponse(rawText);

  } catch (error) {
    console.error("Error generating chat response:", error);
    throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Test function to verify API key is working
export async function testGeminiConnection(): Promise<boolean> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Hello, please respond with 'API connection successful'",
    });

    return !!(response.text && response.text.toLowerCase().includes('successful'));
  } catch (error) {
    console.error("Gemini connection test failed:", error);
    return false;
  }
}
