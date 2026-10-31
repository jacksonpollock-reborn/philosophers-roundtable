@AGENTS.md

# Philosopher's Roundtable

A local web app where AI-simulated personas (philosophers, psychologists, politicians, economists, religious figures) discuss topics in threaded debates. The user posts topics or fetches trending ones, selects personas, and watches them debate from unique perspectives. Personal learning tool for exploring ideas from multiple viewpoints.

## Quick Start

```bash
npm run dev          # Start at http://localhost:3000
npx prisma db seed   # Re-seed default personas + topics (resets DB)
npx prisma studio    # Browse/edit database visually
```

First-time setup: Go to Settings page, enter a free Gemini API key from https://aistudio.google.com/apikey

## Tech Stack

- **Framework**: Next.js 16.2.2 (App Router, TypeScript)
- **UI**: Tailwind CSS v4 + shadcn/ui (dark theme default)
- **Database**: SQLite via Prisma 7.x (file: `dev.db` in project root)
- **Primary LLM**: Google Gemini (`@google/generative-ai`) - free tier: 15 RPM, 1M tokens/day with gemini-2.0-flash
- **Alt LLM**: Ollama (local models, configurable in Settings)
- **Streaming**: Server-Sent Events (SSE) for real-time persona responses
- **Markdown**: `react-markdown` for rendering persona responses

## Project Structure

```
src/
  app/
    layout.tsx                    # Root layout with fixed left sidebar nav
    page.tsx                      # Home feed - lists all discussions
    discussions/
      new/page.tsx                # Create discussion: topic + persona selection
      [id]/page.tsx               # Discussion thread view (main page)
    personas/
      page.tsx                    # Persona library grid
      new/page.tsx                # Custom persona creation form
    topics/page.tsx               # Browse/fetch trending topics
    settings/page.tsx             # LLM provider config (API key, model)
    api/
      discussions/route.ts        # GET list, POST create
      discussions/[id]/route.ts   # GET detail, DELETE
      discussions/[id]/messages/route.ts  # GET messages, POST human message
      discussions/[id]/generate/route.ts  # POST triggers SSE stream of AI responses
      personas/route.ts           # GET list, POST create
      personas/[id]/route.ts      # GET, PUT, DELETE
      settings/route.ts           # GET, PUT (singleton settings row)
      topics/route.ts             # GET saved topics
      topics/trending/route.ts    # GET fetch trending via Gemini search grounding
  lib/
    db.ts                         # Prisma client singleton
    llm/
      provider.ts                 # LLMProvider interface (generateText, generateStream)
      gemini.ts                   # Google Gemini implementation
      ollama.ts                   # Ollama implementation
      factory.ts                  # getProvider() reads Settings from DB, returns provider
    discussion/
      engine.ts                   # generateRound(): orchestrates turn-by-turn persona responses
    personas/
      prompt-builder.ts           # Builds 3-layer prompt (identity + behavior + context)
  components/ui/                  # shadcn/ui primitives (button, card, input, etc.)
prisma/
  schema.prisma                   # Data model (Persona, Discussion, Message, Topic, Settings)
  seed.ts                         # Seeds 20 default personas + 10 evergreen topics + settings
  migrations/                     # SQLite migrations
```

## Data Model

- **Persona**: name, title, era, avatarColor, systemPrompt, isDefault
- **Discussion**: title, description, status (active/paused/completed), totalRounds
- **DiscussionPersona**: join table with turnOrder (determines speaking sequence)
- **Message**: content, round number, personaId (null = human user), replyToId
- **Topic**: title, description, source, category
- **Settings**: singleton row - provider (gemini/ollama), geminiApiKey, geminiModel, ollamaBaseUrl, ollamaModel

## 20 Pre-built Personas

| Name | Category |
|------|----------|
| Socrates | Philosophy |
| Nietzsche | Philosophy |
| Simone de Beauvoir | Philosophy |
| Immanuel Kant | Philosophy |
| Sigmund Freud | Psychology |
| Carl Jung | Psychology |
| Jacques Lacan | Psychology/Philosophy |
| Slavoj Zizek | Philosophy/Cultural Criticism |
| Adam Smith | Economics |
| Karl Marx | Economics |
| Machiavelli | Politics |
| Donald Trump | Politics |
| Xi Jinping | Politics |
| Vladimir Putin | Politics |
| Jesus of Nazareth | Religion |
| The Buddha | Religion/Philosophy |
| Shiva | Hindu Deity |
| Confucius | Philosophy |
| Sun Tzu | Military Strategy |
| Lao Tzu | Philosophy |

## Core Architecture

### Discussion Engine (`src/lib/discussion/engine.ts`)
- `generateRound(discussionId)` - generates one round where each persona responds in turn order
- Each persona sees the full message history including earlier responses in the same round
- Returns an SSE stream: `{type: 'typing', personaId}` -> `{type: 'chunk', personaId, text}` -> `{type: 'done', personaId, message}`
- 1-second delay between persona calls to respect Gemini rate limits

### Prompt Builder (`src/lib/personas/prompt-builder.ts`)
Three-layer system prompt:
1. **Identity**: persona name, title, era, their system prompt
2. **Behavior rules**: stay in character, 2-4 paragraphs, engage others by name, use characteristic style
3. **Context**: topic title/description, full message history, instruction to respond

### LLM Provider (`src/lib/llm/`)
- `LLMProvider` interface: `generateText()` and `generateStream()`
- `GeminiProvider`: uses `@google/generative-ai` with systemInstruction
- `OllamaProvider`: calls `http://localhost:11434/api/generate`
- `getProvider()` factory reads Settings from DB, returns appropriate provider

### Topic Fetching
- Primary: Gemini with Google Search grounding (`googleSearchRetrieval` tool) for real-time trending topics
- Fallback: 10 evergreen philosophical topics seeded in DB

## Key Patterns

- All pages are `"use client"` components that fetch from API routes
- API routes use Prisma client from `src/lib/db.ts`
- Discussion generation uses `ReadableStream` + SSE (`text/event-stream`)
- `useSearchParams()` on `/discussions/new` is wrapped in `<Suspense>` (Next.js requirement)
- Persona avatars use colored circles with first-letter initials
- Dark theme by default via `class="dark"` on `<html>`

## Common Tasks

### Add a new pre-built persona
Edit `prisma/seed.ts`, add to the `personas` array, run `npx prisma db seed`

### Change the LLM model
Go to Settings page in the UI, or directly update the Settings table in `dev.db`

### Reset the database
```bash
rm dev.db
npx prisma migrate dev
npx prisma db seed
```

### Add a new LLM provider
1. Create `src/lib/llm/newprovider.ts` implementing `LLMProvider`
2. Add case to `src/lib/llm/factory.ts`
3. Add provider option to Settings page UI and Prisma schema
