const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function setupTestDatabase() {
  console.log('Setting up test database...');
  
  // Set test environment
  process.env.DATABASE_URL = 'file:./test.db';
  process.env.NODE_ENV = 'test';
  
  try {
    // Remove existing test database
    const testDbPath = path.join(process.cwd(), 'prisma', 'test.db');
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
      console.log('Removed existing test database');
    }
    
    // Generate Prisma client
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Push schema to test database
    execSync('npx prisma db push --force-reset', { 
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: 'file:./test.db' }
    });
    
    console.log('Test database setup complete!');
  } catch (error) {
    console.error('Failed to setup test database:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  setupTestDatabase();
}

module.exports = { setupTestDatabase };