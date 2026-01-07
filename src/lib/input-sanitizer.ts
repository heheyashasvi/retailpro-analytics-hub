import { z } from 'zod'

// Enhanced SQL injection patterns to detect and prevent
const SQL_INJECTION_PATTERNS = [
  // Basic SQL keywords
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT|DECLARE|CAST|CONVERT)\b)/gi,
  // SQL operators and syntax
  /(--|\/\*|\*\/|;|'|"|`)/g,
  // Boolean-based injection
  /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/gi,
  /(\bOR\b|\bAND\b)\s+['"`]\w+['"`]\s*=\s*['"`]\w+['"`]/gi,
  // Time-based injection
  /(\bWAITFOR\b|\bDELAY\b|\bSLEEP\b|\bBENCHMARK\b)/gi,
  // Union-based injection
  /(\bUNION\b.*\bSELECT\b)/gi,
  // Error-based injection
  /(\bEXTRACTVALUE\b|\bUPDATEXML\b|\bXMLTYPE\b)/gi,
  // Stacked queries
  /;\s*(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)/gi,
]

// Enhanced XSS patterns to detect and prevent
const XSS_PATTERNS = [
  // Script tags
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  // Event handlers
  /on\w+\s*=\s*["'][^"']*["']/gi,
  // JavaScript protocol
  /javascript\s*:/gi,
  // Data URLs with JavaScript
  /data\s*:\s*text\/html/gi,
  // Iframe tags
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  // Object and embed tags
  /<(object|embed|applet|form|meta|link|style)\b[^>]*>/gi,
  // Expression() CSS
  /expression\s*\(/gi,
  // Import statements
  /@import/gi,
  // Vbscript
  /vbscript\s*:/gi,
]

// Path traversal patterns
const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//g,
  /\.\.[\\/]/g,
  /%2e%2e%2f/gi,
  /%2e%2e%5c/gi,
  /\.\.%2f/gi,
  /\.\.%5c/gi,
]

