// Custom Error Classes with HTTP Status Codes
/**
 * Base API Error class that all custom errors extend from
 */
class APIError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational; // vs. programmer errors
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request - Client sent invalid data
 */
class ValidationError extends APIError {
  constructor(message = 'Validation failed', errors = []) {
    super(message, 400);
    this.name = 'ValidationError';
    this.errors = errors; // Array of specific validation errors
  }
}

/**
 * 401 Unauthorized - Authentication required
 */
class AuthenticationError extends APIError {
  constructor(message = 'Authentication required') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * 403 Forbidden - User doesn't have permission
 */
class AuthorizationError extends APIError {
  constructor(message = 'Access denied') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

/**
 * 404 Not Found - Resource doesn't exist
 */
class NotFoundError extends APIError {
  constructor(resource = 'Resource', id = '') {
    super(`${resource} ${id ? `with id ${id}` : ''} not found`, 404);
    this.name = 'NotFoundError';
    this.resource = resource;
    this.id = id;
  }
}

/**
 * 409 Conflict - Duplicate resource or business logic conflict
 */
class ConflictError extends APIError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

/**
 * 429 Too Many Requests - Rate limit exceeded
 */
class RateLimitError extends APIError {
  constructor(message = 'Too many requests', retryAfter = 60) {
    super(message, 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter; // Seconds until retry allowed
  }
}

/**
 * 500 Internal Server Error - Something went wrong on server
 */
class InternalServerError extends APIError {
  constructor(message = 'Internal server error', originalError = null) {
    super(message, 500, false); // Not operational - programmer error
    this.name = 'InternalServerError';
    this.originalError = originalError;
  }
}

/**
 * 503 Service Unavailable - External service down
 */
class ServiceUnavailableError extends APIError {
  constructor(service = 'External service', message = 'Service temporarily unavailable') {
    super(message, 503);
    this.name = 'ServiceUnavailableError';
    this.service = service;
  }
}

/**
 * 504 Gateway Timeout - External service took too long
 */
class TimeoutError extends APIError {
  constructor(service = 'Service', timeout = 30) {
    super(`${service} request timed out after ${timeout} seconds`, 504);
    this.name = 'TimeoutError';
    this.service = service;
    this.timeout = timeout;
  }
}

export default {
  APIError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalServerError,
  ServiceUnavailableError,
  TimeoutError
};
