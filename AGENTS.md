# Agent Development Guide

Coding guidelines for AI agents working in this codebase.

## Project Overview

YouTube Transcript API - A stateless REST service that fetches YouTube video transcripts using yt-dlp.

- **Stack**: TypeScript, Node.js, Express
- **Module System**: ES Modules (`"type": "module"`)
- **Architecture**: Stateless API with middleware chain (auth -> rate limit -> service -> error handler)

## Build, Lint & Test Commands

```bash
npm run dev              # Start dev server with hot reload
npm run build            # Compile TypeScript to dist/
npm start                # Run compiled production code
npm run lint             # Check code with ESLint
npm run lint:fix         # Auto-fix ESLint issues
npm run format           # Format code with Prettier
npm test                 # Placeholder - no tests configured yet
# Single test: npm test -- path/to/test.spec.ts

# Manual Testing
curl http://localhost:3000/health
curl -H "X-API-Key: test-api-key-12345" http://localhost:3000/api/transcript/VIDEO_ID
```

## Project Structure

```
src/
├── index.ts                    # Express app entry point
├── middleware/
│   ├── auth.ts                 # API key authentication
│   └── rateLimiter.ts          # Rate limiting (1 req/30s)
└── services/
    └── transcript.service.ts   # YouTube transcript fetching via yt-dlp
```

## Code Style Guidelines

### Import Statements

**CRITICAL**: Always include `.js` extension in relative imports (ES modules requirement):

```typescript
// CORRECT
import { TranscriptService } from './services/transcript.service.js';
// WRONG - Will fail at runtime
import { TranscriptService } from './services/transcript.service';
```

**Import Order**: Node.js built-ins -> External deps -> Internal modules (with `.js`)

### Formatting (Prettier)

| Setting         | Value     |
| --------------- | --------- |
| Semicolons      | Required  |
| Quotes          | Single    |
| Line Length     | 80 chars  |
| Indentation     | 2 spaces  |
| Trailing Commas | ES5 style |
| Arrow Parens    | Always    |

### TypeScript Types

**Explicit return types required**:

```typescript
async getTranscript(videoId: string): Promise<TranscriptResult> { }
export const auth = (req: Request, res: Response, next: NextFunction): void => { };
```

**Interface over Type for object shapes**. **Avoid `any`** - exception: error catching.

### Naming Conventions

- **Files**: `kebab-case.ts` (e.g., `transcript.service.ts`)
- **Classes**: `PascalCase` (e.g., `TranscriptService`)
- **Functions/Variables**: `camelCase` (e.g., `getTranscript`)
- **Constants**: `UPPER_SNAKE_CASE`
- **Unused params**: Prefix with `_` (e.g., `_req`, `_next`)

### Error Handling

Centralized - throw errors, let global middleware handle:

```typescript
if (!text) throw new Error('No transcript available');  // In service
catch (error: any) { next(error); }  // In route - pass to error handler
```

### JSDoc Comments

Required for exported functions:

```typescript
/**
 * Fetches transcript for a YouTube video ID using yt-dlp
 * @param videoId - YouTube video ID
 * @returns Promise with transcript text and metadata
 * @throws Error if transcript unavailable
 */
```

## Common Patterns

### Middleware

```typescript
export const middleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error) {
    res.status(401).json({ error: 'Message' });
    return;
  }
  next();
};
```

### Async Route Handlers

```typescript
app.get(
  '/path',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({ data: await service.doWork() });
    } catch (error: any) {
      next(error);
    }
  }
);
```

## TypeScript Configuration

- **Module**: ES2020 (requires `.js` extensions)
- **Target**: ES2020
- **Strict Mode**: Enabled (`noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`)

## Environment Variables

```bash
API_KEY=your-secret-api-key    # Master API key
PORT=3000                       # Server port
NODE_ENV=development            # Environment
```

## Key Dependencies

- **yt-dlp** (system binary): Must be installed on host
- **express**: Web framework
- **express-rate-limit**: Rate limiting
- **dotenv**: Environment variables

## Important Notes

- **Stateless**: No database or persistent storage
- **Cleanup**: Always clean up temp files (subtitle downloads)
- **Logging**: `console.log`/`console.error` (no-console rule disabled)
- **Headers**: Set custom headers before sending response body
- **Validation**: Validate input before processing (video ID: 11 chars)