// Command injection patterns
const COMMAND_INJECTION_PATTERNS = [
  /[;&|`$(){}[\]]/g,
  /\b(cat|ls|dir|type|copy|move|del|rm|mkdir|rmdir|chmod|chown|ps|kill|wget|curl|nc|netcat|telnet|ssh|ftp)\b/gi,
]

// LDAP injection patterns
const LDAP_INJECTION_PATTERNS = [
  /[()&|!*]/g,
  /\x00/g,
]

// Enhanced HTML sanitizer
function sanitizeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/\\/g, '&#x5C;')
}

// URL encoding for dangerous characters
function encodeSpecialChars(str: string): string {
  return str
    .replace(/%/g, '%25')
    .replace(/\+/g, '%2B')
    .replace(/ /g, '%20')
    .replace(/\?/g, '%3F')
    .replace(/#/g, '%23')
    .replace(/&/g, '%26')
    .replace(/=/g, '%3D')
}

export function sanitizeInput(input: any, context?: { request?: any }): any {
  if (typeof input === 'string') {
    return sanitizeString(input, context)
  }
  
  if (Array.isArray(input)) {
    return input.map(item => sanitizeInput(item, context))
  }
  
  if (input && typeof input === 'object') {
    const sanitized: Record<string, any> = {}
    for (const [key, value] of Object.entries(input)) {
      // Sanitize both keys and values
      const sanitizedKey = sanitizeString(key, context)
      sanitized[sanitizedKey] = sanitizeInput(value, context)
    }
    return sanitized
  }
  
  return input
}

function sanitizeString(str: string, context?: { request?: any }): string {
  if (!str || typeof str !== 'string') {
    return str
  }
  
  // Remove null bytes and control characters
  let sanitized = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  
  // Normalize Unicode to prevent bypass attempts
  try {
    sanitized = sanitized.normalize('NFKC')
  } catch {
    // If normalization fails, continue with original string
  }
  
  // Check for SQL injection patterns
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      console.warn('Potential SQL injection attempt detected:', sanitized.substring(0, 100))
      
      // Log security event if request context is available
      if (context?.request) {
        try {
          const { logSecurityEvent, SecurityEventType } = require('./security-monitor')
          logSecurityEvent(
            context.request,
            SecurityEventType.SQL_INJECTION_ATTEMPT,
            { input: sanitized.substring(0, 200), pattern: pattern.source },
            'high'
          )
        } catch (e) {
          // Ignore if security monitor is not available
        }
      }
      
      // Replace suspicious patterns with safe alternatives
      sanitized = sanitized.replace(pattern, (match) => {
        return match.replace(/['"`;]/g, '').replace(/--/g, '')
      })
    }
  }
  
  // Check for XSS patterns
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(sanitized)) {
      console.warn('Potential XSS attempt detected:', sanitized.substring(0, 100))
      
      // Log security event if request context is available
      if (context?.request) {
        try {
          const { logSecurityEvent, SecurityEventType } = require('./security-monitor')
          logSecurityEvent(
            context.request,
            SecurityEventType.XSS_ATTEMPT,
            { input: sanitized.substring(0, 200), pattern: pattern.source },
            'high'
          )
        } catch (e) {
          // Ignore if security monitor is not available
        }
      }
      
      // Use HTML sanitization for XSS attempts
      sanitized = sanitizeHtml(sanitized)
      break // Once we detect XSS, sanitize the whole string
    }
  }
  
  // Check for path traversal attempts
  for (const pattern of PATH_TRAVERSAL_PATTERNS) {
    if (pattern.test(sanitized)) {
      console.warn('Potential path traversal attempt detected:', sanitized.substring(0, 100))
      
      // Log security event if request context is available
      if (context?.request) {
        try {
          const { logSecurityEvent, SecurityEventType } = require('./security-monitor')
          logSecurityEvent(
            context.request,
            SecurityEventType.PATH_TRAVERSAL_ATTEMPT,
            { input: sanitized.substring(0, 200) },
            'medium'
          )
        } catch (e) {
          // Ignore if security monitor is not available
        }
      }
      
      sanitized = sanitized.replace(pattern, '')
    }
  }
  
  // Check for command injection attempts
  for (const pattern of COMMAND_INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      console.warn('Potential command injection attempt detected:', sanitized.substring(0, 100))
      
      // Log security event if request context is available
      if (context?.request) {
        try {
          const { logSecurityEvent, SecurityEventType } = require('./security-monitor')
          logSecurityEvent(
            context.request,
            SecurityEventType.COMMAND_INJECTION_ATTEMPT,
            { input: sanitized.substring(0, 200) },
            'high'
          )
        } catch (e) {
          // Ignore if security monitor is not available
        }
      }
      
      sanitized = sanitized.replace(pattern, '')
    }
  }
  
  // Check for LDAP injection attempts
  for (const pattern of LDAP_INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      console.warn('Potential LDAP injection attempt detected:', sanitized.substring(0, 100))
      sanitized = sanitized.replace(pattern, '')
    }
  }
  
  // Trim whitespace
  sanitized = sanitized.trim()
  
  // Limit length to prevent DoS attacks
  if (sanitized.length > 10000) {
    console.warn('Excessively long input detected, truncating')
    
    // Log security event if request context is available
    if (context?.request) {
      try {
        const { logSecurityEvent, SecurityEventType } = require('./security-monitor')
        logSecurityEvent(
          context.request,
          SecurityEventType.EXCESSIVE_PAYLOAD_SIZE,
          { originalLength: sanitized.length, truncatedLength: 10000 },
          'medium'
        )
      } catch (e) {
        // Ignore if security monitor is not available
      }
    }
    
    sanitized = sanitized.substring(0, 10000)
  }
  
  return sanitized
}

export function validateEmail(email: string): boolean {
  // Enhanced email validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  
  if (!emailRegex.test(email)) {
    return false
  }
  
  // Additional checks
  if (email.length > 254) return false // RFC 5321 limit
  if (email.includes('..')) return false // Consecutive dots not allowed
  if (email.startsWith('.') || email.endsWith('.')) return false
  
  const [localPart, domain] = email.split('@')
  if (localPart.length > 64) return false // RFC 5321 limit
  if (domain.length > 253) return false // RFC 5321 limit
  
  return true
}

