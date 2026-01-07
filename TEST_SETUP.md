# Test Environment Setup Guide

This guide explains how to set up and run the test environment for the e-commerce admin dashboard.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **npm** or **yarn**
3. **SQLite** (for test database)

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Generate Prisma Client

```bash
npm run db:generate
```

### 3. Setup Test Database

```bash
npm run test:setup
```

This script will:
- Create a separate test database (`test.db`)
- Run Prisma migrations
- Generate the Prisma client for testing

## Running Tests

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### All Tests
```bash
npm run test:all
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## Test Structure

```
src/__tests__/
├── integration/           # Integration tests (Node.js environment)
│   ├── auth-flow.test.ts
│   ├── product-management.test.ts
│   └── image-management.test.ts
├── setup/                 # Test utilities
│   ├── test-db.ts        # Database setup/cleanup
│   └── test-server.ts    # Test server setup
└── **/*.test.ts          # Unit tests (jsdom environment)
```

## Test Environments

### Unit Tests
- **Environment**: jsdom (browser-like)
- **Purpose**: Component testing, utility functions
- **Setup**: `jest.setup.js`

### Integration Tests
- **Environment**: Node.js
- **Purpose**: API testing, database operations, full workflows
- **Setup**: `jest.setup.node.js`

### Property-Based Tests
- **Environment**: Node.js
- **Purpose**: Testing universal properties with generated inputs
- **Library**: fast-check

## Environment Variables

The test environment uses these variables:

```env
DATABASE_URL=file:./test.db
NODE_ENV=test
NEXTAUTH_SECRET=test-secret
CLOUDINARY_CLOUD_NAME=test-cloud
CLOUDINARY_API_KEY=test-key
CLOUDINARY_API_SECRET=test-secret
```

## Troubleshooting

### Common Issues

1. **Prisma Client Error**
   ```
   PrismaClient is unable to run in this browser environment
   ```
   **Solution**: Ensure integration tests use Node.js environment in Jest config

2. **Database Connection Error**
   ```
   Can't reach database server
   ```
   **Solution**: Run `npm run test:setup` to create test database

3. **Module Not Found**
   ```
   Cannot resolve module '@/...'
   ```
   **Solution**: Check `moduleNameMapping` in `jest.config.js`

### Reset Test Environment

If tests are failing due to environment issues:

```bash
# Clean everything
rm -f prisma/test.db
npm run test:setup
npm run test:all
```

### Debug Mode

Run tests with debug output:

```bash
DEBUG=* npm run test:integration
```

## Test Database Management

### Manual Database Operations

```bash
# View test database
npx prisma studio --schema prisma/schema.prisma

# Reset test database
rm -f prisma/test.db
npm run test:setup

# Run migrations on test DB
DATABASE_URL=file:./test.db npx prisma db push
```

### Database Cleanup

Tests automatically clean up data between runs, but you can manually clean:

```bash
# Remove test database
rm -f prisma/test.db

# Remove all test artifacts
rm -f prisma/test.db*
```

## Performance Considerations

### Test Timeouts

- Unit tests: 5 seconds (default)
- Integration tests: 30 seconds
- Property-based tests: 30 seconds

### Parallel Execution

Tests run in parallel by default. If you encounter issues:

```bash
# Run tests serially
npm run test -- --runInBand
```

### Memory Usage

For large test suites:

```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" npm run test
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:setup
      - run: npm run test:all
```

### Docker Testing

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run test:setup
CMD ["npm", "run", "test:all"]
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data
3. **Mocking**: Mock external services (Cloudinary, etc.)
4. **Assertions**: Use specific, meaningful assertions
5. **Performance**: Keep tests fast and focused

## Adding New Tests

### Unit Test Example
```typescript
// src/components/Button.test.tsx
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
```

### Integration Test Example
```typescript
// src/__tests__/integration/new-feature.test.ts
import { testDb, setupTestDatabase, cleanupTestDatabase } from '../setup/test-db'

describe('New Feature Integration', () => {
  beforeAll(async () => {
    await setupTestDatabase()
  })

  beforeEach(async () => {
    await cleanupTestDatabase()
  })

  it('should work correctly', async () => {
    // Test implementation
  })
})
```

This setup provides a robust testing environment that can handle both unit and integration testing scenarios.