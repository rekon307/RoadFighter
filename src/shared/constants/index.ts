// Game configuration constants
export const GAME_CONFIG = {
  // Canvas dimensions
  CANVAS_WIDTH: 350,
  CANVAS_HEIGHT: 600,
  
  // Game mechanics
  CAR_SPEED: 2,
  CAR_ACCELERATION: 0.5,
  MAX_SPEED: 8,
  FUEL_CONSUMPTION_RATE: 0.1,
  INITIAL_FUEL: 100,
  
  // Car boundaries
  LEFT_BOUNDARY: 20,
  RIGHT_BOUNDARY: 280,
  BORDER_LEFT: 320,
  BORDER_RIGHT: 590,
  
  // Game timing
  GAME_UPDATE_INTERVAL: 16, // 60 FPS
  OBSTACLE_SPAWN_INTERVAL: 2000,
  COLLISION_DISTANCE: 20,
  
  // Scoring
  DISTANCE_SCORE_MULTIPLIER: 1,
  SURVIVAL_TIME_MULTIPLIER: 10,
  FUEL_BONUS_MULTIPLIER: 5,
} as const;

// Payment configuration
export const PAYMENT_CONFIG = {
  MIN_ENTRY_FEE: 1.00,
  MAX_ENTRY_FEE: 100.00,
  DEFAULT_ENTRY_FEE: 5.00,
  
  // Payment splits (percentages)
  DEVELOPER_SPLIT: 25,
  CREATOR_SPLIT: 25,
  WINNER_SPLIT: 50,
  
  // Transaction limits
  DAILY_SPENDING_LIMIT: 500.00,
  MAX_CREDITS_PURCHASE: 1000.00,
} as const;

// Token system
export const TOKEN_CONFIG = {
  DAILY_TOKEN_COUNT: 3,
  TOKEN_RESET_HOUR: 0, // UTC hour for reset
  MAX_TOKENS: 3,
} as const;

// Session configuration
export const SESSION_CONFIG = {
  MAX_PLAYERS: 8,
  MIN_PLAYERS: 1,
  DEFAULT_MAX_PLAYERS: 4,
  
  // Timeouts
  LOBBY_TIMEOUT: 300000, // 5 minutes
  GAME_MAX_DURATION: 600000, // 10 minutes
  PLAYER_DISCONNECT_TIMEOUT: 30000, // 30 seconds
} as const;

// API endpoints
export const API_ENDPOINTS = {
  // User endpoints
  USER_PROFILE: '/api/user/profile',
  USER_TOKENS: '/api/user/tokens',
  USER_STATS: '/api/user/stats',
  
  // Session endpoints
  SESSIONS_LIST: '/api/sessions',
  SESSIONS_CREATE: '/api/sessions/create',
  SESSIONS_JOIN: '/api/sessions/:id/join',
  SESSIONS_STATUS: '/api/sessions/:id/status',
  SESSIONS_LEAVE: '/api/sessions/:id/leave',
  
  // Leaderboard endpoints
  LEADERBOARD_DAILY: '/api/leaderboard/daily',
  LEADERBOARD_WEEKLY: '/api/leaderboard/weekly',
  LEADERBOARD_HISTORY: '/api/leaderboard/:date',
  
  // Payment endpoints
  PAYMENTS_CHARGE: '/api/payments/charge',
  PAYMENTS_HISTORY: '/api/payments/history',
  PAYMENTS_BALANCE: '/api/payments/balance',
  
  // Game endpoints
  GAME_STATE: '/api/game/:sessionId/state',
  GAME_RESULTS: '/api/game/:sessionId/results',
} as const;

// WebSocket events
export const SOCKET_EVENTS = {
  // Client to server
  JOIN_GAME: 'join_game',
  LEAVE_GAME: 'leave_game',
  PLAYER_MOVE: 'player_move',
  PLAYER_ACCELERATE: 'player_accelerate',
  READY_TO_START: 'ready_to_start',
  
  // Server to client
  GAME_STATE: 'game_state',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  GAME_STARTED: 'game_started',
  GAME_ENDED: 'game_ended',
  TOKEN_UPDATE: 'token_update',
  ERROR: 'error',
  
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  RECONNECT: 'reconnect',
} as const;

// Error codes
export const ERROR_CODES = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  
  // Payment errors
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  
  // Token errors
  NO_TOKENS_REMAINING: 'NO_TOKENS_REMAINING',
  TOKEN_RESET_FAILED: 'TOKEN_RESET_FAILED',
  
  // Session errors
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  SESSION_FULL: 'SESSION_FULL',
  SESSION_ALREADY_STARTED: 'SESSION_ALREADY_STARTED',
  ALREADY_IN_SESSION: 'ALREADY_IN_SESSION',
  
  // Game errors
  GAME_NOT_ACTIVE: 'GAME_NOT_ACTIVE',
  INVALID_MOVE: 'INVALID_MOVE',
  PLAYER_NOT_IN_GAME: 'PLAYER_NOT_IN_GAME',
  
  // General errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

// Validation rules
export const VALIDATION_RULES = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    PATTERN: /^[a-zA-Z0-9_-]+$/,
  },
  
  ENTRY_FEE: {
    MIN: PAYMENT_CONFIG.MIN_ENTRY_FEE,
    MAX: PAYMENT_CONFIG.MAX_ENTRY_FEE,
    DECIMAL_PLACES: 2,
  },
  
  SESSION: {
    MIN_PLAYERS: SESSION_CONFIG.MIN_PLAYERS,
    MAX_PLAYERS: SESSION_CONFIG.MAX_PLAYERS,
  },
} as const;

// Cache keys
export const CACHE_KEYS = {
  USER_PROFILE: (userId: string) => `user:profile:${userId}`,
  USER_TOKENS: (userId: string) => `user:tokens:${userId}`,
  SESSION_STATE: (sessionId: string) => `session:state:${sessionId}`,
  DAILY_LEADERBOARD: (date: string) => `leaderboard:daily:${date}`,
  GAME_STATE: (sessionId: string) => `game:state:${sessionId}`,
} as const;

// Cache TTL (Time To Live) in seconds
export const CACHE_TTL = {
  USER_PROFILE: 300, // 5 minutes
  USER_TOKENS: 60, // 1 minute
  SESSION_STATE: 30, // 30 seconds
  DAILY_LEADERBOARD: 60, // 1 minute
  GAME_STATE: 5, // 5 seconds
} as const;