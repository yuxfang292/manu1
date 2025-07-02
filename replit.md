# Regulatory Compliance Explorer

## Overview

This is a full-stack web application built for compliance and regulatory change professionals in banking. The system provides a chat-based interface for exploring financial obligations and regulations, with advanced filtering capabilities and summarization features for generating PDF reports.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with dashboard-specific color palette
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **State Management**: React hooks with TanStack Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite with custom configuration for development and production
- **Layout**: Professional dashboard with collapsible sidebar and main content area

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with structured error handling
- **Development**: Hot module replacement via Vite middleware in development

### Data Storage Solutions
- **Database**: CSV-based file storage (Production)
- **Data Files**: CSV files in data/ folder for extracts, keywords, summaries, and users
- **Storage Implementation**: CSVStorage class with CSV file reading/writing
- **Data Management**: Custom CSV reader with type conversion utilities
- **File Structure**: Separate CSV files for each data type with proper headers

## Key Components

### Dashboard Layout
- Professional sidebar navigation with collapsible functionality
- Module-based navigation (RegSearch, RegDashboard, RegTrend, etc.)
- User information display with welcome message
- Static 3D cube logo with blue color scheme

### Search Interface
- Comprehensive search screen with AI assistant integration
- Quick filter badges for common search criteria
- Compliance area exploration cards with visual icons
- Recent activity tracking and status badges
- Interactive search with intelligent suggestions

### Compliance Explorer
- Chat-based interface for regulatory guidance
- Pre-configured compliance category buttons
- Visual category cards with descriptions and counts
- Smooth transitions between search and exploration modes

### Data Table View
- Professional table layout matching enterprise dashboard standards
- Sortable columns with regulatory extract information
- Multi-select functionality with checkboxes
- Pagination controls and result counts
- Status indicators and priority badges

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
- July 02, 2025: Initial setup
- July 02, 2025: Replaced Claude API with Gemini 2.5 Pro for AI Assistant
- July 02, 2025: Updated landing page to show regulatory groups table by default
- July 02, 2025: Added AI chatbot button in top right corner of regulatory table header
- July 02, 2025: Implemented MCP (Model Context Protocol) integration with four functions
- July 02, 2025: Replaced all "AI Assistant" references with "CUBOT" branding
- July 02, 2025: Added chat mode/research mode dropdown selector in AI chat interface
- July 02, 2025: Implemented backend research workflow with 4-step process: keyword generation, document search, quality assessment, and comprehensive response generation
- July 02, 2025: **MAJOR CHANGE**: Removed all PostgreSQL connections and switched to CSV-based data storage system

## User Preferences

Preferred communication style: Simple, everyday language.