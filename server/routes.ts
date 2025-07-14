import type { Express } from "express";
import { createServer, type Server } from "http";
import { 
  generateSubtopicsRequestSchema, 
  generateContentRequestSchema,
  chatRequestSchema,
  generatePracticeQuestionsRequestSchema,
  generateSubtopicsResponseSchema,
  generateContentResponseSchema,
  chatResponseSchema,
  generatePracticeQuestionsResponseSchema
} from "@shared/schema";
import { generateSubtopics, generateSubtopicContent, generateChatResponse, generatePracticeQuestions } from "./services/gemini";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Generate subtopics for a unit
  app.post("/api/generate-subtopics", async (req, res) => {
    try {
      const validatedData = generateSubtopicsRequestSchema.parse(req.body);
      
      const subtopics = await generateSubtopics(validatedData.unitTitle, validatedData.courseTitle);
      
      const response = generateSubtopicsResponseSchema.parse({ subtopics });
      res.json(response);
    } catch (error) {
      console.error("Error generating subtopics:", error);
      res.status(500).json({ 
        message: "Failed to generate subtopics. Please check your API key and try again." 
      });
    }
  });

  // Generate content for a subtopic
  app.post("/api/generate-subtopic-page", async (req, res) => {
    try {
      const validatedData = generateContentRequestSchema.parse(req.body);
      
      const content = await generateSubtopicContent(
        validatedData.subtopicTitle,
        validatedData.unitTitle,
        validatedData.courseTitle
      );
      
      const response = generateContentResponseSchema.parse({ content });
      res.json(response);
    } catch (error) {
      console.error("Error generating subtopic content:", error);
      res.status(500).json({ 
        message: "Failed to generate content. Please check your API key and try again." 
      });
    }
  });

  // Chat with AI about current subtopic
  app.post("/api/chat", async (req, res) => {
    try {
      const validatedData = chatRequestSchema.parse(req.body);
      
      const responseText = await generateChatResponse(
        validatedData.message,
        validatedData.context || ""
      );
      
      const response = chatResponseSchema.parse({ response: responseText });
      res.json(response);
    } catch (error) {
      console.error("Error generating chat response:", error);
      res.status(500).json({ 
        message: "Failed to generate response. Please check your API key and try again." 
      });
    }
  });

  // Generate practice questions for a subtopic
  app.post("/api/generate-practice-questions", async (req, res) => {
    try {
      const validatedData = generatePracticeQuestionsRequestSchema.parse(req.body);
      
      const questions = await generatePracticeQuestions(
        validatedData.subtopicTitle,
        validatedData.unitTitle,
        validatedData.courseTitle
      );
      
      const response = generatePracticeQuestionsResponseSchema.parse({ questions });
      res.json(response);
    } catch (error) {
      console.error("Error generating practice questions:", error);
      res.status(500).json({ 
        message: "Failed to generate practice questions. Please check your API key and try again." 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
