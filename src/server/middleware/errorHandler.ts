import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { ERROR_CODES } from '../../shared/constants/index.js';

interface CustomError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export function errorHandler(
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('❌ Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Handle different types of errors
  if (error instanceof ZodError) {
    res.status(400).json({
      error: ERROR_CODES.VALIDATION_ERROR,
      message: 'Validation failed',
      details: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      })),
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    handlePrismaError(error, res);
    return;
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      error: ERROR_CODES.VALIDATION_ERROR,
      message: 'Database validation error',
    });
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      error: ERROR_CODES.INVALID_TOKEN,
      message: 'Invalid token',
    });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      error: ERROR_CODES.INVALID_TOKEN,
      message: 'Token expired',
    });
    return;
  }

  // Handle custom application errors
  if (error.code && error.statusCode) {
    res.status(error.statusCode).json({
      error: error.code,
      message: error.message,
      details: error.details,
    });
    return;
  }

  // Handle specific error types
  switch (error.message) {
    case 'USER_NOT_FOUND':
      res.status(404).json({
        error: ERROR_CODES.USER_NOT_FOUND,
        message: 'User not found',
      });
      return;

    case 'SESSION_NOT_FOUND':
      res.status(404).json({
        error: ERROR_CODES.SESSION_NOT_FOUND,
        message: 'Game session not found',
      });
      return;

    case 'INSUFFICIENT_CREDITS':
      res.status(403).json({
        error: ERROR_CODES.INSUFFICIENT_CREDITS,
        message: 'Insufficient credits for this action',
      });
      return;

    case 'NO_TOKENS_REMAINING':
      res.status(403).json({
        error: ERROR_CODES.NO_TOKENS_REMAINING,
        message: 'No tokens remaining',
      });
      return;

    case 'SESSION_FULL':
      res.status(409).json({
        error: ERROR_CODES.SESSION_FULL,
        message: 'Game session is full',
      });
      return;

    case 'ALREADY_IN_SESSION':
      res.status(409).json({
        error: ERROR_CODES.ALREADY_IN_SESSION,
        message: 'User already in a game session',
      });
      return;

    case 'PAYMENT_FAILED':
      res.status(402).json({
        error: ERROR_CODES.PAYMENT_FAILED,
        message: 'Payment processing failed',
      });
      return;
  }

  // Default internal server error
  res.status(500).json({
    error: ERROR_CODES.INTERNAL_ERROR,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
}

function handlePrismaError(error: Prisma.PrismaClientKnownRequestError, res: Response): void {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const target = error.meta?.target as string[] || [];
      res.status(409).json({
        error: ERROR_CODES.VALIDATION_ERROR,
        message: `Duplicate value for ${target.join(', ')}`,
        details: {
          field: target[0],
          code: 'unique_violation',
        },
      });
      break;

    case 'P2014':
      // Foreign key constraint violation
      res.status(400).json({
        error: ERROR_CODES.VALIDATION_ERROR,
        message: 'Invalid reference to related record',
        details: {
          code: 'foreign_key_violation',
        },
      });
      break;

    case 'P2003':
      // Foreign key constraint failed
      res.status(400).json({
        error: ERROR_CODES.VALIDATION_ERROR,
        message: 'Related record not found',
        details: {
          code: 'foreign_key_constraint',
        },
      });
      break;

    case 'P2025':
      // Record not found
      res.status(404).json({
        error: ERROR_CODES.VALIDATION_ERROR,
        message: 'Record not found',
        details: {
          code: 'record_not_found',
        },
      });
      break;

    case 'P2021':
      // Table does not exist
      res.status(500).json({
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Database schema error',
        details: {
          code: 'table_not_found',
        },
      });
      break;

    case 'P2022':
      // Column does not exist
      res.status(500).json({
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Database schema error',
        details: {
          code: 'column_not_found',
        },
      });
      break;

    case 'P1008':
      // Database timeout
      res.status(504).json({
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Database operation timed out',
        details: {
          code: 'timeout',
        },
      });
      break;

    case 'P1001':
      // Database connection error
      res.status(503).json({
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Database connection error',
        details: {
          code: 'connection_error',
        },
      });
      break;

    default:
      res.status(500).json({
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Database error',
        details: {
          code: error.code,
        },
      });
  }
}

// 404 handler for undefined routes
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    path: req.originalUrl,
    method: req.method,
  });
}

// Async error wrapper to catch async errors in route handlers
export function asyncHandler<T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<any>
) {
  return (req: T, res: U, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Create custom error classes
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(code: string, message: string, statusCode = 500, details?: any) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(ERROR_CODES.VALIDATION_ERROR, message, 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(ERROR_CODES.UNAUTHORIZED, message, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(ERROR_CODES.UNAUTHORIZED, message, 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(ERROR_CODES.USER_NOT_FOUND, `${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(ERROR_CODES.VALIDATION_ERROR, message, 409);
    this.name = 'ConflictError';
  }
}

export class PaymentError extends AppError {
  constructor(message: string, details?: any) {
    super(ERROR_CODES.PAYMENT_FAILED, message, 402, details);
    this.name = 'PaymentError';
  }
}