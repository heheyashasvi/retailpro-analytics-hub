import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create initial admin user
  const adminEmail = 'admin@ecommerce.com'
  const adminPassword = 'admin123456' // Change this in production!
  
  // Check if admin already exists
  const existingAdmin = await prisma.adminUser.findUnique({
    where: { email: adminEmail }
  })

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 12)
    
    const admin = await prisma.adminUser.create({
      data: {
        email: adminEmail,
        passwordHash: hashedPassword,
        name: 'System Administrator',
        role: 'super_admin',
      },
    })

    console.log('✅ Created admin user:', {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    })
  } else {
    console.log('ℹ️  Admin user already exists')
  }

  // Create sample categories and products
  const categories = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports']
  
  const sampleProducts = [
    {
      name: 'Wireless Headphones',
      description: 'High-quality wireless headphones with noise cancellation',
      price: 199.99,
      stock: 50,
      category: 'Electronics',
      status: 'active',
    },
    {
      name: 'Cotton T-Shirt',
      description: 'Comfortable 100% cotton t-shirt in various colors',
      price: 29.99,
      stock: 100,
      category: 'Clothing',
      status: 'active',
    },
    {
      name: 'JavaScript Guide',
      description: 'Complete guide to modern JavaScript development',
      price: 49.99,
      stock: 25,
      category: 'Books',
      status: 'active',
    },
    {
      name: 'Garden Tools Set',
      description: 'Essential tools for gardening enthusiasts',
      price: 89.99,
      stock: 15,
      category: 'Home & Garden',
      status: 'draft',
    },
    {
      name: 'Running Shoes',
      description: 'Professional running shoes for athletes',
      price: 129.99,
      stock: 30,
      category: 'Sports',
      status: 'active',
    },
  ]

  for (const productData of sampleProducts) {
    const existingProduct = await prisma.product.findFirst({
      where: { name: productData.name }
    })

    if (!existingProduct) {
      const product = await prisma.product.create({
        data: productData,
      })
      console.log('✅ Created product:', product.name)
    }
  }

  // Create sample sales data
  const products = await prisma.product.findMany()
  
  if (products.length > 0) {
    const salesData = []
    const now = new Date()
    
    // Generate sales for the last 30 days
    for (let i = 0; i < 30; i++) {
      const saleDate = new Date(now)
      saleDate.setDate(now.getDate() - i)
      
      // Random number of sales per day (0-5)
      const salesCount = Math.floor(Math.random() * 6)
      
      for (let j = 0; j < salesCount; j++) {
        const randomProduct = products[Math.floor(Math.random() * products.length)]
        const quantity = Math.floor(Math.random() * 3) + 1 // 1-3 items
        const unitPrice = Number(randomProduct.price)
        
        salesData.push({
          productId: randomProduct.id,
          quantity,
          unitPrice,
          totalAmount: unitPrice * quantity,
          saleDate,
        })
      }
    }

    if (salesData.length > 0) {
      await prisma.salesData.createMany({
        data: salesData,
      })
      console.log(`✅ Created ${salesData.length} sales records`)
    }
  }

  console.log('🎉 Database seed completed!')
  console.log('\n📋 Default Admin Credentials:')
  console.log(`Email: ${adminEmail}`)
  console.log(`Password: ${adminPassword}`)
  console.log('\n⚠️  Remember to change the admin password in production!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })