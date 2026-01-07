'use client'

import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, DollarSign, Package, TrendingDown } from 'lucide-react'
import { ProductFormData } from '../multi-step-form'

export function PricingAndStockStep() {
  const { register, formState: { errors }, watch } = useFormContext<ProductFormData>()
  
  const price = watch('step4.price') || 0
  const costPrice = watch('step4.costPrice') || 0
  const stock = watch('step4.stock') || 0
  const lowStockThreshold = watch('step4.lowStockThreshold') || 10

  const profit = price - costPrice
  const profitMargin = costPrice > 0 ? ((profit / costPrice) * 100) : 0
  const isLowStock = stock <= lowStockThreshold

  return (
    <div className="space-y-6">
      {/* Pricing Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pricing Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Selling Price */}
            <div className="space-y-2">
              <Label htmlFor="price">Selling Price * ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0.01"
                {...register('step4.price', { valueAsNumber: true })}
                placeholder="0.00"
                className={errors.step4?.price ? 'border-red-500' : ''}
              />
              {errors.step4?.price && (
                <p className="text-sm text-red-600">{errors.step4.price.message}</p>
              )}
            </div>

            {/* Cost Price */}
            <div className="space-y-2">
              <Label htmlFor="costPrice">Cost Price ($)</Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                min="0"
                {...register('step4.costPrice', { valueAsNumber: true })}
                placeholder="0.00"
                className={errors.step4?.costPrice ? 'border-red-500' : ''}
              />
              {errors.step4?.costPrice && (
                <p className="text-sm text-red-600">{errors.step4.costPrice.message}</p>
              )}
              <p className="text-sm text-gray-600">
                Optional: Used for profit calculations
              </p>
            </div>
          </div>

          {/* Profit Calculation */}
          {costPrice > 0 && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Profit Analysis</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-green-700">Profit per unit:</span>
                  <span className="font-medium ml-2">${profit.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-green-700">Profit margin:</span>
                  <span className="font-medium ml-2">{profitMargin.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inventory Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stock Quantity */}
            <div className="space-y-2">
              <Label htmlFor="stock">Stock Quantity *</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                {...register('step4.stock', { valueAsNumber: true })}
                placeholder="0"
                className={errors.step4?.stock ? 'border-red-500' : ''}
              />
              {errors.step4?.stock && (
                <p className="text-sm text-red-600">{errors.step4.stock.message}</p>
              )}
            </div>

            {/* Low Stock Threshold */}
            <div className="space-y-2">
              <Label htmlFor="lowStockThreshold">Low Stock Alert Threshold</Label>
              <Input
                id="lowStockThreshold"
                type="number"
                min="0"
                {...register('step4.lowStockThreshold', { valueAsNumber: true })}
                placeholder="10"
                className={errors.step4?.lowStockThreshold ? 'border-red-500' : ''}
              />
              {errors.step4?.lowStockThreshold && (
                <p className="text-sm text-red-600">{errors.step4.lowStockThreshold.message}</p>
              )}
              <p className="text-sm text-gray-600">
                You'll be notified when stock falls below this level
              </p>
            </div>
          </div>

          {/* Stock Status Alert */}
          {isLowStock && stock > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Low Stock Warning</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Current stock ({stock}) is at or below the low stock threshold ({lowStockThreshold}).
                Consider restocking soon.
              </p>
            </div>
          )}

          {stock === 0 && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <TrendingDown className="h-5 w-5" />
                <span className="font-medium">Out of Stock</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                This product will be marked as out of stock and unavailable for purchase.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Step 4: Pricing & Stock</h3>
        <p className="text-sm text-blue-700 mb-3">
          Set your product's pricing and inventory levels. This information is crucial for 
          sales tracking and inventory management.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white p-3 rounded border">
            <span className="text-gray-600">Selling Price:</span>
            <div className="font-medium text-lg">${price.toFixed(2)}</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <span className="text-gray-600">Stock Level:</span>
            <div className="font-medium text-lg">
              {stock} units
              {isLowStock && stock > 0 && (
                <span className="text-yellow-600 text-xs ml-1">(Low)</span>
              )}
              {stock === 0 && (
                <span className="text-red-600 text-xs ml-1">(Out of Stock)</span>
              )}
            </div>
          </div>
          <div className="bg-white p-3 rounded border">
            <span className="text-gray-600">Profit Margin:</span>
            <div className="font-medium text-lg">
              {costPrice > 0 ? `${profitMargin.toFixed(1)}%` : 'N/A'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}