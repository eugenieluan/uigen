# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm test             # Run all tests
npm test -- <name>  # Run a specific test file by name pattern
npm run setup        # First-time setup: install deps, generate Prisma client, run migrations
npm run db:reset     # Reset database (destructive)
```

## Environment

Create a `.env` file with `ANTHROPIC_API_KEY` to use real Claude AI. Without it, the app falls back to a `MockLanguageModel` that generates static placeholder code.

## Architecture

UIGen is an AI-powered React component generator. Users describe components in natural language, Claude generates them via tool calls, and a live preview renders the result. Projects can be saved to a database for authenticated users; anonymous users get a fully functional session with no persistence.

### Core Data Flow

1. User submits a prompt in `ChatInterface` → POST to `/api/chat/route.ts`
2. The API streams a response from Claude (Haiku 4.5) with tool calls
3. Tool calls (`str_replace_editor`, `file_manager`) update the `VirtualFileSystem` held in `FileSystemContext`
4. `PreviewFrame` transpiles the updated files via Babel and re-renders the component in a sandboxed iframe
5. On finish, if authenticated, the chat messages + serialized VirtualFileSystem are saved to the database as a `Project`

### Key Abstractions

- **`VirtualFileSystem`** (`src/lib/file-system.ts`): In-memory file tree. No disk I/O. Serializes to JSON for database storage. The single source of truth for all generated code.
- **`FileSystemContext`** (`src/lib/contexts/file-system-context.tsx`): React context wrapping VirtualFileSystem, making it reactive across the UI.
- **`ChatContext`** (`src/lib/contexts/chat-context.tsx`): Wraps Vercel AI SDK's `useChat` hook; handles streaming, tool call execution, and saving on finish.
- **AI Tools** (`src/lib/tools/`): `str_replace_editor` (create/edit files) and `file_manager` (rename/delete). These are the only way Claude modifies files.
- **`provider.ts`** (`src/lib/provider.ts`): Configures the language model. Swaps in `MockLanguageModel` when no API key is present. Prompt caching is enabled.

### Database Schema

The database schema is defined in the `prisma/schema.prisma` file. Reference it anytime you need to understand the structure of data stored in the database.

### Auth & Persistence

- JWT sessions stored in httpOnly cookies (7-day expiry). `src/lib/auth.ts` handles token signing/verification.
- Middleware (`src/middleware.ts`) protects `/api/projects` and `/api/filesystem`.
- Database: SQLite via Prisma. Schema has two models: `User` and `Project`. `Project.messages` and `Project.data` are JSON columns storing chat history and the serialized VirtualFileSystem respectively.

## Code Style

Use comments sparingly. Only comment complex code.

### Tech Stack

- **Framework**: Next.js 15 (App Router, Turbopack)
- **AI**: Vercel AI SDK + Anthropic Claude (`@ai-sdk/anthropic`)
- **UI**: Tailwind CSS v4, Radix UI, React Resizable Panels
- **Editor**: Monaco Editor
- **Preview**: Babel standalone (JSX transpilation in-browser)
- **DB/ORM**: SQLite + Prisma 6
- **Testing**: Vitest + Testing Library (jsdom)
