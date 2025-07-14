# Learning App

## Overview

This is a self-teaching web application designed to help users learn university-level courses like Differential Equations. The app features a sidebar-based course structure where users can explore units and subtopics, with AI-generated content using Google's Gemini AI. The application uses a modern full-stack architecture with React on the frontend and Express on the backend.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent UI components
- **State Management**: React Query (TanStack Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Storage**: Browser localStorage for client-side data persistence
- **AI Integration**: Google Generative AI (@google/genai) for content generation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Session Management**: Express sessions with PostgreSQL session store
- **AI Service**: Google Gemini AI for generating educational content
- **Development**: Vite middleware for hot module replacement in development

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon Database (@neondatabase/serverless)
- **ORM**: Drizzle ORM with migrations stored in `/migrations` directory
- **Client Storage**: localStorage for caching generated content, subtopics, and chat history
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple

## Key Components

### Frontend Components
1. **Learning Page**: Main application container managing state for selected units and subtopics
2. **Sidebar**: Navigation component displaying course units and dynamically loaded subtopics
3. **ContentArea**: Displays AI-generated textbook-style content for selected subtopics
4. **ChatPanel**: Interactive chat interface for asking questions about subtopics
5. **LoadingSpinner**: Provides user feedback during AI content generation

### Backend Services
1. **Gemini Service**: Handles AI content generation with specific prompts for subtopics and chat responses
2. **Route Handlers**: RESTful API endpoints for generating subtopics, content, and chat responses
3. **Storage Layer**: In-memory storage implementation with interface for future database integration

### Shared Schema
- **Zod Schemas**: Type-safe validation for API requests/responses and data structures
- **TypeScript Types**: Shared types between frontend and backend for consistency

## Data Flow

### Content Generation Flow
1. User clicks on a unit → Frontend checks localStorage cache
2. If not cached → API call to `/api/generate-subtopics` with unit title
3. Backend calls Gemini AI with structured prompt for subtopic generation
4. Response parsed and cached in localStorage for future use
5. Subtopics displayed in sidebar for user selection

### Subtopic Content Flow
1. User clicks subtopic → Frontend checks localStorage for existing content
2. If not cached → API call to `/api/generate-subtopic-page`
3. Backend generates textbook-style content using Gemini AI
4. Content structured as Definition, Method, and Example sections
5. Content cached and displayed in main content area

### Chat Interaction Flow
1. User types question in chat panel
2. API call to `/api/chat` with message and context (subtopic/unit)
3. Backend maintains conversation context and generates responses
4. Chat history stored in localStorage per subtopic

## External Dependencies

### AI Services
- **Google Gemini AI**: Primary AI service for content generation
- **API Configuration**: Requires GEMINI_API_KEY or GOOGLE_API_KEY environment variable

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Connection**: Via DATABASE_URL environment variable

### UI Libraries
- **shadcn/ui**: Comprehensive React component library built on Radix UI
- **Radix UI**: Unstyled, accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework

### Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across the entire application
- **Drizzle Kit**: Database migration and schema management

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds React app to `dist/public`
- **Backend**: esbuild bundles Express server to `dist/index.js`
- **Database**: Drizzle migrations applied via `npm run db:push`

### Environment Configuration
- **Development**: Uses Vite dev server with Express API proxy
- **Production**: Express serves static files and API routes
- **Database**: PostgreSQL connection via DATABASE_URL
- **AI**: Google API key for Gemini AI access

### Key Scripts
- `npm run dev`: Start development server with hot reload
- `npm run build`: Build production bundle
- `npm run start`: Start production server
- `npm run db:push`: Apply database schema changes

The application is designed to be deployed on platforms like Replit, with support for both development and production environments through the Vite configuration and build process.