import { toast } from 'sonner';

export interface IAppError extends Error {
  code?: string;
  statusCode?: number;
  retryable?: boolean;
}

export class AppError extends Error implements IAppError {
  code?: string;
  statusCode?: number;
  retryable?: boolean;

  constructor(message: string, code?: string, statusCode?: number, retryable?: boolean) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.retryable = retryable;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400, false);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401, false);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 'AUTHORIZATION_ERROR', 403, false);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND_ERROR', 404, false);
    this.name = 'NotFoundError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network error occurred') {
    super(message, 'NETWORK_ERROR', 500, true);
    this.name = 'NetworkError';
  }
}

export class ServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 'SERVER_ERROR', 500, true);
    this.name = 'ServerError';
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.retryable ?? false;
  }
  return false;
}

export function handleApiError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    // Check for specific error patterns
    if (error.message.includes('fetch')) {
      return new NetworkError('Network connection failed');
    }
    if (error.message.includes('unauthorized') || error.message.includes('401')) {
      return new AuthenticationError();
    }
    if (error.message.includes('forbidden') || error.message.includes('403')) {
      return new AuthorizationError();
    }
    if (error.message.includes('not found') || error.message.includes('404')) {
      return new NotFoundError();
    }
    
    return new ServerError(error.message);
  }

  return new ServerError('An unexpected error occurred');
}

export function showErrorToast(error: unknown, defaultMessage?: string) {
  const message = getErrorMessage(error) || defaultMessage || 'Something went wrong';
  toast.error(message);
}

export function showSuccessToast(message: string) {
  toast.success(message);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries || !isRetryableError(error)) {
        throw error;
      }

      // Exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError;
}

export function createErrorHandler(context: string) {
  return (error: unknown) => {
    console.error(`Error in ${context}:`, error);
    
    const appError = handleApiError(error);
    showErrorToast(appError);
    
    return appError;
  };
}