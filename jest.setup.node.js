// Jest setup for Node.js environment (integration and property tests)
require('@testing-library/jest-dom')

// Mock Next.js modules that don't work in Node.js environment
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(() => '/dashboard'),
  }),
  usePathname: () => '/test-path',
  redirect: jest.fn(),
  notFound: jest.fn(),
}))

jest.mock('next/headers', () => ({
  cookies: () => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    has: jest.fn(),
  }),
  headers: () => ({
    get: jest.fn(),
    set: jest.fn(),
  }),
}))

// Mock fetch for API calls
global.fetch = jest.fn()

// Setup test database URL
process.env.DATABASE_URL = 'file:./test.db'
process.env.NODE_ENV = 'test'

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud'
process.env.CLOUDINARY_API_KEY = 'test-key'
process.env.CLOUDINARY_API_SECRET = 'test-secret'

// Increase timeout for integration tests
jest.setTimeout(30000)