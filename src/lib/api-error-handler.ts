import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { 
  ValidationError, 
  AuthenticationError, 
  AuthorizationError, 
  NotFoundError,
  ServerError 
} from './error-utils';

export interface ApiErrorResponse {
  error: {
    message: string;
    code?: string;
    details?: any;
  };
  success: false;
}

export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  console.error('API Error:', error);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
        success: false,
      },
      { status: 400 }
    );
  }

  // Handle custom application errors
  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.code,
          details: error.field ? { field: error.field } : undefined,
        },
        success: false,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof AuthenticationError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.code,
        },
        success: false,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof AuthorizationError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.code,
        },
        success: false,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof NotFoundError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.code,
        },
        success: false,
      },
      { status: error.statusCode }
    );
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as any;
    
    switch (prismaError.code) {
      case 'P2002':
        return NextResponse.json(
          {
            error: {
              message: 'A record with this data already exists',
              code: 'DUPLICATE_ERROR',
              details: prismaError.meta,
            },
            success: false,
          },
          { status: 409 }
        );
      
      case 'P2025':
        return NextResponse.json(
          {
            error: {
              message: 'Record not found',
              code: 'NOT_FOUND_ERROR',
            },
            success: false,
          },
          { status: 404 }
        );
      
      case 'P2003':
        return NextResponse.json(
          {
            error: {
              message: 'Foreign key constraint failed',
              code: 'CONSTRAINT_ERROR',
            },
            success: false,
          },
          { status: 400 }
        );
    }
  }

  // Handle generic errors
  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: {
          message: process.env.NODE_ENV === 'development' 
            ? error.message 
            : 'Internal server error',
          code: 'SERVER_ERROR',
        },
        success: false,
      },
      { status: 500 }
    );
  }

  // Fallback for unknown errors
  return NextResponse.json(
    {
      error: {
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
      },
      success: false,
    },
    { status: 500 }
  );
}

export function createApiHandler<T = any>(
  handler: () => Promise<NextResponse<T>>
): () => Promise<NextResponse<T | ApiErrorResponse>> {
  return async () => {
    try {
      return await handler();
    } catch (error) {
      return handleApiError(error);
    }
  };
}

export function withApiErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<NextResponse<R>>
) {
  return async (...args: T): Promise<NextResponse<R | ApiErrorResponse>> => {
    try {
      return await fn(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}