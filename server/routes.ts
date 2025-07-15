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
// Try to use database auth, fall back to file auth if database is not ready
import { authenticateUser, createUser, getCurrentUser, requireAuth } from "./lib/auth-fallback";
import { signInSchema, signUpSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes
  app.post("/api/auth/signin", async (req, res) => {
    try {
      const validatedData = signInSchema.parse(req.body);
      
      const user = await authenticateUser(validatedData.username, validatedData.password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Store user in session
      (req.session as any).user = user;
      
      res.json({ user });
    } catch (error) {
      console.error("Sign in error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const validatedData = signUpSchema.parse(req.body);
      
      const user = await createUser(validatedData.username, validatedData.password);
      
      // Store user in session
      (req.session as any).user = user;
      
      res.json({ user });
    } catch (error: any) {
      console.error("Sign up error:", error);
      if (error.code === 'P2002') {
        res.status(400).json({ message: "Username already exists" });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });
  
  app.post("/api/auth/signout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Sign out error:", err);
        return res.status(500).json({ message: "Error signing out" });
      }
      res.clearCookie('connect.sid');
      res.json({ message: "Signed out successfully" });
    });
  });
  
  app.get("/api/auth/me", (req, res) => {
    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json({ user });
  });
  
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
