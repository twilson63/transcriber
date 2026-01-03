# Agent Development Guide

This document provides coding guidelines and conventions for AI agents working in this codebase.

## Project Overview

YouTube Transcript API - A stateless REST service that fetches YouTube video transcripts using yt-dlp.
- **Stack**: TypeScript, Node.js, Express
- **Module System**: ES Modules (type: "module")
- **Architecture**: Stateless API with middleware chain (auth → rate limit → service → error handler)

## Build, Lint & Test Commands

### Development
```bash
npm run dev              # Start dev server with hot reload (nodemon + ts-node)
npm run build            # Compile TypeScript to dist/
npm start                # Run compiled production code
```

### Code Quality
```bash
npm run lint             # Check code with ESLint
npm run lint:fix         # Auto-fix ESLint issues
npm run format           # Format code with Prettier
```

### Testing
```bash
npm test                 # Currently placeholder - no tests configured
# To run a single test file (when tests exist):
# npm test -- path/to/test.spec.ts
```

### Manual Testing
```bash
# Health check
curl http://localhost:3000/health

# Test transcript endpoint
curl -H "X-API-Key: test-api-key-12345" \
  http://localhost:3000/api/transcript/VIDEO_ID
```

## TypeScript Configuration

### Compiler Options (tsconfig.json)
- **Module**: ES2020 (must use `.js` extensions in imports)
- **Target**: ES2020
- **Strict Mode**: Enabled with additional strictness flags
- **Output**: `dist/` directory with source maps and declarations
- **Important Flags**:
  - `noUnusedLocals: true`
  - `noUnusedParameters: true` 
  - `noImplicitReturns: true`
  - `noFallthroughCasesInSwitch: true`

## Code Style Guidelines

### Import Statements

**CRITICAL**: When using ES modules (type: "module"), always include `.js` extension in relative imports:

```typescript
// ✅ CORRECT
import { TranscriptService } from './services/transcript.service.js';
import { authenticateApiKey } from './middleware/auth.js';

// ❌ WRONG - Will fail at runtime with ES modules
import { TranscriptService } from './services/transcript.service';
```

**Import Order**:
1. Node.js built-in modules
2. External dependencies
3. Internal modules (with `.js` extension)

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import express from 'express';
import cors from 'cors';
import { TranscriptService } from './services/transcript.service.js';
```

### Formatting (Prettier)
- **Semicolons**: Required
- **Quotes**: Single quotes for strings
- **Line Length**: 80 characters max
- **Indentation**: 2 spaces (no tabs)
- **Trailing Commas**: ES5 style (arrays/objects only)
- **Arrow Functions**: Always use parentheses around params

### TypeScript Types

**Always provide explicit return types for functions**:
```typescript
// ✅ CORRECT
async getTranscript(videoId: string): Promise<TranscriptResult> {
  // implementation
}

// ✅ CORRECT - void for middleware
export const authenticateApiKey = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // implementation
};
```

**Interface over Type for object shapes**:
```typescript
// ✅ CORRECT
export interface TranscriptResult {
  text: string;
  title: string;
  duration: number;
  timestamp: string;
}

// Use internal interfaces for implementation details
interface JSON3Event {
  tStartMs?: number;
  dDurationMs?: number;
}
```

**Avoid `any` type** - ESLint will warn. Use proper types or `unknown`:
```typescript
// ⚠️ Only when catching errors
catch (error: any) {
  console.error('Error:', error.message);
}
```

### Naming Conventions

- **Files**: `kebab-case.ts` (e.g., `transcript.service.ts`, `auth.ts`)
- **Classes**: `PascalCase` (e.g., `TranscriptService`)
- **Functions/Variables**: `camelCase` (e.g., `getTranscript`, `videoId`)
- **Constants**: `UPPER_SNAKE_CASE` for true constants
- **Interfaces**: `PascalCase` (e.g., `TranscriptResult`)
- **Unused params**: Prefix with `_` (e.g., `_req`, `_next`)

### Error Handling

**Consistent error throwing**:
```typescript
// Throw specific error messages
if (!text) {
  throw new Error('No transcript available');
}

// All service errors become "No transcript available" for API consistency
catch (error: any) {
  console.error('Transcript fetch error:', error.message);
  throw new Error('No transcript available');
}
```

**Centralized error handling in Express**:
```typescript
// Global error middleware catches all errors
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err.message);
  
  if (err.message === 'No transcript available') {
    res.status(404).json({ error: 'No transcript available' });
    return;
  }
  
  res.status(500).json({ error: 'Internal server error' });
});
```

### JSDoc Comments

Add JSDoc for all exported functions:
```typescript
/**
 * Fetches the transcript for a given YouTube video ID using yt-dlp
 * @param videoId - YouTube video ID
 * @returns Promise containing the transcript text and metadata
 * @throws Error if transcript is not available
 */
async getTranscript(videoId: string): Promise<TranscriptResult> {
  // implementation
}
```

## Project Structure

```
src/
├── index.ts                    # Express app entry point
├── middleware/
│   ├── auth.ts                # API key authentication
│   └── rateLimiter.ts         # Rate limiting (1 req/30s)
└── services/
    └── transcript.service.ts  # YouTube transcript fetching via yt-dlp
```

## Environment Variables

Required in `.env`:
```bash
API_KEY=your-secret-api-key    # Master API key for authentication
PORT=3000                       # Server port
NODE_ENV=development            # Environment (development/production)
```

## Key Dependencies

- **yt-dlp** (system binary): Downloads YouTube subtitles - must be installed on host
- **express**: Web framework
- **express-rate-limit**: Rate limiting middleware
- **dotenv**: Environment variable management

## Common Patterns

### Middleware Pattern
```typescript
export const middlewareName = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Validation/processing
  if (error) {
    res.status(401).json({ error: 'Error message' });
    return;
  }
  next();
};
```

### Async Route Handlers
```typescript
app.get('/path', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // async work
    res.status(200).json({ data });
  } catch (error: any) {
    next(error); // Pass to error handler
  }
});
```

## Important Notes

- **No database**: Stateless design - no persistent storage
- **Cleanup**: Always clean up temp files (e.g., subtitle downloads)
- **Logging**: Use `console.log`/`console.error` - no-console ESLint rule is off
- **Headers**: Set custom headers before sending response body
- **Validation**: Validate input (e.g., video ID format) before processing
