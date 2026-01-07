import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  handleApiError, 
  showErrorToast, 
  AuthenticationError, 
  AuthorizationError 
} from '@/lib/error-utils';

interface UseErrorHandlerOptions {
  redirectOnAuth?: boolean;
  showToast?: boolean;
  context?: string;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { redirectOnAuth = true, showToast = true, context = 'Operation' } = options;
  const router = useRouter();

  const handleError = useCallback((error: unknown) => {
    console.error(`Error in ${context}:`, error);
    
    const appError = handleApiError(error);
    
    // Handle authentication errors
    if (appError instanceof AuthenticationError && redirectOnAuth) {
      router.push('/login');
      return appError;
    }
    
    // Handle authorization errors
    if (appError instanceof AuthorizationError && redirectOnAuth) {
      router.push('/dashboard'); // Redirect to safe page
      return appError;
    }
    
    // Show toast notification
    if (showToast) {
      showErrorToast(appError);
    }
    
    return appError;
  }, [context, redirectOnAuth, showToast, router]);

  return { handleError };
}