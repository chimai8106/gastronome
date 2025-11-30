// Global Error Handling Middleware
import errorModule from '../utils/errors.js';

const { APIError } = errorModule;

/**
 * Global error handler 
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    userId: req.user?.uid || 'anonymous'
  });

  // Handle known API errors
  if (err instanceof APIError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        name: err.name,
        message: err.message,
        ...(err.errors && { errors: err.errors }), // Validation errors
        ...(err.retryAfter && { retryAfter: err.retryAfter }), // Rate limit
        timestamp: err.timestamp
      }
    });
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError' && err.errors) {
    return res.status(400).json({
      success: false,
      error: {
        name: 'ValidationError',
        message: 'Validation failed',
        errors: Object.values(err.errors).map(e => ({
          field: e.path,
          message: e.message
        }))
      }
    });
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        name: 'ValidationError',
        message: `Invalid ${err.path}: ${err.value}`
      }
    });
  }

  // Handle duplicate key errors (MongoDB)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      error: {
        name: 'ConflictError',
        message: `${field} already exists`
      }
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        name: 'AuthenticationError',
        message: 'Invalid token'
      }
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        name: 'AuthenticationError',
        message: 'Token expired'
      }
    });
  }

  // Handle multer file upload errors
  if (err.name === 'MulterError') {
    let message = 'File upload error';
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size too large (max 5MB)';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files';
    }
    return res.status(400).json({
      success: false,
      error: {
        name: 'ValidationError',
        message
      }
    });
  }

  // Unknown error - don't leak details to client
  return res.status(500).json({
    success: false,
    error: {
      name: 'InternalServerError',
      message: 'An unexpected error occurred',
      ...(process.env.NODE_ENV === 'development' && {
        details: err.message,
        stack: err.stack
      })
    }
  });
};

/**
 * Async handler wrapper - eliminates try-catch in every route
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Handle 404 - Route not found
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      name: 'NotFoundError',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
};

export default {
  errorHandler,
  asyncHandler,
  notFoundHandler
};