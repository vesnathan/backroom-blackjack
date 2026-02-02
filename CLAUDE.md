# Backroom Blackjack - Claude Code Guide

## Project Overview

**Backroom Blackjack** - Blackjack card counting training game.
- Next.js frontend-focused application
- Complex game state management
- React hooks patterns and animations

**Location**: `/home/liqk1ugzoezh5okwywlr_/dev/card-counting-trainer/`

---

## MANDATORY: Before Writing AppSync Resolvers

**STOP.** Before writing or modifying ANY file in `backend/resolvers/`:

1. Read the "AppSync Resolver Restrictions" section below
2. Read ARCHITECTURE_GUIDELINES.md section "AppSync Resolver Restrictions"
3. Verify code against this checklist:

```
- [ ] util.time.nowISO8601() NOT Date/Date.now()
- [ ] util.autoId() NOT uuid
- [ ] Unary + operator NOT parseInt/parseFloat/Number()
- [ ] Record<string, boolean> NOT Set/Map
- [ ] for...of loops ONLY, no traditional for/while
- [ ] No inline functions in .map()/.filter()/.reduce()/.sort()
- [ ] No continue statements - use flag variables
- [ ] util.error() ONLY at top level of request/response
- [ ] No async/await
```

**DO NOT write resolver code until you have verified against these restrictions.**

---

## Shared Documentation

**IMPORTANT**: Read the architecture guidelines that apply to ALL projects:

- **Architecture Guidelines**: `/home/liqk1ugzoezh5okwywlr_/dev/ARCHITECTURE_GUIDELINES.md`
  - **Debugging & Investigation Methodology** (CRITICAL - always investigate root causes thoroughly)
  - **Deploy User Permissions**: NEVER add permissions to deploy users - fix CloudFormation instead
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
- **Random numbers**: `util.math.randomDouble()` - NOT `Math.random()`
- **Errors**: `return util.error(message, type)` - MUST include `return`

### NOT Allowed

- `new Date()`, `Date.now()` - causes deployment failure
- `Math.random()`, `Math.floor()` - use `util.math.randomDouble()`, `util.math.roundNum()`
- **`parseInt()`, `parseFloat()`, `Number()`** - use unary `+` operator: `+(value || 0)`
- **`Set`, `Map`, `WeakSet`, `WeakMap`** - use `Record<string, boolean>` or arrays instead
- External npm packages (uuid, etc.)
- `while`, `do...while` loops
- **ALL traditional `for` loops** - only `for...of` and `for...in` allowed
- **Inline functions** in array methods (`.map()`, `.filter()`, `.sort()`, `.reduce()`)
- `continue` statements
- `async`/`await` - resolvers are synchronous

### Adding New Resolvers (Two-Step Process)

**CRITICAL: Creating a resolver file is not enough.** You must also register it in CloudFormation.

1. **Create resolver file**: `backend/resolvers/{Domain}/{Type}/Type.fieldName.ts`
2. **Add to CloudFormation**: `deploy/resources/AppSync/appsync.yaml`

```yaml
MyResolver:
  Type: AWS::AppSync::Resolver
  Properties:
    ApiId: !GetAtt GraphQlApi.ApiId
    TypeName: Mutation  # or Query
    FieldName: myFieldName
    DataSourceName: !GetAtt MainTableDataSource.Name
    Kind: UNIT
    Runtime:
      Name: APPSYNC_JS
      RuntimeVersion: 1.0.0
    CodeS3Location: !Sub "s3://${TemplateBucketName}/resolvers/${Stage}/${ResolversBuildHash}/Domain/Type/Type.myFieldName.js"
```

3. **Deploy**: `yarn deploy`

**Common mistake:** Forgetting step 2 causes silent failures - resolver compiles to S3 but AppSync doesn't know about it.

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

## AppSync GraphQL Rules

### Subscription Type Matching
**CRITICAL**: Subscription return types must match ALL subscribed mutations' return types.

```graphql
# CORRECT - types match
onNewMessage(channelId: ID!): Message
  @aws_subscribe(mutations: ["sendMessage"])  # sendMessage returns Message

# WRONG - deployment fails
onGameUpdated(gameId: ID!): Game
  @aws_subscribe(mutations: ["submitSelection"])  # returns SubmitResult, not Game!
```

### Resolver Format
- AppSync JS runtime provides `util` as a global - do NOT import it
- Use `export function request(ctx)` and `export function response(ctx)`

---

## Notes for Future Sessions

- Always read this file at the start of a new session
- Update this file with significant changes and lessons learned
- User prefers concise, technical communication
- Focus on facts and problem-solving over validation
