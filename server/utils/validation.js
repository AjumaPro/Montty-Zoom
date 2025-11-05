/**
 * Input validation and sanitization utilities
 */

// Sanitize string input
const sanitizeString = (str, maxLength = 100) => {
  if (typeof str !== 'string') return '';
  return str
    .trim()
    .substring(0, maxLength)
    .replace(/[<>]/g, ''); // Remove potential HTML tags
};

// Validate room password
const validatePassword = (password) => {
  if (!password) return true; // Optional field
  if (typeof password !== 'string') return false;
  // Allow alphanumeric and common special chars, max 50 chars
  return /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{1,50}$/.test(password);
};

// Validate user name
const validateUserName = (userName) => {
  if (!userName || typeof userName !== 'string') return false;
  const sanitized = sanitizeString(userName, 50);
  return sanitized.length >= 1 && sanitized.length <= 50;
};

// Validate room ID (UUID format)
const validateRoomId = (roomId) => {
  if (!roomId || typeof roomId !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(roomId);
};

// Validate email (for scheduled meetings)
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

// Validate date/time
const validateDateTime = (date, time) => {
  if (!date || !time) return false;
  try {
    const dateTime = new Date(`${date}T${time}`);
    return dateTime instanceof Date && !isNaN(dateTime) && dateTime > new Date();
  } catch {
    return false;
  }
};

// Sanitize object inputs
const sanitizeObject = (obj, schema) => {
  const sanitized = {};
  for (const [key, validator] of Object.entries(schema)) {
    if (obj[key] !== undefined) {
      sanitized[key] = validator(obj[key]);
    }
  }
  return sanitized;
};

module.exports = {
  sanitizeString,
  validatePassword,
  validateUserName,
  validateRoomId,
  validateEmail,
  validateDateTime,
  sanitizeObject
};

