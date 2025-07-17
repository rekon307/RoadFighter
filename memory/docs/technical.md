# Technical Specifications Document - Multiplayer Road Fighter

## 1. Introduction
*   **Project Name:** Multiplayer Road Fighter on Whop Platform
*   **Document Version:** 1.0
*   **Date:** July 17, 2025
*   **Author(s):** Terragon Labs Development Team
*   **Purpose:** This document provides detailed technical specifications for implementing the multiplayer Road Fighter game, including development environment, technology choices, and implementation details.

## 2. Goals
*   **Technical Goals:** 
    - Achieve 60Hz real-time gameplay with <100ms latency
    - Implement secure, PCI-compliant payment processing
    - Build scalable architecture supporting 100+ concurrent users
    - Ensure cross-platform compatibility (desktop, mobile, tablet)
    - Maintain 99.5% uptime with automated error recovery
*   **Business Goals:** 
    - Enable rapid deployment to Whop app store
    - Support revenue generation through entry fees and splits
    - Facilitate easy maintenance and feature updates

## 3. Development Environment
*   **Operating Systems:** 
    - Development: macOS, Windows, Linux
    - Production: Linux (containerized deployment)
*   **Programming Languages:** 
    - Frontend: TypeScript/JavaScript (ES2022)
    - Backend: TypeScript/Node.js
    - Database: SQL (PostgreSQL)
*   **Frameworks:** 
    - Frontend: React 18, Socket.io-client
    - Backend: Express.js, Socket.io, Prisma ORM
*   **Development Tools:** 
    - IDE: VS Code with TypeScript extensions
    - Build: Vite (frontend), tsc (backend)
    - Testing: Jest, Playwright
    - Version Control: Git with GitHub
    - Containerization: Docker, Docker Compose

## 4. Technologies Used

### Technology Stack
```
Frontend Layer:
├── React 18 (UI framework)
├── TypeScript (type safety)
├── Socket.io-client (real-time communication)
├── Redux Toolkit (state management)
├── HTML5 Canvas (game rendering)
└── Vite (build tool)

Backend Layer:
├── Node.js 18+ (runtime)
├── Express.js (web framework)
├── TypeScript (type safety)
├── Socket.io (WebSocket server)
├── Prisma (database ORM)
└── Jest (testing framework)

Data Layer:
├── PostgreSQL 15 (primary database)
├── Redis 7 (caching and sessions)
└── Whop API (user authentication and payments)

Infrastructure:
├── Docker (containerization)
├── GitHub Actions (CI/CD)
├── CloudFlare (CDN)
└── Whop Platform (hosting/deployment)
```

### Technology Selection Rationale
*   **React:** Mature ecosystem, excellent performance, strong TypeScript support
*   **Node.js:** JavaScript consistency across frontend/backend, excellent WebSocket support
*   **PostgreSQL:** ACID compliance for financial transactions, complex query support
*   **Socket.io:** Reliable WebSocket implementation with fallback support
*   **TypeScript:** Type safety reduces bugs, better developer experience
*   **Whop SDK:** Platform-native integration for authentication and payments

## 5. Key Technical Decisions

### Real-time Architecture
*   **Decision:** Authoritative server with client prediction
*   **Rationale:** Prevents cheating while maintaining responsive gameplay
*   **Implementation:** Server validates all moves, client predicts movement locally

### Payment Processing
*   **Decision:** Use Whop's native payment API exclusively
*   **Rationale:** Platform compliance, reduced PCI scope, built-in fraud protection
*   **Implementation:** Async payment processing with idempotency keys

### Game State Management
*   **Decision:** Hybrid approach - Redis for active sessions, PostgreSQL for persistence
*   **Rationale:** Fast access for real-time data, durable storage for critical information
*   **Implementation:** Write-through cache pattern with automatic expiration

### Authentication
*   **Decision:** Delegate all authentication to Whop platform
*   **Rationale:** Zero authentication overhead, seamless user experience
*   **Implementation:** Whop SDK handles all user identity management

## 6. Design Patterns

### Observer Pattern
*   **Usage:** Game state updates and event broadcasting
*   **Implementation:** Socket.io event system for real-time updates
*   **Benefits:** Decoupled components, easy to add new listeners

### Command Pattern
*   **Usage:** Player input processing and validation
*   **Implementation:** Action-based input system with undo/redo capability
*   **Benefits:** Input validation, replay functionality, easier debugging

### Factory Pattern
*   **Usage:** Game session creation with different configurations
*   **Implementation:** Session factory creates configured game instances
*   **Benefits:** Consistent session initialization, easy to extend

### Repository Pattern
*   **Usage:** Data access layer abstraction
*   **Implementation:** Service layer interfaces with Prisma repositories
*   **Benefits:** Testable data access, easy to swap implementations

## 7. Technical Constraints

### Platform Constraints
*   **Whop Platform Requirements:** Must embed seamlessly in iframe
*   **Mitigation:** Responsive design, postMessage communication patterns

### Performance Constraints
*   **Mobile Device Limitations:** CPU/memory constraints on lower-end devices
*   **Mitigation:** Optimized rendering, adjustable quality settings

### Network Constraints
*   **Variable Connection Quality:** Players may have unstable connections
*   **Mitigation:** Connection quality monitoring, graceful degradation

### Browser Compatibility
*   **Legacy Browser Support:** Must support modern browsers only
*   **Mitigation:** Progressive enhancement, feature detection

## 8. API Specifications

