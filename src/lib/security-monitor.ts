import { NextRequest } from 'next/server'

// Security event types
export enum SecurityEventType {
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  CSRF_ATTACK = 'CSRF_ATTACK',
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  PATH_TRAVERSAL_ATTEMPT = 'PATH_TRAVERSAL_ATTEMPT',
  COMMAND_INJECTION_ATTEMPT = 'COMMAND_INJECTION_ATTEMPT',
  FAILED_LOGIN_ATTEMPT = 'FAILED_LOGIN_ATTEMPT',
  SUSPICIOUS_FILE_UPLOAD = 'SUSPICIOUS_FILE_UPLOAD',
  UNAUTHORIZED_ACCESS_ATTEMPT = 'UNAUTHORIZED_ACCESS_ATTEMPT',
  MALFORMED_REQUEST = 'MALFORMED_REQUEST',
  EXCESSIVE_PAYLOAD_SIZE = 'EXCESSIVE_PAYLOAD_SIZE',
}

// Security event interface
export interface SecurityEvent {
  type: SecurityEventType
  timestamp: Date
  ip: string
  userAgent: string
  url: string
  method: string
  details: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
  userId?: string
}

// In-memory store for security events (in production, use a database)
const securityEvents: SecurityEvent[] = []
const MAX_EVENTS = 10000 // Keep last 10k events in memory

// Suspicious IP tracking
const suspiciousIPs = new Map<string, {
  count: number
  firstSeen: Date
  lastSeen: Date
  events: SecurityEventType[]
}>()

// Rate limiting for security events to prevent log flooding
const eventRateLimit = new Map<string, { count: number; resetTime: number }>()

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const vercelIP = request.headers.get('x-vercel-forwarded-for')
  
  return forwarded?.split(',')[0] || realIP || vercelIP || 'unknown'
}

function shouldRateLimit(ip: string, eventType: SecurityEventType): boolean {
  const key = `${ip}:${eventType}`
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute window
  const maxEvents = 10 // Max 10 events per minute per IP per type
  
  const entry = eventRateLimit.get(key)
  
  if (!entry || now > entry.resetTime) {
    eventRateLimit.set(key, { count: 1, resetTime: now + windowMs })
    return false
  }
  
  if (entry.count >= maxEvents) {
    return true
  }
  
  entry.count++
  return false
}

export function logSecurityEvent(
  request: NextRequest,
  type: SecurityEventType,
  details: Record<string, any> = {},
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): void {
  const ip = getClientIP(request)
  
  // Rate limit security events to prevent log flooding
  if (shouldRateLimit(ip, type)) {
    return
  }
  
  const event: SecurityEvent = {
    type,
    timestamp: new Date(),
    ip,
    userAgent: request.headers.get('user-agent') || 'unknown',
    url: request.url,
    method: request.method,
    details,
    severity,
  }
  
  // Add to events store
  securityEvents.push(event)
  
  // Keep only recent events
  if (securityEvents.length > MAX_EVENTS) {
    securityEvents.shift()
  }
  
  // Track suspicious IPs
  trackSuspiciousIP(ip, type)
  
  // Log to console with appropriate level
  const logMessage = `[SECURITY] ${type}: ${ip} - ${request.method} ${request.url}`
  
  switch (severity) {
    case 'critical':
      console.error(logMessage, details)
      break
    case 'high':
      console.error(logMessage, details)
      break
    case 'medium':
      console.warn(logMessage, details)
      break
    case 'low':
      console.log(logMessage, details)
      break
  }
  
  // In production, you might want to send alerts for high/critical events
  if (severity === 'critical' || severity === 'high') {
    sendSecurityAlert(event)
  }
}

