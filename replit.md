# Learning App - Self-Teaching Platform

## Overview

This is a self-learning web application designed to teach university-level courses like Differential Equations. The app uses AI-powered content generation through Google's Gemini Pro API to create structured learning materials, interactive chat sessions, and practice questions. It features a sidebar-based course structure where users can navigate through units and subtopics, with content generated on-demand.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: React Query (TanStack Query) for server state, React hooks for local state
- **Storage**: Browser localStorage for caching generated content, subtopics, chat history, and practice questions
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with custom styling through shadcn/ui

### Backend Architecture
- **Framework**: Express.js server with TypeScript
- **Database**: PostgreSQL with Prisma ORM for relational data management (migrated from file-based to Supabase)
- **Session Management**: Express sessions with database-backed authentication
- **AI Integration**: Google Gemini Pro API for content generation
- **Development**: Vite middleware for hot module replacement in development

### Authentication System
- Session-based authentication with PostgreSQL database storage
- bcryptjs for password hashing with secure salt rounds
- Simplified user registration with username/password authentication (removed email requirement)
- Proper user data isolation ensuring users only see their own content

### Database Schema (PostgreSQL/Supabase)
- **users**: Secure user accounts with hashed passwords (id, username, password)
- **courses**: User-owned courses with proper data isolation (id, title, userId)
- **units**: Structured course sections (id, title, courseId)
- **subtopics**: Detailed learning modules (id, title, description, unitId)
- **info_pages**: AI-generated educational content stored as JSON (id, content, subtopicId)
- **question_pages**: Practice problems and solutions (id, question, answer, subtopicId)
- **Proper foreign key relationships**: User → Course → Unit → Subtopic → InfoPage/QuestionPage

## Key Components

### Course Management
1. **Dashboard Interface**: Canvas LMS-style course grid displaying user courses with progress tracking
2. **Course Creation**: Two-mode course generation - "From Scratch" using standard university curricula or "From Text" analyzing provided content
3. **Unit Generation**: AI-powered unit structure creation using Gemini for both standard and custom course outlines

### Content Generation Pipeline
1. **Subtopic Generation**: When a unit is first clicked, Gemini generates pedagogically structured subtopics
2. **Content Generation**: When a subtopic is first clicked, Gemini creates detailed textbook-style explanations with multiple sections
3. **Practice Questions**: AI-generated practice problems with detailed solutions
4. **Interactive Chat**: Context-aware chat assistant for each subtopic
5. **Enhanced Formatting**: Support for bullet points (*), bold text (**), and mathematical expressions with KaTeX

### Storage Strategy
- **Client-side Caching**: All generated content is cached in localStorage to avoid redundant API calls
- **Storage Modules**: Separate storage utilities for subtopics, content, chat history, and practice questions
- **Cache Management**: Built-in cache clearing and management utilities

### UI Layout
- **Dashboard**: Canvas LMS-style course grid with progress tracking and course creation
- **Resizable Panels**: Three-panel layout with sidebar, main content, and chat panel
- **Responsive Design**: Mobile-friendly with collapsible panels
- **Mathematical Rendering**: KaTeX integration with bullet points (*) and bold text (**) support
- **Navigation**: Dashboard-Learning navigation with back buttons

## Data Flow

1. **Course Structure**: Hardcoded differential equations course outline with predefined units
2. **Dynamic Content**: Subtopics and content generated on-demand via Gemini API
3. **Caching Layer**: localStorage acts as primary cache, API calls only made for missing content
4. **State Synchronization**: React Query manages server state with aggressive caching policies

## External Dependencies

### AI Services
- **Google Gemini Pro API**: Primary content generation engine
- **API Key Management**: Environment variable configuration for Gemini API access

### Database Services
- **Supabase Database**: PostgreSQL hosting with connection string configuration
- **Drizzle ORM**: Type-safe database schema and migrations

### Third-party Libraries
- **Mathematical Rendering**: KaTeX for LaTeX math expression rendering
- **UI Framework**: Radix UI for accessible component primitives
- **Form Handling**: React Hook Form with Zod validation
- **Authentication**: bcryptjs for secure password handling

## Deployment Strategy

### Development Environment
- **Vite Dev Server**: Hot module replacement with Express middleware
- **Environment Variables**: Gemini API key and Supabase database URL configuration
- **Replit Integration**: Special handling for Replit development environment

### Production Build
- **Frontend**: Vite build process outputs static assets to dist/public
- **Backend**: esbuild bundles server code for Node.js execution
- **Asset Serving**: Express serves built frontend assets in production

### Key Configuration Files
- **Drizzle Config**: PostgreSQL dialect with migration support
- **Vite Config**: React plugin with path aliases and runtime error overlay
- **TypeScript**: Strict configuration with module resolution for monorepo structure

### Environment Requirements
- Node.js with ES modules support
- Supabase PostgreSQL database with DATABASE_URL environment variable (set to Supabase connection string)
- Google Gemini API key for content generation

The application is designed as a progressive learning platform where content complexity increases organically through AI-generated materials, providing a personalized educational experience without requiring pre-authored content.

## Recent Changes

### UUID Implementation (July 15, 2025)
- **Database Schema Migration**: Migrated all database entities from auto-incrementing integers to UUIDs
- **Prisma Schema Updates**: Updated all models (users, courses, units, subtopics, info_pages, question_pages) to use String IDs with uuid() defaults
- **Authentication System**: Modified auth interfaces and functions to work with UUID strings instead of numbers
- **Route Handler Updates**: Removed parseInt() calls and toString() conversions since UUIDs are already strings
- **Client-Side Updates**: Updated auth interface and ID comparison logic to work with UUID strings
- **Database Migration**: Successfully reset and recreated database with UUID support
- **End-to-End Testing**: Verified complete authentication, course creation, and unit generation flow with UUIDs

### Course-Specific Learning Pages (July 15, 2025)
- **Dynamic Course Content**: Removed hardcoded differential equations units and implemented course-specific learning pages
- **AI-Generated Units**: Each course now uses AI to generate appropriate unit structures based on course title using standardized university curricula
- **URL Parameter Routing**: Updated routing from `/learning` to `/learning/:courseId` for course-specific pages
- **Database Schema Updates**: Courses are now fully dynamic with AI-generated units stored in database
- **User Experience**: Users can create courses "From Scratch" or "From Text" with AI generating relevant unit structures
- **Navigation Fix**: Corrected post-creation navigation to use proper URL parameters instead of query strings

### UI Improvements and Bug Fixes (July 15, 2025)
- **Course Deletion**: Fixed foreign key constraint errors by implementing proper cascading deletion order
- **Content Generation**: Resolved content generation issues by fixing unit ID matching and dynamic course title usage
- **Navigation Enhancement**: Removed redundant breadcrumb from content area header (now only in top navbar)
- **Navbar Breadcrumb**: Enhanced navigation to show complete path: Course → Unit → Subtopic
- **User Experience**: Cleaner interface with consistent navigation patterns and proper loading states