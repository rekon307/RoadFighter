import { ApiError, GameError } from '../types';

/**
 * Game Business Rules Validation
 * These functions enforce the core business rules for the multiplayer Road Fighter game
 */

// Validates entry fee amounts according to Whop platform requirements
// Entry fees must be between $1.00 and $100.00 to ensure reasonable game stakes
export const validateEntryFee = (amount: number): boolean => {
  const MIN_ENTRY_FEE = 1.00;
  const MAX_ENTRY_FEE = 100.00;
  
  return amount >= MIN_ENTRY_FEE && 
         amount <= MAX_ENTRY_FEE && 
         Number.isFinite(amount);
};

// Validates usernames for display in game and leaderboards
// Only alphanumeric characters, underscores, and hyphens allowed for clean display
export const validateUsername = (username: string): boolean => {
  const MIN_LENGTH = 3;
  const MAX_LENGTH = 20;
  const ALLOWED_PATTERN = /^[a-zA-Z0-9_-]+$/;
  
  return username.length >= MIN_LENGTH && 
         username.length <= MAX_LENGTH && 
         ALLOWED_PATTERN.test(username);
};

// Validates game session player count for optimal multiplayer experience
// Sessions support 1-8 players for balanced gameplay and server performance
export const validateSessionSize = (playerCount: number): boolean => {
  const MIN_PLAYERS = 1;
  const MAX_PLAYERS = 8;
  
  return playerCount >= MIN_PLAYERS && 
         playerCount <= MAX_PLAYERS && 
         Number.isInteger(playerCount);
};

/**
 * Display Formatting Utilities
 * Functions for consistent UI display across the application
 */

// Formats monetary amounts for display in UI and transaction records
// Uses USD currency format consistent with Whop platform requirements
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Formats dates for leaderboard and game history display
// Uses short month format for compact display (e.g., "Jan 15, 2024")
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

// Formats complete timestamps for detailed game session records
// Includes time for precise game start/end tracking
export const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Time utilities
export const getCurrentDate = (): Date => {
  return new Date();
};

export const getDateString = (date: Date = new Date()): string => {
  return date.toISOString().split('T')[0];
};

export const getMidnightUTC = (date: Date = new Date()): Date => {
  const midnight = new Date(date);
  midnight.setUTCHours(0, 0, 0, 0);
  return midnight;
};

export const getNextMidnightUTC = (date: Date = new Date()): Date => {
  const nextMidnight = getMidnightUTC(date);
  nextMidnight.setUTCDate(nextMidnight.getUTCDate() + 1);
  return nextMidnight;
};

// Game calculation utilities
export const calculateDistance = (x1: number, y1: number, x2: number, y2: number): number => {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
};

export const calculateScore = (distanceTraveled: number, survivalTime: number, fuel: number): number => {
  const distanceScore = Math.floor(distanceTraveled * 1);
  const timeScore = Math.floor(survivalTime / 1000) * 10;
  const fuelBonus = Math.floor(fuel * 5);
  return distanceScore + timeScore + fuelBonus;
};

export const calculatePaymentSplit = (totalAmount: number) => {
  const developerAmount = (totalAmount * 0.25);
  const creatorAmount = (totalAmount * 0.25);
  const winnerAmount = (totalAmount * 0.50);
  
  return {
    developer: Number(developerAmount.toFixed(2)),
    creator: Number(creatorAmount.toFixed(2)),
    winner: Number(winnerAmount.toFixed(2)),
  };
};

// Array utilities
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

// Object utilities
export const pick = <T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

export const omit = <T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach(key => {
    delete result[key];
  });
  return result;
};

// Error utilities
export const createApiError = (code: string, message: string, statusCode = 500): ApiError => {
  return {
    code,
    message,
    details: { statusCode },
  };
};

export const createGameError = (code: string, message: string, statusCode = 400): GameError => {
  const error = new Error(message) as GameError;
  error.code = code;
  error.statusCode = statusCode;
  return error;
};

export const isApiError = (error: any): error is ApiError => {
  return error && typeof error.code === 'string' && typeof error.message === 'string';
};

// Random utilities
export const randomFloat = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

export const randomInt = (min: number, max: number): number => {
  return Math.floor(randomFloat(min, max + 1));
};

export const randomChoice = <T>(array: T[]): T => {
  return array[randomInt(0, array.length - 1)];
};

// Async utilities
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const retry = async <T>(
  fn: () => Promise<T>,
  attempts: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < attempts - 1) {
        await sleep(delay * (i + 1));
      }
    }
  }
  
  throw lastError!;
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Throttle utility
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

// Type guards
export const isString = (value: any): value is string => {
  return typeof value === 'string';
};

export const isNumber = (value: any): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

export const isObject = (value: any): value is Record<string, any> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

export const isDefined = <T>(value: T | undefined | null): value is T => {
  return value !== undefined && value !== null;
};