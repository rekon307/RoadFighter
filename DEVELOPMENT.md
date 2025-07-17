# Multiplayer Road Fighter - Development Guide

A comprehensive guide for developers and AI assistants to understand, develop, and maintain the Multiplayer Road Fighter game for the Whop platform.

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Quick Start](#quick-start)
3. [Architecture](#architecture)
4. [Development Workflow](#development-workflow)
5. [Testing](#testing)
6. [API Documentation](#api-documentation)
7. [Database Schema](#database-schema)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)
10. [Contributing](#contributing)

## 🎯 Project Overview

### What is Multiplayer Road Fighter?

A real-time multiplayer racing game based on the classic Road Fighter, designed for the Whop platform with:

- **Entry Fee System**: Customizable entry fees ($1-$100)
- **Daily Tokens**: Each user gets 3 tokens daily, 1 token per game
- **Leaderboards**: Daily rankings with automatic winner selection
- **Payment Splits**: 25% developer, 25% creator, 50% daily winner
- **Real-time Multiplayer**: Up to 8 players per session

### Technology Stack

```
Frontend:     React 18 + TypeScript + Canvas API
Backend:      Node.js + Express + TypeScript
Database:     PostgreSQL + Prisma ORM
Cache:        Redis
Real-time:    Socket.io
Platform:     Whop (iframe integration)
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Git

### Initial Setup

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd multiplayer-road-fighter
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Services**
   ```bash
   # Start PostgreSQL and Redis
   docker compose up -d postgres redis
   
   # Run database migrations
   npm run db:migrate
   
   # Generate Prisma client
   npm run db:generate
   ```

4. **Development Server**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start individually
   npm run dev:server  # Backend only
   npm run dev:client  # Frontend only
   ```

5. **Verify Setup**
   ```bash
   # Check health endpoint
   curl http://localhost:3001/health
   
   # Run tests
   npm test
   
   # Type checking
   npm run typecheck
   ```

## 🏗️ Architecture

### System Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Whop Platform │◄──►│  Frontend (React) │◄──►│ Backend (Express) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                ▲                        ▲
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │  Canvas Game    │    │  PostgreSQL     │
                       │   Engine       │    │   Database      │
                       └─────────────────┘    └─────────────────┘
                                                         ▲
                                                         │
                                                         ▼
                                              ┌─────────────────┐
                                              │  Redis Cache    │
                                              └─────────────────┘
```

### Directory Structure

```
multiplayer-road-fighter/
├── src/
│   ├── client/          # React frontend
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── store/       # Redux store configuration
│   │   └── utils/       # Frontend utilities
│   ├── server/          # Node.js backend
│   │   ├── controllers/ # Request handlers
│   │   ├── services/    # Business logic
│   │   ├── middleware/  # Express middleware
│   │   ├── models/      # Data models
│   │   ├── routes/      # API route definitions
│   │   └── scripts/     # Database scripts
│   ├── shared/          # Shared code
│   │   ├── types/       # TypeScript type definitions
│   │   ├── utils/       # Shared utilities
│   │   └── constants/   # Application constants
│   └── test/            # Test files
├── prisma/              # Database schema and migrations
├── memory/              # Project documentation (rulebook-ai)
├── project_rules/       # Development rules (rulebook-ai)
├── tools/               # Utility scripts
└── public/              # Static assets
```

## 🔄 Development Workflow

### 1. Planning Phase

Before implementing new features:

1. **Update Documentation**
   - Update `memory/docs/product_requirement_docs.md`
   - Review `memory/docs/architecture.md`
   - Update `memory/tasks/active_context.md`

2. **Create Tasks**
   - Add detailed tasks to `memory/tasks/tasks_plan.md`
   - Break down complex features into atomic subtasks
   - Define acceptance criteria

### 2. Implementation Phase

1. **Database Changes**
   ```bash
   # Update schema in prisma/schema.prisma
   npm run db:migrate     # Create migration
   npm run db:generate    # Generate client
   ```

2. **Backend Development**
   ```bash
   # Create services, controllers, routes
   # Update types in src/shared/types/
   npm run typecheck      # Verify types
   ```

3. **Frontend Development**
   ```bash
   # Create components, pages, hooks
   npm run dev:client     # Start development server
   ```

4. **Testing**
   ```bash
   npm test               # Run unit tests
   npm run test:watch     # Watch mode
   ```

### 3. Quality Assurance

Before committing:

```bash
npm run typecheck      # TypeScript compilation
npm test               # Unit tests
npm run build          # Production build test
```

## 🧪 Testing

### Test Categories

1. **Unit Tests**: Individual functions and components
2. **Integration Tests**: API endpoints and database operations
3. **E2E Tests**: Complete user workflows

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm test -- --coverage

# Specific test file
npm test utils.test.ts
```

### Writing Tests

Example test structure:

```typescript
import { someFunction } from '../path/to/module.js';

describe('Module Name', () => {
  describe('someFunction', () => {
    test('should handle valid input', () => {
      const result = someFunction('valid input');
      expect(result).toBe('expected output');
    });

    test('should handle edge cases', () => {
      expect(() => someFunction('')).toThrow();
    });
  });
});
```

## 📡 API Documentation

### Authentication

All API endpoints require JWT authentication:

```bash
curl -H "Authorization: Bearer <jwt_token>" \
     http://localhost:3001/api/endpoint
```

### Core Endpoints

#### User Management
- `GET /api/user/profile` - Get user profile and stats
- `GET /api/user/tokens` - Get token status
- `POST /api/user/tokens/reset` - Reset daily tokens
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/history` - Get game history

#### Game Sessions
- `GET /api/sessions` - List available sessions
- `POST /api/sessions/create` - Create new session
- `POST /api/sessions/:id/join` - Join session
- `GET /api/sessions/:id/status` - Get session status

#### Leaderboards
- `GET /api/leaderboard/daily` - Daily leaderboard
- `GET /api/leaderboard/weekly` - Weekly leaderboard
- `GET /api/leaderboard/:date` - Historical leaderboard

#### Payments
- `POST /api/payments/charge` - Process entry fee
- `GET /api/payments/history` - Payment history
- `GET /api/payments/balance` - Current balance

### WebSocket Events

#### Client to Server
- `join_game(sessionId)` - Join game session
- `player_move(direction)` - Move player left/right
- `player_accelerate(accelerating)` - Accelerate/decelerate
- `leave_game()` - Leave current game

#### Server to Client
- `game_state(state)` - Current game state
- `player_joined(player)` - Player joined notification
- `player_left(playerId)` - Player left notification
- `game_started()` - Game started notification
- `game_ended(results)` - Game ended with results
- `token_update(tokens)` - Token count update

## 🗄️ Database Schema

### Key Tables

```sql
-- User management
users (id, whop_user_id, username, credits_balance, tokens_remaining, ...)

-- Game sessions
game_sessions (id, creator_id, entry_fee, max_players, status, ...)
game_participants (id, session_id, user_id, score, placement, ...)

-- Financial tracking
transactions (id, user_id, amount, transaction_type, status, ...)

-- Leaderboards
daily_leaderboards (id, date, user_id, total_score, rank, prize_amount, ...)

-- Configuration
game_config (id, key, value, category)
```

### Relationships

- Users can create multiple game sessions
- Users can participate in multiple games
- Each game session has multiple participants
- Transactions track all financial operations
- Daily leaderboards aggregate user performance

## 🚢 Deployment

### Production Build

```bash
npm run build          # Build both frontend and backend
npm start              # Start production server
```

### Docker Deployment

```bash
# Build production image
docker build -t multiplayer-road-fighter .

# Run with docker-compose
docker compose up -d
```

### Environment Variables

Required for production:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379

# Whop Integration
WHOP_API_KEY=your_api_key
WHOP_APP_ID=your_app_id
WHOP_WEBHOOK_SECRET=your_webhook_secret

# Security
JWT_SECRET=strong_random_secret
NODE_ENV=production

# Application
PORT=3001
```

### Health Monitoring

- Health endpoint: `GET /health`
- Database health: Monitor connection pool
- Redis health: Monitor cache hit rates
- WebSocket health: Monitor connection counts

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Check if PostgreSQL is running
   docker compose ps postgres
   
   # Check connection
   npm run db:migrate
   ```

2. **Redis Connection Errors**
   ```bash
   # Check if Redis is running
   docker compose ps redis
   
   # Test connection
   redis-cli ping
   ```

3. **TypeScript Errors**
   ```bash
   # Regenerate Prisma client
   npm run db:generate
   
   # Check for syntax errors
   npm run typecheck
   ```

4. **Test Failures**
   ```bash
   # Clear Jest cache
   npx jest --clearCache
   
   # Run specific test
   npm test -- --testNamePattern="test name"
   ```

### Debugging

1. **Enable Debug Logs**
   ```bash
   LOG_LEVEL=debug npm run dev:server
   ```

2. **Database Queries**
   - Prisma logs queries in development
   - Use `npm run db:studio` for GUI

3. **API Testing**
   ```bash
   # Test endpoints with curl
   curl -X GET http://localhost:3001/health
   ```

## 🤝 Contributing

### Code Standards

1. **TypeScript**: All code must be typed
2. **ESLint**: Follow configured rules
3. **Testing**: Maintain >80% coverage
4. **Documentation**: Update relevant docs

### Commit Guidelines

```bash
feat: add new feature
fix: bug fix
docs: update documentation
test: add or update tests
refactor: code refactoring
style: formatting changes
```

### Pull Request Process

1. Create feature branch from `master`
2. Implement changes with tests
3. Update documentation
4. Submit PR with detailed description
5. Address review feedback

---

## 📞 Support

For questions or issues:

1. Check this documentation
2. Review existing issues in repository
3. Create new issue with detailed description
4. Include error logs and environment details

**Happy coding! 🎮**