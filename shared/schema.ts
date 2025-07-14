import { z } from "zod";

// Course Unit schema
export const unitSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  icon: z.string(),
  isCompleted: z.boolean().default(false),
});

// Subtopic schema
export const subtopicSchema = z.object({
  id: z.string(),
  unitId: z.string(),
  title: z.string(),
  description: z.string(),
  isCompleted: z.boolean().default(false),
});

// Generated content schema
export const subtopicContentSchema = z.object({
  subtopicId: z.string(),
  segments: z.record(z.string(), z.string()), // Dynamic segments based on content needs
  generatedAt: z.string(),
  // Legacy fields for backward compatibility
  definition: z.string().optional(),
  method: z.string().optional(),
  example: z.string().optional(),
});

// Chat message schema
export const chatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  timestamp: z.string(),
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

// Type exports
export type Unit = z.infer<typeof unitSchema>;
export type Subtopic = z.infer<typeof subtopicSchema>;
export type SubtopicContent = z.infer<typeof subtopicContentSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type PracticeQuestion = z.infer<typeof practiceQuestionSchema>;
export type PracticeQuestions = z.infer<typeof practiceQuestionsSchema>;
export type GenerateSubtopicsRequest = z.infer<typeof generateSubtopicsRequestSchema>;
export type GenerateSubtopicsResponse = z.infer<typeof generateSubtopicsResponseSchema>;
export type GenerateContentRequest = z.infer<typeof generateContentRequestSchema>;
export type GenerateContentResponse = z.infer<typeof generateContentResponseSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;
export type GeneratePracticeQuestionsRequest = z.infer<typeof generatePracticeQuestionsRequestSchema>;
export type GeneratePracticeQuestionsResponse = z.infer<typeof generatePracticeQuestionsResponseSchema>;
