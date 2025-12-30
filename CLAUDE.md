# Card Counting Trainer - Claude Code Guide

## Project Overview

**Card Counting Trainer** - Blackjack card counting training game.
- Next.js frontend-focused application
- Complex game state management
- React hooks patterns and animations

**Location**: `/home/liqk1ugzoezh5okwywlr_/dev/card-counting-trainer/`

---

## Shared Documentation

**IMPORTANT**: Read the architecture guidelines that apply to ALL projects:

- **Architecture Guidelines**: `/home/liqk1ugzoezh5okwywlr_/dev/ARCHITECTURE_GUIDELINES.md`
  - Includes all standards, patterns, and project compliance status

**Reference Implementation**: Check The Story Hub for patterns:
- `/home/liqk1ugzoezh5okwywlr_/dev/the-story-hub/`

---

## File Separation (Reference Example)

This project demonstrates excellent file separation for game logic:

- **Pure game logic**: `/lib/gameActions.ts`, `/lib/dealer.ts`, `/lib/deck.ts`
- **Context per concern**: GameStateContext, GameActionsContext, UIStateContext
- **Hooks as orchestrators**: `useBlackjackGame.ts`, `useGameInteractions.ts`
- Game rules are pure functions, not in components or hooks

---

## Validation Patterns

Auth forms use Zod for validation:

```typescript
// /schemas/AuthSchemas.ts
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Controller uses safeParse
const result = LoginSchema.safeParse(formData);
if (!result.success) {
  // Handle validation errors
}
```

Auth forms use `useState` (allowed per guidelines for authentication forms).

---

## AppSync Resolver Restrictions

AppSync resolvers run in a restricted JavaScript environment.

### Required Patterns

- **Imports**: `import { util, Context } from "@aws-appsync/utils"`
- **IDs**: `util.autoId()` - NOT `uuid`
- **Timestamps**: `util.time.nowISO8601()` - NOT `new Date().toISOString()`
- **Errors**: `return util.error(message, type)` - MUST include `return`

### NOT Allowed

- `new Date()`, `Date.now()` - causes deployment failure
- External npm packages (uuid, etc.)
- `while`, `do...while` loops
- **ALL traditional `for` loops** - only `for...of` and `for...in` allowed
- **Inline functions** in array methods (`.map()`, `.filter()`, `.sort()`)
- `continue` statements

---

## Commands

### Development

```bash
yarn dev                   # Start frontend dev server
yarn build                 # Build frontend
yarn lint                  # Run linter
yarn tsc                   # Type check TypeScript
```

### Deployment (USER ONLY - NEVER run automatically)

**Claude MUST NEVER run deploy commands directly.**
- Explain what needs to be deployed and what command to run
- You may prepare code and configurations for deployment

---

## Git Commit Process

**ALWAYS run BEFORE staging and committing:**

1. `yarn lint` - Run linter
2. `yarn tsc` - Type check TypeScript
3. Format with Prettier if available

Only proceed with `git add` and `git commit` after all checks pass.

---

## Compliance Status

**FULLY COMPLIANT** - Excellent file separation for game logic:
- Shared types in `shared/src/types/`
- Zod validation with `Schema.safeParse()` in controllers
- Only 2 justified `any` instances with eslint-disable

---

## Notes for Future Sessions

- Always read this file at the start of a new session
- Update this file with significant changes and lessons learned
- User prefers concise, technical communication
- Focus on facts and problem-solving over validation
