// Input Validation Helpers
import errorModule from '../utils/errors.js';
const { ValidationError } = errorModule;

/**
 * Validate required fields in request body
 */
const validateRequired = (fields, body) => {
  const errors = [];
  
  fields.forEach(field => {
    if (!body[field] || body[field].toString().trim() === '') {
      errors.push({
        field,
        message: `${field} is required`
      });
    }
  });

  if (errors.length > 0) {
    throw new ValidationError('Missing required fields', errors);
  }
};

/**
 * Validate ObjectId format
 */
const validateObjectId = (id, fieldName = 'id') => {
  const objectIdPattern = /^[0-9a-fA-F]{24}$/;
  if (!objectIdPattern.test(id)) {
    throw new ValidationError(`Invalid ${fieldName} format`);
  }
};

/**
 * Validate email format
 */
const validateEmail = (email) => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    throw new ValidationError('Invalid email format');
  }
};

/**
 * Validate number range
 */
const validateNumberRange = (value, fieldName, min, max) => {
  const num = Number(value);
  if (isNaN(num)) {
    throw new ValidationError(`${fieldName} must be a number`);
  }
  if (num < min || num > max) {
    throw new ValidationError(`${fieldName} must be between ${min} and ${max}`);
  }
};

/**
 * Sanitize string input (prevent XSS)
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
};

export default {
  validateRequired,
  validateObjectId,
  validateEmail,
  validateNumberRange,
  sanitizeString
};