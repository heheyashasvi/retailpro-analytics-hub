'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Save, X, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Product } from '@/types'
import Link from 'next/link'

const productEditSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255, 'Name too long'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description too long'),
  price: z.number().min(0, 'Price cannot be negative').max(999999.99, 'Price too high'),
  costPrice: z.number().min(0, 'Cost price cannot be negative').max(999999.99, 'Cost price too high').optional(),
  stock: z.number().int().min(0, 'Stock cannot be negative').max(999999, 'Stock too high'),
  lowStockThreshold: z.number().int().min(0, 'Threshold cannot be negative').max(999999, 'Threshold too high').optional(),
  category: z.string().min(1, 'Category is required').max(100, 'Category too long'),
  status: z.enum(['active', 'inactive', 'draft']),
  specifications: z.record(z.string()).optional(),
  tags: z.array(z.string()).optional(),
})

type ProductEditFormData = z.infer<typeof productEditSchema>

interface ProductEditFormProps {
  product: Product
}

export function ProductEditForm({ product }: ProductEditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newSpecKey, setNewSpecKey] = useState('')
  const [newSpecValue, setNewSpecValue] = useState('')
  const [newTag, setNewTag] = useState('')
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ProductEditFormData>({
    resolver: zodResolver(productEditSchema),
    defaultValues: {
      name: product.name,
      description: product.description,
      price: product.price,
      costPrice: product.costPrice || 0,
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold || 10,
      category: product.category,
      status: product.status,
      specifications: product.specifications || {},
      tags: product.tags || [],
    },
  })

  const watchedSpecs = watch('specifications') || {}
  const watchedTags = watch('tags') || []
  const watchedStatus = watch('status')

  const onSubmit = async (data: ProductEditFormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to update product')
      }

      toast.success('Product updated successfully')
      router.push(`/dashboard/products/${product.id}`)
      router.refresh()
    } catch (error) {
      console.error('Update product error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update product')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddSpecification = () => {
    if (newSpecKey.trim() && newSpecValue.trim()) {
      const updatedSpecs = {
        ...watchedSpecs,
        [newSpecKey.trim()]: newSpecValue.trim(),
      }
      setValue('specifications', updatedSpecs)
      setNewSpecKey('')
      setNewSpecValue('')
    }
  }

  const handleRemoveSpecification = (key: string) => {
    const updatedSpecs = { ...watchedSpecs }
    delete updatedSpecs[key]
    setValue('specifications', updatedSpecs)
  }

  const handleAddTag = () => {
    if (newTag.trim() && !watchedTags.includes(newTag.trim())) {
      setValue('tags', [...watchedTags, newTag.trim()])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setValue('tags', watchedTags.filter(tag => tag !== tagToRemove))
  }

  const handleReset = () => {
    reset()
    setNewSpecKey('')
    setNewSpecValue('')
    setNewTag('')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href={`/dashboard/products/${product.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Product
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={handleReset}>
            Reset Changes
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Enter product name"
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Enter product description"
                  rows={4}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    {...register('category')}
                    placeholder="Enter category"
                  />
                  {errors.category && (
                    <p className="text-sm text-red-600">{errors.category.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={watchedStatus}
                    onValueChange={(value) => setValue('status', value as 'active' | 'inactive' | 'draft')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && (
                    <p className="text-sm text-red-600">{errors.status.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(watchedSpecs).length > 0 && (
                <div className="space-y-2">
                  {Object.entries(watchedSpecs).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="font-medium text-sm">{key}:</span>
                        <span className="text-sm ml-2">{value}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSpecification(key)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Input
                  placeholder="Specification name"
                  value={newSpecKey}
                  onChange={(e) => setNewSpecKey(e.target.value)}
                />
                <Input
                  placeholder="Specification value"
                  value={newSpecValue}
                  onChange={(e) => setNewSpecValue(e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSpecification}
                disabled={!newSpecKey.trim() || !newSpecValue.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Specification
              </Button>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {watchedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {watchedTags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}

              <Separator />

              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddTag}
                  disabled={!newTag.trim() || watchedTags.includes(newTag.trim())}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="price">Selling Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  {...register('price', { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="text-sm text-red-600">{errors.price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="costPrice">Cost Price ($)</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  {...register('costPrice', { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {errors.costPrice && (
                  <p className="text-sm text-red-600">{errors.costPrice.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Current Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  {...register('stock', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.stock && (
                  <p className="text-sm text-red-600">{errors.stock.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lowStockThreshold">Low Stock Alert</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  {...register('lowStockThreshold', { valueAsNumber: true })}
                  placeholder="10"
                />
                {errors.lowStockThreshold && (
                  <p className="text-sm text-red-600">{errors.lowStockThreshold.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  )
}