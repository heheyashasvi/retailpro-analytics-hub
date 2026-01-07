'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MultiStepProductForm, ProductFormData } from '@/components/products/multi-step-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function CreateProductPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: ProductFormData) => {
    setIsLoading(true)
    
    try {
      // Prepare product data for API (JSON format, not FormData)
      const productData = {
        name: data.step1.name,
        category: data.step1.category,
        status: data.step1.status,
        description: data.step2.description,
        specifications: data.step2.specifications,
        tags: data.step2.tags,
        price: data.step4.price,
        costPrice: data.step4.costPrice,
        stock: data.step4.stock,
        lowStockThreshold: data.step4.lowStockThreshold,
        // For now, we'll skip image upload and just create the product
        // Images can be added later via a separate endpoint
        images: [],
        primaryImageIndex: 0
      }
      
      // Submit to API
      const response = await fetch('/api/products', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData)
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create product')
      }
      
      // Show success message
      alert('Product created successfully!')
      
      // Redirect to products page on success
      router.push('/dashboard/products')
    } catch (error) {
      console.error('Error creating product:', error)
      alert(`Error creating product: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Product</h1>
          <p className="text-muted-foreground">
            Add a new product to your catalog
          </p>
        </div>
      </div>

      {/* Form */}
      <MultiStepProductForm 
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  )
}