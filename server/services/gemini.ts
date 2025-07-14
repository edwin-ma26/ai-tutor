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
Create a structured, pedagogical explanation of "${subtopicTitle}" from the unit "${unitTitle}".

STEP 1: First, tell me which segments you will include from this list:
- CONCEPT INTRODUCTION: Core definition and fundamental understanding
- WHY IT MATTERS: Real-world relevance and mathematical significance  
- COMMON FORM: Standard notation, formulas, or typical presentations
- HOW TO SOLVE: Step-by-step problem-solving approach
- EXAMPLE: Worked problem demonstrating the concept
- VISUALIZATION TIPS: Ways to picture or understand the concept
- APPLICATIONS: Where and how this concept is used

STEP 2: Then provide the content for each segment using this EXACT format:

CONCEPT INTRODUCTION:
[Your content here]

WHY IT MATTERS:
[Your content here]

COMMON FORM:
[Your content here]

HOW TO SOLVE:
[Your content here]

EXAMPLE:
[Your content here]

VISUALIZATION TIPS:
[Your content here]

APPLICATIONS:
[Your content here]

IMPORTANT RULES:
1. Choose 2-4 segments that best suit this specific topic
2. Use the EXACT segment names in ALL CAPS followed by a colon
3. Use proper LaTeX notation for all mathematical expressions:
   - Inline math: $x^2 + 1$, $\\frac{dy}{dx}$, $e^{-st}$
   - Display math: $$\\int_0^\\infty e^{-st}f(t)dt = F(s)$$
   - Use \\frac{numerator}{denominator} for fractions
   - Use \\int for integrals, \\sum for summations
   - Use \\lim_{x \\to a} for limits
   - Use \\sqrt{expression} for square roots
   - Use \\cdot for multiplication dots
   - Format derivatives as \\frac{dy}{dx} or y'

Select the most appropriate 2-4 segments for this topic and provide rich, detailed content.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const rawText = response.text || "";
    
    if (!rawText) {
      throw new Error("Empty response from Gemini");
    }

    // Parse the adaptive structured response with improved regex
    const parsedSegments: Record<string, string> = {};
    
    // Find all segment headers and their positions
    const segmentHeaders = [
      'CONCEPT INTRODUCTION',
      'WHY IT MATTERS', 
      'COMMON FORM',
      'HOW TO SOLVE',
      'EXAMPLE',
      'VISUALIZATION TIPS',
      'APPLICATIONS'
    ];
    
    const foundSegments: Array<{name: string, start: number, key: string}> = [];
    
    segmentHeaders.forEach(header => {
      const regex = new RegExp(`^${header}:\\s*`, 'gmi');
      let match;
      while ((match = regex.exec(rawText)) !== null) {
        foundSegments.push({
          name: header,
          start: match.index + match[0].length,
          key: header.toLowerCase().replace(/\s+/g, '_')
        });
      }
    });
    
    // Sort segments by position in text
    foundSegments.sort((a, b) => a.start - b.start);
    
    // Extract content between segments
    for (let i = 0; i < foundSegments.length; i++) {
      const currentSegment = foundSegments[i];
      const nextSegment = foundSegments[i + 1];
      
      const endPos = nextSegment ? nextSegment.start - nextSegment.name.length - 1 : rawText.length;
      const content = rawText.substring(currentSegment.start, endPos).trim();
      
      if (content) {
        parsedSegments[currentSegment.key] = content;
      }
    }

    console.log('Raw response length:', rawText.length);
    console.log('Found segments:', foundSegments.map(s => s.name));
    console.log('Parsed segments:', Object.keys(parsedSegments));
    console.log('Segment content lengths:', Object.entries(parsedSegments).map(([k, v]) => `${k}: ${v.length} chars`));

    // Fallback parsing if no structured format found
    if (Object.keys(parsedSegments).length === 0) {
      const fallbackSections = rawText.split('\n\n').filter(section => section.trim());
      
      if (fallbackSections.length >= 2) {
        parsedSegments['concept_introduction'] = fallbackSections[0]?.trim() || "";
        parsedSegments['how_to_solve'] = fallbackSections[1]?.trim() || "";
        if (fallbackSections.length >= 3) {
          parsedSegments['example'] = fallbackSections.slice(2).join('\n\n').trim();
        }
      } else {
        parsedSegments['concept_introduction'] = rawText.trim();
      }
      
      console.log('Used fallback parsing, segments:', Object.keys(parsedSegments));
    }

    const content: SubtopicContent = {
      subtopicId: subtopicTitle.toLowerCase().replace(/\s+/g, '-'),
      segments: parsedSegments,
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
