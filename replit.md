# replit.md

## Overview

This is a full-stack development environment application built to replicate Replit's functionality locally. The system provides a web-based IDE with integrated terminal, file management, virtual machine orchestration, tool marketplace, and service management capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a modern full-stack architecture with clear separation between client and server concerns:

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **Theme**: GitHub-inspired dark theme with custom CSS variables

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Development**: Vite for development server and HMR
- **Build**: esbuild for production builds

## Key Components

### Authentication System
- JWT-based authentication with bcrypt password hashing
- User registration and login with proper error handling
- Token-based session management with localStorage

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: Neon serverless PostgreSQL (configured via DATABASE_URL)
- **Schema**: Comprehensive schema covering users, projects, files, VMs, tools, and services
- **Migrations**: Drizzle Kit for schema migrations

### Virtual Machine Management
- VM lifecycle management (create, start, stop, delete)
- Docker-based VM implementation for development
- VM status tracking and resource allocation
- Command execution within VMs

### File Management
- Project-based file organization
- Directory and file CRUD operations
- File content management with real-time updates
- Path-based file resolution

### Tool Marketplace
- Tool discovery and installation system
- Category-based tool organization
- Docker-based tool deployment
- User tool tracking and management

### Real-time Communication
- WebSocket integration for terminal sessions
- Real-time command execution and output streaming
- Terminal session management per VM

### Service Management
- Docker service orchestration
- Service lifecycle management
- Port management and configuration
- Service status monitoring

## Data Flow

1. **User Authentication**: Login/register → JWT token → localStorage storage
2. **Project Management**: Create/select project → file explorer → code editor
3. **VM Interaction**: Project → VM creation → terminal connection → command execution
4. **Tool Installation**: Marketplace → tool selection → installation → VM integration
5. **File Operations**: File explorer → CRUD operations → database persistence
6. **Real-time Updates**: WebSocket connection → terminal I/O → live updates

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL connection
- **drizzle-orm**: Database ORM and query builder
- **express**: Web server framework
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT token management
- **ws**: WebSocket server implementation

### Frontend Dependencies
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **wouter**: Lightweight routing
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management

### Development Dependencies
- **vite**: Development server and bundler
- **tsx**: TypeScript execution
- **drizzle-kit**: Database schema management
- **esbuild**: Production bundling

## Deployment Strategy

### Development Mode
- Vite dev server for frontend with HMR
- tsx for TypeScript execution without compilation
- Hot reload for both client and server code
- Automatic Drizzle schema synchronization

### Production Build
- Vite builds optimized client bundle to `dist/public`
- esbuild compiles server to `dist/index.js`
- Static file serving from Express
- Environment-based configuration

### Database Management
- Drizzle migrations stored in `./migrations`
- Schema defined in `shared/schema.ts`
- Push-based development workflow with `db:push`
- Production migrations via Drizzle Kit

### Environment Configuration
- `DATABASE_URL` required for PostgreSQL connection
- `JWT_SECRET` for authentication security
- `NODE_ENV` for environment detection
- Neon serverless PostgreSQL for scalable database hosting

### Key Architectural Decisions

1. **Shared Schema**: Common TypeScript types between client and server for type safety
2. **Modular Services**: Separate service classes for authentication, VMs, files, and tools
3. **WebSocket Integration**: Real-time terminal functionality via WebSocket server
4. **Component-Based UI**: Radix UI primitives with Tailwind for consistent design
5. **Database-First**: Drizzle ORM with PostgreSQL for robust data persistence
6. **Docker Abstraction**: VM and tool management abstracted through Docker containers