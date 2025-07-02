# Regulatory Compliance Explorer

## Overview

This is a full-stack web application built for compliance and regulatory change professionals in banking. The system provides a chat-based interface for exploring financial obligations and regulations, with advanced filtering capabilities and summarization features for generating PDF reports.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with custom color palette for banking compliance
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **State Management**: React hooks with TanStack Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with structured error handling
- **Development**: Hot module replacement via Vite middleware in development

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM
- **Schema**: Structured tables for extracts, keywords, and summaries
- **Development Storage**: In-memory storage implementation for development/demo
- **Migration**: Drizzle Kit for database schema management

## Key Components

### Chat Interface
- Welcome screen with pre-configured regulatory category buttons
- Free-text search capability
- Smooth transition to data exploration view

### Data Exploration
- Card-based display of regulatory extracts
- Advanced filtering by categories, jurisdictions, priorities, and keywords
- List/grid view toggle
- Pagination for large datasets
- Multi-select capability for summary generation

### Filter System
- Sidebar-based filtering interface
- Real-time filter application
- Category-based organization (Capital Adequacy, Risk Management, etc.)
- Keyword-based search functionality
- Date range filtering

### Summary Generation
- AI-like summary creation from selected extracts
- Three-section format: Overview, Key Points, Conclusion
- Editable summary with preview functionality
- PDF report generation with structured formatting

## Data Flow

1. **User Interaction**: Users start with chat interface or pre-configured buttons
2. **Search Processing**: Queries are processed through search or filter endpoints
3. **Data Retrieval**: Backend retrieves relevant extracts from database/storage
4. **Display**: Frontend renders filtered results in card or list format
5. **Selection**: Users can select multiple extracts for summarization
6. **Summary Generation**: Selected extracts are processed into structured summaries
7. **Report Export**: Summaries are formatted and exported as PDF reports

## External Dependencies

### UI and Styling
- **Radix UI**: Accessibility-focused primitive components
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography

### Data Management
- **TanStack Query**: Server state management and caching
- **Drizzle ORM**: Type-safe database operations
- **Neon Database**: Serverless PostgreSQL provider
- **Zod**: Runtime type validation

### Development Tools
- **Vite**: Fast build tool with HMR
- **TSX**: TypeScript execution for development
- **ESBuild**: Production bundling

## Deployment Strategy

### Development
- Vite dev server with Express middleware
- Hot module replacement for rapid development
- In-memory storage for quick prototyping

### Production
- Frontend: Static build served via Express
- Backend: Bundled Node.js application
- Database: PostgreSQL with connection pooling
- Environment: Configured via DATABASE_URL environment variable

### Build Process
1. Frontend assets built with Vite to `dist/public`
2. Backend bundled with ESBuild to `dist/index.js`
3. Database migrations applied via Drizzle Kit
4. Single deployment artifact with both frontend and backend

## Changelog
- July 02, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.