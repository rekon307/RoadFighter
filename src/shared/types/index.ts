export interface User {
  id: string;
  whopUserId: string;
  username: string;
  creditsBalance: number;
  tokensRemaining: number;
  lastTokenReset: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GameSession {
  id: string;
  creatorId: string;
  entryFee: number;
  maxPlayers: number;
  currentPlayers: number;
  status: SessionStatus;
  gameData?: Record<string, any>;
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
}

export enum SessionStatus {
  WAITING = 'WAITING',
  STARTING = 'STARTING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface GameParticipant {
  id: string;
  sessionId: string;
  userId: string;
  score: number;
  distanceTraveled: number;
  survivalTime?: number;
  placement?: number;
  joinedAt: Date;
  finishedAt?: Date;
}

export interface DailyLeaderboard {
  id: string;
  date: Date;
  userId: string;
  totalScore: number;
  gamesPlayed: number;
  bestDistance: number;
  rank?: number;
  prizeAmount: number;
  user?: {
    username: string;
  };
}

export interface Transaction {
  id: string;
  userId: string;
  sessionId?: string;
  amount: number;
  transactionType: TransactionType;
  whopTransactionId?: string;
  status: TransactionStatus;
  metadata?: Record<string, any>;
  createdAt: Date;
  processedAt?: Date;
}

export enum TransactionType {
  ENTRY_FEE = 'ENTRY_FEE',
  PRIZE_PAYOUT = 'PRIZE_PAYOUT',
  DEVELOPER_SPLIT = 'DEVELOPER_SPLIT',
  CREATOR_SPLIT = 'CREATOR_SPLIT',
  CREDIT_PURCHASE = 'CREDIT_PURCHASE',
  REFUND = 'REFUND'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

// Game-specific types
export interface CarPosition {
  x: number;
  y: number;
  rotation: number;
}

export interface GameState {
  sessionId: string;
  players: Record<string, PlayerState>;
  obstacles: Obstacle[];
  gameTime: number;
  isActive: boolean;
  winnerIds?: string[];
}

export interface PlayerState {
  id: string;
  username: string;
  position: CarPosition;
  score: number;
  distanceTraveled: number;
  isAlive: boolean;
  fuel: number;
  speed: number;
  lastUpdate: number;
}

export interface Obstacle {
  id: string;
  type: 'car' | 'truck' | 'fuel' | 'oil';
  position: CarPosition;
  speed: number;
  color?: string;
}

// WebSocket event types
export interface ClientToServerEvents {
  join_game: (sessionId: string) => void;
  player_move: (direction: 'left' | 'right') => void;
  player_accelerate: (accelerating: boolean) => void;
  leave_game: () => void;
}

export interface ServerToClientEvents {
  game_state: (state: GameState) => void;
  player_joined: (player: PlayerState) => void;
  player_left: (playerId: string) => void;
  game_started: () => void;
  game_ended: (results: GameResults) => void;
  error: (message: string) => void;
  token_update: (tokensRemaining: number) => void;
}

export interface GameResults {
  sessionId: string;
  winners: Array<{
    userId: string;
    username: string;
    score: number;
    placement: number;
    prizeAmount?: number;
  }>;
  duration: number;
  totalPlayers: number;
}

// API Request/Response types
export interface CreateSessionRequest {
  entryFee: number;
  maxPlayers?: number;
}

export interface CreateSessionResponse {
  session: GameSession;
  success: boolean;
  message?: string;
}

export interface JoinSessionRequest {
  sessionId: string;
}

export interface JoinSessionResponse {
  success: boolean;
  message?: string;
  participant?: GameParticipant;
}

export interface LeaderboardResponse {
  leaderboard: DailyLeaderboard[];
  userRank?: number;
  totalPlayers: number;
  prizePool: number;
}

export interface UserProfileResponse {
  user: User;
  stats: {
    totalGames: number;
    totalWins: number;
    totalEarnings: number;
    bestScore: number;
    winRate: number;
  };
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface GameError extends Error {
  code: string;
  statusCode?: number;
}