'use client'

import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProductFormData } from '../multi-step-form'

const categories = [
  'Electronics',
  'Clothing',
  'Home & Garden',
  'Sports & Outdoors',
  'Books',
  'Health & Beauty',
  'Toys & Games',
  'Automotive',
  'Food & Beverages',
  'Other'
]

export function BasicProductInfoStep() {
  const { register, formState: { errors }, setValue, watch } = useFormContext<ProductFormData>()
  
  const status = watch('step1.status')

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Product Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            {...register('step1.name')}
            placeholder="Enter product name"
            className={errors.step1?.name ? 'border-red-500' : ''}
          />
          {errors.step1?.name && (
            <p className="text-sm text-red-600">{errors.step1.name.message}</p>
          )}
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
            value={watch('step1.category')}
            onValueChange={(value) => setValue('step1.category', value)}
          >
            <SelectTrigger className={errors.step1?.category ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.step1?.category && (
            <p className="text-sm text-red-600">{errors.step1.category.message}</p>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label htmlFor="status">Product Status</Label>
        <Select
          value={status}
          onValueChange={(value) => setValue('step1.status', value as 'active' | 'inactive' | 'draft')}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-600">
          {status === 'draft' && 'Product will be saved as draft and not visible to customers'}
          {status === 'active' && 'Product will be visible and available for purchase'}
          {status === 'inactive' && 'Product will be hidden from customers but remain in inventory'}
        </p>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Step 1: Basic Information</h3>
        <p className="text-sm text-blue-700">
          Provide the essential details about your product. The name and category are required 
          to proceed to the next step. You can always come back to modify these details later.
        </p>
      </div>
    </div>
  )
}