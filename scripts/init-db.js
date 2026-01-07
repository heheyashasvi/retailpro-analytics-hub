const { PrismaClient } = require('@prisma/client')

async function initDatabase() {
  const prisma = new PrismaClient()
  
  try {
    // Test database connection
    await prisma.$connect()
    console.log('Database connected successfully')
    
    // Create sample admin user if none exists
    const adminCount = await prisma.admin.count()
    if (adminCount === 0) {
      const bcrypt = require('bcryptjs')
      const hashedPassword = await bcrypt.hash('admin123456', 12)
      
      await prisma.admin.create({
        data: {
          email: 'admin@ecommerce.com',
          password: hashedPassword,
          name: 'Admin User',
          role: 'admin'
        }
      })
      console.log('Sample admin user created')
    }
    
  } catch (error) {
    console.error('Database initialization error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  initDatabase()
}

module.exports = { initDatabase }