function trackSuspiciousIP(ip: string, eventType: SecurityEventType): void {
  const existing = suspiciousIPs.get(ip)
  const now = new Date()
  
  if (existing) {
    existing.count++
    existing.lastSeen = now
    existing.events.push(eventType)
    
    // Keep only recent event types (last 100)
    if (existing.events.length > 100) {
      existing.events = existing.events.slice(-100)
    }
  } else {
    suspiciousIPs.set(ip, {
      count: 1,
      firstSeen: now,
      lastSeen: now,
      events: [eventType],
    })
  }
  
  // Clean up old entries (older than 24 hours)
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
  for (const [ipAddr, data] of suspiciousIPs.entries()) {
    if (data.lastSeen < cutoff) {
      suspiciousIPs.delete(ipAddr)
    }
  }
}

function sendSecurityAlert(event: SecurityEvent): void {
  // In production, implement actual alerting (email, Slack, etc.)
  console.error(`[SECURITY ALERT] Critical security event detected:`, {
    type: event.type,
    ip: event.ip,
    url: event.url,
    timestamp: event.timestamp,
    details: event.details,
  })
  
  // You could integrate with services like:
  // - Email notifications
  // - Slack webhooks
  // - PagerDuty
  // - Security monitoring services
}

export function getSecurityEvents(
  limit: number = 100,
  severity?: 'low' | 'medium' | 'high' | 'critical',
  eventType?: SecurityEventType
): SecurityEvent[] {
  let filtered = securityEvents
  
  if (severity) {
    filtered = filtered.filter(event => event.severity === severity)
  }
  
  if (eventType) {
    filtered = filtered.filter(event => event.type === eventType)
  }
  
  return filtered
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit)
}

export function getSuspiciousIPs(): Array<{
  ip: string
  count: number
  firstSeen: Date
  lastSeen: Date
  eventTypes: SecurityEventType[]
}> {
  return Array.from(suspiciousIPs.entries())
    .map(([ip, data]) => ({
      ip,
      count: data.count,
      firstSeen: data.firstSeen,
      lastSeen: data.lastSeen,
      eventTypes: [...new Set(data.events)], // Unique event types
    }))
    .sort((a, b) => b.count - a.count)
}

export function isIPSuspicious(ip: string, threshold: number = 10): boolean {
  const data = suspiciousIPs.get(ip)
  return data ? data.count >= threshold : false
}

export function getSecurityMetrics(): {
  totalEvents: number
  eventsByType: Record<SecurityEventType, number>
  eventsBySeverity: Record<string, number>
  suspiciousIPCount: number
  recentEvents: number // Events in last hour
} {
  const now = Date.now()
  const oneHourAgo = now - 60 * 60 * 1000
  
  const eventsByType: Record<SecurityEventType, number> = {} as any
  const eventsBySeverity: Record<string, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  }
  
  let recentEvents = 0
  
  for (const event of securityEvents) {
    // Count by type
    eventsByType[event.type] = (eventsByType[event.type] || 0) + 1
    
    // Count by severity
    eventsBySeverity[event.severity]++
    
    // Count recent events
    if (event.timestamp.getTime() > oneHourAgo) {
      recentEvents++
    }
  }
  
  return {
    totalEvents: securityEvents.length,
    eventsByType,
    eventsBySeverity,
    suspiciousIPCount: suspiciousIPs.size,
    recentEvents,
  }
}

// Cleanup function to be called periodically
export function cleanupSecurityData(): void {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
  
  // Remove old events
  const oldLength = securityEvents.length
  for (let i = securityEvents.length - 1; i >= 0; i--) {
    if (securityEvents[i].timestamp < cutoff) {
      securityEvents.splice(i, 1)
    }
  }
  
  // Clean up rate limit entries
  const now = Date.now()
  for (const [key, entry] of eventRateLimit.entries()) {
    if (now > entry.resetTime) {
      eventRateLimit.delete(key)
    }
  }
  
  console.log(`[SECURITY] Cleaned up ${oldLength - securityEvents.length} old security events`)
}

// Auto-cleanup every hour
setInterval(cleanupSecurityData, 60 * 60 * 1000)