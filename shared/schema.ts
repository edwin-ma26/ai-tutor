import { z } from "zod";

// Database schemas (matching Prisma models)
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  password: z.string(),
});

export const courseSchema = z.object({
  id: z.number(),
  title: z.string(),
  userId: z.number(),
});

export const unitSchema = z.object({
  id: z.number(),
  title: z.string(),
  courseId: z.number(),
});

export const subtopicSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  unitId: z.number(),
});

export const infoPageSchema = z.object({
  id: z.number(),
  content: z.string(),
  subtopicId: z.number(),
});

export const questionPageSchema = z.object({
  id: z.number(),
  question: z.string(),
  answer: z.string(),
  subtopicId: z.number(),
});

// Insert schemas (for creating new records)
export const insertUserSchema = userSchema.omit({ id: true });
export const insertCourseSchema = courseSchema.omit({ id: true });
export const insertUnitSchema = unitSchema.omit({ id: true });
export const insertSubtopicSchema = subtopicSchema.omit({ id: true });
export const insertInfoPageSchema = infoPageSchema.omit({ id: true });
export const insertQuestionPageSchema = questionPageSchema.omit({ id: true });

// API response schemas (for legacy compatibility)
export const unitResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  icon: z.string(),
  isCompleted: z.boolean().default(false),
});

export const subtopicResponseSchema = z.object({
  id: z.string(),
  unitId: z.string(),
  title: z.string(),
  description: z.string(),
  isCompleted: z.boolean().default(false),
});

// Content schemas for AI-generated content
export const contentSegmentSchema = z.object({
  id: z.string(),
  type: z.enum(["introduction", "concept", "example", "theorem", "formula", "summary"]),
  title: z.string(),
  content: z.string(),
});

export const subtopicContentSchema = z.object({
  title: z.string(),
  content: z.array(contentSegmentSchema),
});

export const practiceQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string(),
  explanation: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
});

export const practiceQuestionsSchema = z.object({
  questions: z.array(practiceQuestionSchema),
});

export const chatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.number(),
});

// Auth schemas
export const signUpSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signInSchema = z.object({
  username: z.string(),
  password: z.string(),
});

// API request/response schemas
export const generateSubtopicsRequestSchema = z.object({
  unitTitle: z.string(),
  courseTitle: z.string(),
});

export const generateSubtopicsResponseSchema = z.object({
  subtopics: z.array(subtopicResponseSchema),
});

export const generateContentRequestSchema = z.object({
  subtopicTitle: z.string(),
  unitTitle: z.string(),
  courseTitle: z.string(),
});

export const generateContentResponseSchema = z.object({
  content: subtopicContentSchema,
});

export const chatRequestSchema = z.object({
  message: z.string(),
  context: z.string().optional(),
});

export const chatResponseSchema = z.object({
  response: z.string(),
});

export const generatePracticeQuestionsRequestSchema = z.object({
  subtopicTitle: z.string(),
  unitTitle: z.string(),
  courseTitle: z.string(),
});

export const generatePracticeQuestionsResponseSchema = z.object({
  questions: practiceQuestionsSchema,
});

// Type exports
export type User = z.infer<typeof userSchema>;
export type Course = z.infer<typeof courseSchema>;
export type Unit = z.infer<typeof unitSchema>;
export type Subtopic = z.infer<typeof subtopicSchema>;
export type InfoPage = z.infer<typeof infoPageSchema>;
export type QuestionPage = z.infer<typeof questionPageSchema>;

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type InsertUnit = z.infer<typeof insertUnitSchema>;
export type InsertSubtopic = z.infer<typeof insertSubtopicSchema>;
export type InsertInfoPage = z.infer<typeof insertInfoPageSchema>;
export type InsertQuestionPage = z.infer<typeof insertQuestionPageSchema>;

// API response types
export type UnitResponse = z.infer<typeof unitResponseSchema>;
export type SubtopicResponse = z.infer<typeof subtopicResponseSchema>;
export type SubtopicContent = z.infer<typeof subtopicContentSchema>;
export type PracticeQuestion = z.infer<typeof practiceQuestionSchema>;
export type PracticeQuestions = z.infer<typeof practiceQuestionsSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;

// Auth types
export type SignUpData = z.infer<typeof signUpSchema>;
export type SignInData = z.infer<typeof signInSchema>;

// API request/response types
export type GenerateSubtopicsRequest = z.infer<typeof generateSubtopicsRequestSchema>;
export type GenerateSubtopicsResponse = z.infer<typeof generateSubtopicsResponseSchema>;
export type GenerateContentRequest = z.infer<typeof generateContentRequestSchema>;
export type GenerateContentResponse = z.infer<typeof generateContentResponseSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;
export type GeneratePracticeQuestionsRequest = z.infer<typeof generatePracticeQuestionsRequestSchema>;
export type GeneratePracticeQuestionsResponse = z.infer<typeof generatePracticeQuestionsResponseSchema>;

// Hardcoded course data
export const DIFFERENTIAL_EQUATIONS_UNITS = [
  {
    id: "first-order-differential-equations",
    title: "First-Order Differential Equations",
    description: "Introduction to first-order differential equations and basic solution methods",
    icon: "📊",
  },
  {
    id: "second-order-linear-equations",
    title: "Second-Order Linear Equations",
    description: "Homogeneous and non-homogeneous second-order linear differential equations",
    icon: "📈",
  },
  {
    id: "systems-of-differential-equations",
    title: "Systems of Differential Equations",
    description: "Solving systems of first-order linear differential equations",
    icon: "🔗",
  },
  {
    id: "laplace-transforms",
    title: "Laplace Transforms",
    description: "Using Laplace transforms to solve differential equations",
    icon: "🔄",
  },
  {
    id: "series-solutions",
    title: "Series Solutions",
    description: "Power series and Frobenius method for solving differential equations",
    icon: "∞",
  },
  {
    id: "partial-differential-equations",
    title: "Partial Differential Equations",
    description: "Introduction to PDEs and separation of variables",
    icon: "∂",
  },
];