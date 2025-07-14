import { GoogleGenAI } from "@google/genai";
import { Subtopic, SubtopicContent, PracticeQuestions } from "@shared/schema";
import 'dotenv/config';

console.log("Gemini API Key:", process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

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

// Generate practice questions for a subtopic
export async function generatePracticeQuestions(
  subtopicTitle: string,
  unitTitle: string,
  courseTitle: string = "Differential Equations"
): Promise<PracticeQuestions> {
  try {
    const prompt = `Generate exactly 5 practice questions for the subtopic "${subtopicTitle}" in the unit "${unitTitle}" from the course "${courseTitle}".

Each question should:
1. Test understanding of the key concepts
2. Range from basic to intermediate difficulty  
3. Include a complete, step-by-step solution
4. Use proper mathematical notation (for equations, use LaTeX format like $y = mx + b$ or $$\\frac{dy}{dx} = 2x$$)

Use this exact format:

QUESTION 1: [Your question here - use LaTeX for math equations]
ANSWER 1: [Complete step-by-step solution with LaTeX math notation]

QUESTION 2: [Your question here - use LaTeX for math equations]
ANSWER 2: [Complete step-by-step solution with LaTeX math notation]

QUESTION 3: [Your question here - use LaTeX for math equations]
ANSWER 3: [Complete step-by-step solution with LaTeX math notation]

QUESTION 4: [Your question here - use LaTeX for math equations]
ANSWER 4: [Complete step-by-step solution with LaTeX math notation]

QUESTION 5: [Your question here - use LaTeX for math equations]
ANSWER 5: [Complete step-by-step solution with LaTeX math notation]

Examples of proper math notation:
- Inline math: $\\frac{dy}{dx} = 2x + 3$
- Display math: $$y = \\int (2x + 3)dx = x^2 + 3x + C$$
- Fractions: $\\frac{a}{b}$
- Derivatives: $\\frac{d}{dx}[f(x)]$
- Integrals: $\\int f(x)dx$

Make sure each question tests different aspects of the subtopic and provides educational value.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const rawText = response.text || "";
    
    if (!rawText) {
      throw new Error("Empty response from Gemini");
    }

    // Parse the response into questions and answers
    const questions = [];
    const questionRegex = /QUESTION\s+(\d+):\s*(.*?)\s*ANSWER\s+\1:\s*(.*?)(?=QUESTION\s+\d+:|$)/gs;
    let match;
    let questionNumber = 1;

    while ((match = questionRegex.exec(rawText)) !== null) {
      const question = match[2].trim();
      const answer = match[3].trim();
      
      if (question && answer) {
        questions.push({
          id: `${subtopicTitle.toLowerCase().replace(/\s+/g, '-')}-q${questionNumber}`,
          question: question,
          answer: answer,
        });
        questionNumber++;
      }
    }

    // Fallback parsing if regex doesn't work
    if (questions.length === 0) {
      const sections = rawText.split(/QUESTION\s+\d+:/i).filter(s => s.trim());
      
      sections.forEach((section, index) => {
        const answerSplit = section.split(/ANSWER\s+\d+:/i);
        if (answerSplit.length >= 2) {
          const question = answerSplit[0].trim();
          const answer = answerSplit[1].trim();
          
          if (question && answer) {
            questions.push({
              id: `${subtopicTitle.toLowerCase().replace(/\s+/g, '-')}-q${index + 1}`,
              question: question,
              answer: answer,
            });
          }
        }
      });
    }

    // Final fallback - split by lines and try to parse
    if (questions.length === 0) {
      const lines = rawText.split('\n').filter(line => line.trim());
      let currentQuestion = '';
      let currentAnswer = '';
      let isAnswer = false;
      
      lines.forEach((line, index) => {
        if (line.match(/^QUESTION\s+\d+:/i)) {
          if (currentQuestion && currentAnswer) {
            questions.push({
              id: `${subtopicTitle.toLowerCase().replace(/\s+/g, '-')}-q${questions.length + 1}`,
              question: currentQuestion,
              answer: currentAnswer,
            });
          }
          currentQuestion = line.replace(/^QUESTION\s+\d+:\s*/i, '').trim();
          currentAnswer = '';
          isAnswer = false;
        } else if (line.match(/^ANSWER\s+\d+:/i)) {
          currentAnswer = line.replace(/^ANSWER\s+\d+:\s*/i, '').trim();
          isAnswer = true;
        } else if (line.trim()) {
          if (isAnswer) {
            currentAnswer += ' ' + line.trim();
          } else {
            currentQuestion += ' ' + line.trim();
          }
        }
      });
      
      // Add the last question
      if (currentQuestion && currentAnswer) {
        questions.push({
          id: `${subtopicTitle.toLowerCase().replace(/\s+/g, '-')}-q${questions.length + 1}`,
          question: currentQuestion,
          answer: currentAnswer,
        });
      }
    }

    if (questions.length === 0) {
      throw new Error("No valid questions generated");
    }

    const practiceQuestions: PracticeQuestions = {
      subtopicId: subtopicTitle.toLowerCase().replace(/\s+/g, '-'),
      questions: questions,
      generatedAt: new Date().toISOString(),
    };

    return practiceQuestions;

  } catch (error) {
    console.error("Error generating practice questions:", error);
    throw new Error(`Failed to generate practice questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