export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'medium' | 'strong'
} {
  const errors: string[] = []
  let score = 0
  
  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  } else if (password.length >= 12) {
    score += 2
  } else {
    score += 1
  }
  
  // Character type checks
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  } else {
    score += 1
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  } else {
    score += 1
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  } else {
    score += 1
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  } else {
    score += 1
  }
  
  // Additional security checks
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters')
  }
  
  // Check for common patterns
  const commonPatterns = [
    /(.)\1{2,}/, // Repeated characters
    /123456|abcdef|qwerty|password|admin/i, // Common sequences
    /^[a-z]+$/i, // Only letters
    /^\d+$/, // Only numbers
  ]
  
  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      score -= 1
      break
    }
  }
  
  // Determine strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak'
  if (score >= 5) strength = 'strong'
  else if (score >= 3) strength = 'medium'
  
  return {
    isValid: errors.length === 0,
    errors,
    strength,
  }
}

export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return 'unnamed_file'
  }
  
  // Remove path traversal attempts
  let sanitized = filename.replace(/\.\./g, '')
  
  // Remove or replace dangerous characters
  sanitized = sanitized.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
  
  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '')
  
  // Prevent reserved Windows filenames
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i
  if (reservedNames.test(sanitized.split('.')[0])) {
    sanitized = `file_${sanitized}`
  }
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop()
    const name = sanitized.substring(0, 255 - (ext ? ext.length + 1 : 0))
    sanitized = ext ? `${name}.${ext}` : name
  }
  
  // Ensure we have a valid filename
  if (!sanitized || sanitized === '') {
    sanitized = 'unnamed_file'
  }
  
  return sanitized
}

export function validateImageFile(file: File, context?: { request?: any }): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    errors.push('File must be a JPEG, PNG, WebP, or GIF image')
    
    // Log suspicious file upload attempt
    if (context?.request) {
      try {
        const { logSecurityEvent, SecurityEventType } = require('./security-monitor')
        logSecurityEvent(
          context.request,
          SecurityEventType.SUSPICIOUS_FILE_UPLOAD,
          { 
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            reason: 'Invalid file type'
          },
          'medium'
        )
      } catch (e) {
        // Ignore if security monitor is not available
      }
    }
  }
  
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    errors.push('File size must be less than 10MB')
    
    // Log suspicious file upload attempt
    if (context?.request) {
      try {
        const { logSecurityEvent, SecurityEventType } = require('./security-monitor')
        logSecurityEvent(
          context.request,
          SecurityEventType.SUSPICIOUS_FILE_UPLOAD,
          { 
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            maxSize,
            reason: 'File too large'
          },
          'medium'
        )
      } catch (e) {
        // Ignore if security monitor is not available
      }
    }
  }
  
  // Check minimum file size (prevent empty files)
  if (file.size < 100) {
    errors.push('File appears to be empty or corrupted')
  }
  
  // Check filename
  if (!file.name || file.name.length === 0) {
    errors.push('File must have a valid name')
  } else {
    // Validate filename
    const sanitizedName = sanitizeFilename(file.name)
    if (sanitizedName !== file.name) {
      errors.push('Filename contains invalid characters')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  }
}

// Additional security utilities
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export function sanitizeURL(url: string): string {
  try {
    const parsed = new URL(url)
    
    // Only allow HTTP and HTTPS protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol')
    }
    
    // Prevent localhost and private IP access in production
    if (process.env.NODE_ENV === 'production') {
      const hostname = parsed.hostname.toLowerCase()
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.')
      ) {
        throw new Error('Private network access not allowed')
      }
    }
    
    return parsed.toString()
  } catch {
    throw new Error('Invalid URL format')
  }
}

export function validateJSONInput(input: string): { isValid: boolean; error?: string } {
  try {
    // Check for excessively large JSON
    if (input.length > 1024 * 1024) { // 1MB limit
      return { isValid: false, error: 'JSON input too large' }
    }
    
    // Check for deeply nested objects (prevent DoS)
    const depthLimit = 20
    let depth = 0
    let maxDepth = 0
    
    for (const char of input) {
      if (char === '{' || char === '[') {
        depth++
        maxDepth = Math.max(maxDepth, depth)
      } else if (char === '}' || char === ']') {
        depth--
      }
      
      if (maxDepth > depthLimit) {
        return { isValid: false, error: 'JSON nesting too deep' }
      }
    }
    
    JSON.parse(input)
    return { isValid: true }
  } catch (error) {
    return { isValid: false, error: 'Invalid JSON format' }
  }
}