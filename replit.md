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
- **Database**: PostgreSQL with Drizzle ORM for schema management
- **Session Management**: Express sessions with fallback file-based user storage
- **AI Integration**: Google Gemini Pro API for content generation
- **Development**: Vite middleware for hot module replacement in development

### Authentication System
- Session-based authentication with fallback to file-based storage (users.json)
- bcryptjs for password hashing
- Dual authentication implementation (Prisma-based and file-based fallback)

## Key Components

### Content Generation Pipeline
1. **Subtopic Generation**: When a unit is first clicked, Gemini generates pedagogically structured subtopics
2. **Content Generation**: When a subtopic is first clicked, Gemini creates detailed textbook-style explanations with multiple sections
3. **Practice Questions**: AI-generated practice problems with detailed solutions
4. **Interactive Chat**: Context-aware chat assistant for each subtopic

### Storage Strategy
- **Client-side Caching**: All generated content is cached in localStorage to avoid redundant API calls
- **Storage Modules**: Separate storage utilities for subtopics, content, chat history, and practice questions
- **Cache Management**: Built-in cache clearing and management utilities

### UI Layout
- **Resizable Panels**: Three-panel layout with sidebar, main content, and chat panel
- **Responsive Design**: Mobile-friendly with collapsible panels
- **Mathematical Rendering**: KaTeX integration for proper mathematical notation display

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
- **Neon Database**: PostgreSQL hosting (configured but with fallback)
- **Drizzle ORM**: Type-safe database schema and migrations

### Third-party Libraries
- **Mathematical Rendering**: KaTeX for LaTeX math expression rendering
- **UI Framework**: Radix UI for accessible component primitives
- **Form Handling**: React Hook Form with Zod validation
- **Authentication**: bcryptjs for secure password handling

## Deployment Strategy

### Development Environment
- **Vite Dev Server**: Hot module replacement with Express middleware
- **Environment Variables**: Gemini API key and database URL configuration
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
- PostgreSQL database (with fallback to file-based storage)
- Google Gemini API key for content generation

The application is designed as a progressive learning platform where content complexity increases organically through AI-generated materials, providing a personalized educational experience without requiring pre-authored content.