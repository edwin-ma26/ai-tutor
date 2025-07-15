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
import { generateSubtopics, generateSubtopicContent, generateChatResponse, generatePracticeQuestions, generateStandardUnits, generateUnitsFromText } from "./services/gemini";
import { authenticateUser, createUser, getCurrentUser, requireAuth } from "./lib/auth";
import { signInSchema, signUpSchema } from "@shared/schema";
import { prisma } from "./lib/prisma";

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
      
      console.log("Creating user:", validatedData.username);
      const user = await createUser(validatedData.username, validatedData.password);
      console.log("✓ Database Response - User Created:");
      console.log(`  ID: ${user.id}, Username: ${user.username}`);
      
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
  
  // Get user courses
  app.get("/api/courses", async (req, res) => {
    try {
      const user = getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const courses = await prisma.course.findMany({
        where: { userId: user.id },
        include: {
          units: {
            include: {
              subtopics: true,
            },
          },
        },
      });
      
      // Calculate progress for each course
      const coursesWithProgress = courses.map(course => {
        const totalSubtopics = course.units.reduce((sum, unit) => sum + unit.subtopics.length, 0);
        const completedSubtopics = course.units.reduce((sum, unit) => 
          sum + unit.subtopics.filter(subtopic => subtopic.isCompleted).length, 0);
        
        return {
          ...course,
          progress: {
            completed: completedSubtopics,
            total: totalSubtopics,
          },
          createdAt: course.createdAt?.toISOString() || new Date().toISOString(),
        };
      });
      
      res.json(coursesWithProgress);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  // Create a new course
  app.post("/api/courses", async (req, res) => {
    try {
      const user = getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { title, description, units: textContent } = req.body;
      
      if (!title) {
        return res.status(400).json({ message: "Course title is required" });
      }

      // Create the course
      const course = await prisma.course.create({
        data: {
          title: title.trim(),
          userId: user.id,
        },
      });

      // Generate units based on input type
      let unitTitles: string[] = [];
      
      if (textContent && textContent.length > 0 && textContent[0].trim()) {
        // Generate units from provided text using Gemini
        try {
          const generatedUnits = await generateUnitsFromText(title, textContent[0]);
          unitTitles = generatedUnits;
        } catch (error) {
          console.error("Error generating units from text:", error);
          // Fallback to a basic unit structure
          unitTitles = ["Introduction", "Core Concepts", "Advanced Topics", "Applications"];
        }
      } else {
        // Generate standard units for the course title
        try {
          const generatedUnits = await generateStandardUnits(title);
          unitTitles = generatedUnits;
        } catch (error) {
          console.error("Error generating standard units:", error);
          // Fallback to a basic unit structure
          unitTitles = ["Introduction", "Fundamentals", "Intermediate Topics", "Advanced Applications"];
        }
      }

      // Create the units
      const units = await Promise.all(
        unitTitles.map((unitTitle) =>
          prisma.unit.create({
            data: {
              title: unitTitle.trim(),
              courseId: course.id,
            },
          })
        )
      );

      // Return the created course with units
      const courseWithUnits = await prisma.course.findUnique({
        where: { id: course.id },
        include: {
          units: {
            include: {
              subtopics: true,
            },
          },
        },
      });

      const courseWithProgress = {
        ...courseWithUnits,
        progress: {
          completed: 0,
          total: 0,
        },
        createdAt: new Date().toISOString(),
      };

      res.json(courseWithProgress);
    } catch (error: any) {
      console.error("Error creating course:", error);
      if (error.code === 'P2002') {
        res.status(400).json({ message: "Course title already exists" });
      } else {
        res.status(500).json({ message: "Failed to create course" });
      }
    }
  });

  // Get specific course
  app.get("/api/courses/:courseId", async (req, res) => {
    try {
      const user = getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const course = await prisma.course.findFirst({
        where: { 
          id: req.params.courseId,
          userId: user.id 
        },
      });
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      res.json(course);
    } catch (error) {
      console.error("Course fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get course units
  app.get("/api/courses/:courseId/units", async (req, res) => {
    try {
      const user = getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // First verify the course belongs to the user
      const course = await prisma.course.findFirst({
        where: { 
          id: req.params.courseId,
          userId: user.id 
        },
      });
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      const units = await prisma.unit.findMany({
        where: { courseId: course.id },
        orderBy: { id: 'asc' },
      });
      
      res.json(units);
    } catch (error) {
      console.error("Units fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete course
  app.delete("/api/courses/:courseId", async (req, res) => {
    try {
      const user = getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const courseId = req.params.courseId;
      
      // First verify the course belongs to the user
      const course = await prisma.course.findFirst({
        where: { 
          id: courseId,
          userId: user.id 
        },
      });
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Delete course and all related data (manual cascade delete)
      // First delete all question pages
      await prisma.questionPage.deleteMany({
        where: {
          subtopic: {
            unit: {
              courseId: courseId
            }
          }
        }
      });
      
      // Then delete all info pages
      await prisma.infoPage.deleteMany({
        where: {
          subtopic: {
            unit: {
              courseId: courseId
            }
          }
        }
      });
      
      // Then delete all subtopics
      await prisma.subtopic.deleteMany({
        where: {
          unit: {
            courseId: courseId
          }
        }
      });
      
      // Then delete all units
      await prisma.unit.deleteMany({
        where: {
          courseId: courseId
        }
      });
      
      // Finally delete the course
      await prisma.course.delete({
        where: { id: courseId }
      });
      
      res.json({ message: "Course deleted successfully" });
    } catch (error) {
      console.error("Course deletion error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Generate subtopics for a unit
  app.post("/api/generate-subtopics", async (req, res) => {
    try {
      const user = getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const validatedData = generateSubtopicsRequestSchema.parse(req.body);
      const { unitTitle, courseTitle } = validatedData;
      
      // Find the unit in the database
      const unit = await prisma.unit.findFirst({
        where: {
          title: unitTitle,
          course: {
            title: courseTitle,
            userId: user.id,
          },
        },
      });
      
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      
      // Check if subtopics already exist
      const existingSubtopics = await prisma.subtopic.findMany({
        where: { unitId: unit.id },
      });
      
      if (existingSubtopics.length > 0) {
        // Return existing subtopics in API format
        const subtopics = existingSubtopics.map(s => ({
          id: s.id,
          unitId: unit.id,
          title: s.title,
          description: s.description,
          isCompleted: false,
        }));
        
        const response = generateSubtopicsResponseSchema.parse({ subtopics });
        return res.json(response);
      }
      
      // Generate new subtopics
      const generatedSubtopics = await generateSubtopics(unitTitle, courseTitle);
      
      // Save subtopics to database
      const savedSubtopics = await Promise.all(
        generatedSubtopics.map(subtopic =>
          prisma.subtopic.create({
            data: {
              title: subtopic.title,
              description: subtopic.description,
              unitId: unit.id,
            },
          })
        )
      );
      
      // Convert to API format
      const subtopics = savedSubtopics.map(s => ({
        id: s.id,
        unitId: unit.id,
        title: s.title,
        description: s.description,
        isCompleted: false,
      }));
      
      const response = generateSubtopicsResponseSchema.parse({ subtopics });
      res.json(response);
    } catch (error) {
      console.error("Error generating subtopics:", error);
      res.status(500).json({ message: "Failed to generate subtopics" });
    }
  });

  // Generate content for a subtopic
  app.post("/api/generate-subtopic-page", async (req, res) => {
    try {
      const user = getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const validatedData = generateContentRequestSchema.parse(req.body);
      
      // Find the subtopic in the database
      const subtopic = await prisma.subtopic.findFirst({
        where: {
          title: validatedData.subtopicTitle,
          unit: {
            title: validatedData.unitTitle,
            course: {
              title: validatedData.courseTitle,
              userId: user.id,
            },
          },
        },
      });
      
      if (!subtopic) {
        return res.status(404).json({ message: "Subtopic not found" });
      }
      
      // Check if content already exists
      const existingContent = await prisma.infoPage.findFirst({
        where: { subtopicId: subtopic.id },
      });
      
      if (existingContent) {
        // Return existing content
        const content = JSON.parse(existingContent.content);
        const response = generateContentResponseSchema.parse({ content });
        return res.json(response);
      }
      
      // Generate new content
      const content = await generateSubtopicContent(
        validatedData.subtopicTitle,
        validatedData.unitTitle,
        validatedData.courseTitle
      );
      
      // Save content to database
      await prisma.infoPage.create({
        data: {
          content: JSON.stringify(content),
          subtopicId: subtopic.id,
        },
      });
      
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
      const user = getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const validatedData = generatePracticeQuestionsRequestSchema.parse(req.body);
      
      // Find the subtopic in the database
      const subtopic = await prisma.subtopic.findFirst({
        where: {
          title: validatedData.subtopicTitle,
          unit: {
            title: validatedData.unitTitle,
            course: {
              title: validatedData.courseTitle,
              userId: user.id,
            },
          },
        },
      });
      
      if (!subtopic) {
        return res.status(404).json({ message: "Subtopic not found" });
      }
      
      // Check if questions already exist
      const existingQuestions = await prisma.questionPage.findFirst({
        where: { subtopicId: subtopic.id },
      });
      
      if (existingQuestions) {
        // Return existing questions
        const questions = JSON.parse(existingQuestions.question);
        const response = generatePracticeQuestionsResponseSchema.parse({ questions });
        return res.json(response);
      }
      
      // Generate new questions
      const questions = await generatePracticeQuestions(
        validatedData.subtopicTitle,
        validatedData.unitTitle,
        validatedData.courseTitle
      );
      
      // Save questions to database
      await prisma.questionPage.create({
        data: {
          question: JSON.stringify(questions),
          answer: "", // We store both in the question field as JSON
          subtopicId: subtopic.id,
        },
      });
      
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
