'use client'

import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Plus } from 'lucide-react'
import { ProductFormData } from '../multi-step-form'

export function ProductDetailsStep() {
  const { register, formState: { errors }, setValue, watch } = useFormContext<ProductFormData>()
  
  const [newTag, setNewTag] = useState('')
  const [newSpecKey, setNewSpecKey] = useState('')
  const [newSpecValue, setNewSpecValue] = useState('')
  
  const tags = watch('step2.tags') || []
  const specifications = watch('step2.specifications') || {}

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setValue('step2.tags', [...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setValue('step2.tags', tags.filter(tag => tag !== tagToRemove))
  }

  const addSpecification = () => {
    if (newSpecKey.trim() && newSpecValue.trim()) {
      setValue('step2.specifications', {
        ...specifications,
        [newSpecKey.trim()]: newSpecValue.trim()
      })
      setNewSpecKey('')
      setNewSpecValue('')
    }
  }

  const removeSpecification = (keyToRemove: string) => {
    const newSpecs = { ...specifications }
    delete newSpecs[keyToRemove]
    setValue('step2.specifications', newSpecs)
  }

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      action()
    }
  }

  return (
    <div className="space-y-6">
      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Product Description *</Label>
        <Textarea
          id="description"
          {...register('step2.description')}
          placeholder="Provide a detailed description of your product..."
          rows={4}
          className={errors.step2?.description ? 'border-red-500' : ''}
        />
        {errors.step2?.description && (
          <p className="text-sm text-red-600">{errors.step2.description.message}</p>
        )}
        <p className="text-sm text-gray-600">
          Minimum 10 characters. This description will be visible to customers.
        </p>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>Product Tags</Label>
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add a tag..."
            onKeyPress={(e) => handleKeyPress(e, addTag)}
          />
          <Button type="button" onClick={addTag} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <p className="text-sm text-gray-600">
          Tags help customers find your product. Press Enter or click + to add.
        </p>
      </div>

      {/* Specifications */}
      <div className="space-y-2">
        <Label>Product Specifications</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Input
            value={newSpecKey}
            onChange={(e) => setNewSpecKey(e.target.value)}
            placeholder="Specification name..."
            onKeyPress={(e) => handleKeyPress(e, addSpecification)}
          />
          <Input
            value={newSpecValue}
            onChange={(e) => setNewSpecValue(e.target.value)}
            placeholder="Specification value..."
            onKeyPress={(e) => handleKeyPress(e, addSpecification)}
          />
          <Button type="button" onClick={addSpecification} size="sm">
            <Plus className="h-4 w-4" />
            Add Spec
          </Button>
        </div>
        
        {Object.keys(specifications).length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="font-medium">Current Specifications:</h4>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              {Object.entries(specifications).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center py-1">
                  <span className="font-medium">{key}:</span>
                  <div className="flex items-center gap-2">
                    <span>{value}</span>
                    <button
                      type="button"
                      onClick={() => removeSpecification(key)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <p className="text-sm text-gray-600">
          Add technical specifications like dimensions, weight, materials, etc.
        </p>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Step 2: Product Details</h3>
        <p className="text-sm text-blue-700">
          Provide detailed information about your product. A good description helps customers 
          understand what they're buying. Tags and specifications are optional but recommended 
          for better searchability and customer information.
        </p>
      </div>
    </div>
  )
}