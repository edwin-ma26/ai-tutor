import { z } from "zod";

// User schema
export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().email(),
  hashedPassword: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Course schema
export const courseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  level: z.string(),
  userId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Course Unit schema
export const unitSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  icon: z.string(),
  courseId: z.string(),
  orderIndex: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Subtopic schema
export const subtopicSchema = z.object({
  id: z.string(),
  unitId: z.string(),
  title: z.string(),
  description: z.string(),
  orderIndex: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Info page schema
export const infoPageSchema = z.object({
  id: z.string(),
  subtopicId: z.string(),
  title: z.string(),
  content: z.string(), // JSON content with segments
  orderIndex: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Question page schema
export const questionPageSchema = z.object({
  id: z.string(),
  subtopicId: z.string(),
  questions: z.string(), // JSON array of practice questions
  orderIndex: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// User progress schema
export const userProgressSchema = z.object({
  id: z.string(),
  userId: z.string(),
  unitId: z.string(),
  subtopicId: z.string().nullable(),
  completed: z.boolean(),
  progress: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Chat message schema
export const chatMessageSchema = z.object({
  id: z.string(),
  userId: z.string(),
  subtopicId: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  createdAt: z.date(),
});

// Practice result schema
export const practiceResultSchema = z.object({
  id: z.string(),
  userId: z.string(),
  subtopicId: z.string(),
  questionId: z.string(),
  correct: z.boolean(),
  userAnswer: z.string(),
  createdAt: z.date(),
});

// Generated content schema (for compatibility)
export const subtopicContentSchema = z.object({
  subtopicId: z.string(),
  segments: z.record(z.string(), z.string()), // Dynamic segments based on content needs
  generatedAt: z.string(),
  // Legacy fields for backward compatibility
  definition: z.string().optional(),
  method: z.string().optional(),
  example: z.string().optional(),
});

// Practice question schema
export const practiceQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string(),
});

// Practice questions collection schema
export const practiceQuestionsSchema = z.object({
  subtopicId: z.string(),
  questions: z.array(practiceQuestionSchema),
  generatedAt: z.string(),
});

// API request/response schemas
export const generateSubtopicsRequestSchema = z.object({
  unitTitle: z.string(),
  courseTitle: z.string().default("Differential Equations"),
});

export const generateSubtopicsResponseSchema = z.object({
  subtopics: z.array(subtopicSchema),
});

export const generateContentRequestSchema = z.object({
  subtopicTitle: z.string(),
  unitTitle: z.string(),
  courseTitle: z.string().default("Differential Equations"),
});

export const generateContentResponseSchema = z.object({
  content: subtopicContentSchema,
});

export const chatRequestSchema = z.object({
  message: z.string(),
  subtopicId: z.string(),
  context: z.string().optional(),
});

export const chatResponseSchema = z.object({
  response: z.string(),
});

// Practice questions API schemas
export const generatePracticeQuestionsRequestSchema = z.object({
  subtopicTitle: z.string(),
  unitTitle: z.string(),
  courseTitle: z.string().default("Differential Equations"),
});

export const generatePracticeQuestionsResponseSchema = z.object({
  questions: practiceQuestionsSchema,
});

// Insert schemas (for creating new records)
export const insertUserSchema = userSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const insertCourseSchema = courseSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const insertUnitSchema = unitSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const insertSubtopicSchema = subtopicSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const insertInfoPageSchema = infoPageSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const insertQuestionPageSchema = questionPageSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserProgressSchema = userProgressSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const insertChatMessageSchema = chatMessageSchema.omit({ id: true, createdAt: true });
export const insertPracticeResultSchema = practiceResultSchema.omit({ id: true, createdAt: true });

// Authentication schemas
export const signUpSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
});

export const signInSchema = z.object({
  username: z.string(),
  password: z.string(),
});

// Type exports
export type User = z.infer<typeof userSchema>;
export type Course = z.infer<typeof courseSchema>;
export type Unit = z.infer<typeof unitSchema>;
export type Subtopic = z.infer<typeof subtopicSchema>;
export type InfoPage = z.infer<typeof infoPageSchema>;
export type QuestionPage = z.infer<typeof questionPageSchema>;
export type UserProgress = z.infer<typeof userProgressSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type PracticeResult = z.infer<typeof practiceResultSchema>;
export type SubtopicContent = z.infer<typeof subtopicContentSchema>;
export type PracticeQuestion = z.infer<typeof practiceQuestionSchema>;
export type PracticeQuestions = z.infer<typeof practiceQuestionsSchema>;

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type InsertUnit = z.infer<typeof insertUnitSchema>;
export type InsertSubtopic = z.infer<typeof insertSubtopicSchema>;
export type InsertInfoPage = z.infer<typeof insertInfoPageSchema>;
export type InsertQuestionPage = z.infer<typeof insertQuestionPageSchema>;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type InsertPracticeResult = z.infer<typeof insertPracticeResultSchema>;

// Auth types
export type SignUpData = z.infer<typeof signUpSchema>;
export type SignInData = z.infer<typeof signInSchema>;

// API types
export type GenerateSubtopicsRequest = z.infer<typeof generateSubtopicsRequestSchema>;
export type GenerateSubtopicsResponse = z.infer<typeof generateSubtopicsResponseSchema>;
export type GenerateContentRequest = z.infer<typeof generateContentRequestSchema>;
export type GenerateContentResponse = z.infer<typeof generateContentResponseSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;
export type GeneratePracticeQuestionsRequest = z.infer<typeof generatePracticeQuestionsRequestSchema>;
export type GeneratePracticeQuestionsResponse = z.infer<typeof generatePracticeQuestionsResponseSchema>;

// Hardcoded course outline for Differential Equations
export const DIFFERENTIAL_EQUATIONS_UNITS = [
  {
    id: "unit-1",
    title: "First-Order Differential Equations",
    description: "Basic techniques for solving first-order equations",
    icon: "fas fa-book-open",
  },
  {
    id: "unit-2", 
    title: "Second-Order Linear Equations",
    description: "Homogeneous and non-homogeneous second-order equations",
    icon: "fas fa-calculator",
  },
  {
    id: "unit-3",
    title: "Laplace Transforms", 
    description: "Transform methods for solving differential equations",
    icon: "fas fa-chart-line",
  },
  {
    id: "unit-4",
    title: "Systems of Differential Equations",
    description: "Matrix methods and phase plane analysis", 
    icon: "fas fa-network-wired",
  },
  {
    id: "unit-5",
    title: "Series Solutions",
    description: "Power series and special functions",
    icon: "fas fa-infinity",
  },
  {
    id: "unit-6",
    title: "Boundary Value Problems",
    description: "Sturm-Liouville theory and eigenvalue problems",
    icon: "fas fa-border-all",
  },
  {
    id: "unit-7",
    title: "Partial Differential Equations",
    description: "Heat, wave, and Laplace equations",
    icon: "fas fa-wave-square",
  },
  {
    id: "unit-8", 
    title: "Numerical Methods",
    description: "Computational approaches to differential equations",
    icon: "fas fa-laptop-code",
  },
] as const;
