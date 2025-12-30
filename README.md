# Card Counting Trainer

Interactive blackjack training game with card counting, basic strategy hints, and AI opponents. Practice your blackjack skills and learn card counting techniques in a realistic casino environment.

## Features

- **Realistic Blackjack Gameplay**: Full blackjack rules with split, double down, insurance
- **Card Counting**: Real-time running count display and true count calculation
- **Basic Strategy Hints**: Learn optimal blackjack strategy
- **AI Opponents**: 7 AI players with different playing styles and reactions
- **Animated Cards**: Smooth card dealing animations
- **Customizable Settings**: Adjust number of decks, table rules, and difficulty
- **Statistics Tracking**: Track your performance over time

## Tech Stack

**Frontend:**
- Next.js 14 (App Router with static export)
- TypeScript
- Tailwind CSS
- Canvas API (Card animations)
- React hooks for game state management

**Backend:**
- AWS AppSync (GraphQL API for user stats)
- DynamoDB (User statistics)
- AWS Cognito (Authentication)
- CloudFront (CDN)
- S3 (Frontend hosting)

## Prerequisites

- Node.js 18+
- Yarn (package manager)
- AWS Account with credentials
- AWS CLI (installed locally via `./install-aws-cli-local.sh`)

## Setup

### 1. Install Dependencies

```bash
yarn install
```

### 2. Configure AWS Credentials

Copy `.env.example` to `.env` and fill in your AWS credentials:

```bash
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-southeast-2
AWS_ACCOUNT_ID=your_account_id
```

### 3. Install AWS CLI Locally

```bash
./install-aws-cli-local.sh
```

## Development

### Run Frontend Dev Server

```bash
yarn dev
```

This starts the Next.js dev server at `http://localhost:3000`

### Type Checking

```bash
yarn tsc
```

### Linting

```bash
yarn lint
```

## Deployment

### Deploy to Development

```bash
yarn deploy:dev
```

### Deploy to Production

```bash
yarn deploy:prod
```

## Project Structure

```
card-counting-trainer/
├── frontend/           # Next.js application
│   ├── src/
│   │   ├── app/       # App router pages
│   │   ├── components/
│   │   │   ├── BlackjackGameUI.tsx
│   │   │   ├── PlayingCard.tsx
│   │   │   ├── StatsBar.tsx
│   │   │   └── GameSettingsModal.tsx
│   │   ├── hooks/     # Game logic hooks
│   │   │   ├── useBlackjackGame.ts
│   │   │   ├── useGameActions.ts
│   │   │   └── useCardAnimations.ts
│   │   ├── lib/       # Game utilities
│   │   │   ├── cardCounting.ts
│   │   │   ├── basicStrategy.ts
│   │   │   └── aiPlayers.ts
│   │   └── types/     # TypeScript types
│   └── package.json
├── backend/           # AppSync & Lambda code (future)
│   ├── schema/        # GraphQL schema files
│   └── resolvers/     # AppSync resolver functions
├── deploy/            # Deployment infrastructure
│   ├── resources/     # CloudFormation templates
│   └── utils/         # Deployment utilities
└── documents/         # Project documentation
```

## Game Features

### Card Counting

The game implements the Hi-Lo card counting system:
- Low cards (2-6): +1
- Neutral (7-9): 0
- High cards (10-A): -1

The running count is displayed in the stats bar. True count is calculated by dividing running count by remaining decks.

### Basic Strategy

The game provides hints based on basic blackjack strategy, accounting for:
- Your hand total
- Dealer's up card
- Soft vs hard hands
- Pair splitting opportunities
- Double down opportunities

### AI Opponents

7 AI players sit at the table with you, each with unique personalities and playing styles:
- Conservative players (low risk)
- Aggressive players (high risk)
- Card counters
- Basic strategy players
- Emotional players (react to wins/losses)

### Animations

Card dealing animations use precise grid positioning to ensure cards fly to their exact final positions. See `CLAUDE.md` for animation implementation details.

## Configuration

Game settings can be adjusted in the Settings modal:
- Number of decks (1-8)
- Dealer hits on soft 17
- Blackjack payout (3:2 or 6:5)
- Surrender allowed
- Double after split
- Re-splitting aces

## Related Projects

See `CLAUDE.md` for cross-project references:

- **The Story Hub**: Reference for AWS deployment patterns
- **CloudWatch Live**: Reference for Cognito auth
- **Lawn Order**: Business management system
- **App Builder Studio**: Visual app builder

## Documentation

See `documents/` folder for setup guides and the `CLAUDE.md` file for detailed implementation notes on:
- Card animation position calculations
- Fixed issues and their solutions
- Game constants and layout

## Bug Reports

Bug reports and issue submissions are welcome! Please open an issue on GitHub if you encounter any problems.

## License

Copyright © 2024. All rights reserved.