### WebSocket Events
```typescript
// Client to Server Events
interface ClientToServerEvents {
  join_game: (sessionId: string) => void;
  player_move: (direction: 'left' | 'right') => void;
  player_accelerate: (accelerating: boolean) => void;
  leave_game: () => void;
}

// Server to Client Events
interface ServerToClientEvents {
  game_state: (state: GameState) => void;
  player_joined: (player: Player) => void;
  player_left: (playerId: string) => void;
  game_ended: (results: GameResults) => void;
  error: (message: string) => void;
}
```

### REST API Endpoints
```typescript
// User Management
GET /api/user/profile
GET /api/user/tokens
POST /api/user/tokens/reset

// Game Sessions
GET /api/sessions
POST /api/sessions/create
POST /api/sessions/:id/join
GET /api/sessions/:id/status

// Leaderboards
GET /api/leaderboard/daily
GET /api/leaderboard/weekly
GET /api/leaderboard/:date

// Payments
POST /api/payments/charge
GET /api/payments/history
POST /api/payments/split
```

## 9. Data Storage

### Database Schema Design
```sql
-- Core user data with Whop integration
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whop_user_id VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) NOT NULL,
  credits_balance DECIMAL(10,2) DEFAULT 0,
  tokens_remaining INTEGER DEFAULT 3,
  last_token_reset TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Game session management
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES users(id),
  entry_fee DECIMAL(10,2) NOT NULL,
  max_players INTEGER DEFAULT 8,
  current_players INTEGER DEFAULT 0,
  status session_status DEFAULT 'waiting',
  game_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  ended_at TIMESTAMP
);

-- Track individual game participation
CREATE TABLE game_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES game_sessions(id),
  user_id UUID REFERENCES users(id),
  score INTEGER DEFAULT 0,
  distance_traveled DECIMAL(10,2) DEFAULT 0,
  survival_time INTERVAL,
  placement INTEGER,
  joined_at TIMESTAMP DEFAULT NOW(),
  finished_at TIMESTAMP
);

-- Daily leaderboard tracking
CREATE TABLE daily_leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  user_id UUID REFERENCES users(id),
  total_score INTEGER NOT NULL,
  games_played INTEGER DEFAULT 0,
  best_distance DECIMAL(10,2) DEFAULT 0,
  rank INTEGER,
  prize_amount DECIMAL(10,2) DEFAULT 0,
  UNIQUE(date, user_id)
);

-- Financial transaction logging
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  session_id UUID REFERENCES game_sessions(id),
  amount DECIMAL(10,2) NOT NULL,
  transaction_type transaction_type NOT NULL,
  whop_transaction_id VARCHAR(255),
  status transaction_status DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);
```

### Data Access Patterns
*   **Read-heavy:** Leaderboards, user profiles, game history
*   **Write-heavy:** Game state updates, transaction logging
*   **Indexing Strategy:** Composite indexes on date+user for leaderboards
*   **Caching Strategy:** Redis for active game sessions, user tokens

## 10. Security Considerations

### Payment Security
*   PCI compliance through Whop platform delegation
*   Transaction idempotency to prevent double-charging
*   Secure API key management and rotation
*   Input validation on all payment-related data

### Game Security
*   Server-side validation of all player moves
*   Rate limiting on WebSocket connections
*   Anti-cheat mechanisms (impossible score detection)
*   Session token validation for all game actions

### Data Protection
*   Encryption at rest for sensitive user data
*   HTTPS/WSS for all client-server communication
*   SQL injection prevention via prepared statements
*   XSS protection through input sanitization

## 11. Performance Considerations

### Frontend Performance
*   Canvas rendering optimization (object pooling, dirty regions)
*   Efficient collision detection algorithms
*   Client-side prediction to reduce perceived latency
*   Asset preloading and compression

### Backend Performance
*   Connection pooling for database access
*   Redis caching for frequently accessed data
*   WebSocket connection management and pooling
*   Async/await patterns for non-blocking operations

### Database Performance
*   Strategic indexing on query-heavy tables
*   Read replicas for reporting queries
*   Connection pooling with pgbouncer
*   Query optimization and explain plan analysis

## 12. Scalability Considerations

### Horizontal Scaling
*   Stateless application design for easy scaling
*   Load balancing across multiple app instances
*   Database read replicas for query distribution
*   Redis clustering for cache distribution

### Vertical Scaling
*   CPU optimization for game logic processing
*   Memory optimization for large player counts
*   Network optimization for WebSocket connections
*   Storage optimization for transaction logs

### Auto-scaling Triggers
*   CPU usage > 70% for 5 minutes
*   Memory usage > 80% for 5 minutes
*   WebSocket connection count > 80% capacity
*   Database connection pool > 90% utilization

## 13. Open Issues
*   Whop platform iframe communication protocols
*   Mobile touch control optimization strategies
*   Real-time anti-cheat detection implementation
*   Payment processing error handling edge cases
*   Optimal WebSocket heartbeat intervals

## 14. Future Considerations
*   Microservices architecture for better isolation
*   GraphQL API for more efficient data fetching
*   Machine learning for cheat detection
*   Advanced game analytics and telemetry
*   Integration with additional payment providers

## 15. Glossary
*   **Authoritative Server:** Server that maintains the definitive game state
*   **Client Prediction:** Local simulation to reduce perceived latency
*   **Idempotency:** Ability to safely retry operations without side effects
*   **WebSocket:** Protocol enabling real-time bidirectional communication
*   **PCI Compliance:** Payment Card Industry security standards
*   **ORM:** Object-Relational Mapping for database interactions