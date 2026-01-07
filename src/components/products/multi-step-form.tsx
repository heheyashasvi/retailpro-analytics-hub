'use client'

import { useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { BasicProductInfoStep } from './steps/basic-info-step'
import { ProductDetailsStep } from './steps/product-details-step'
import { ProductImagesStep } from './steps/product-images-step'
import { PricingAndStockStep } from './steps/pricing-stock-step'

// Step schemas
const basicInfoSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255, 'Name too long'),
  category: z.string().min(1, 'Category is required'),
  status: z.enum(['active', 'inactive', 'draft']).default('draft')
})

const productDetailsSchema = z.object({
  description: z.string().min(10, 'Description must be at least 10 characters'),
  specifications: z.record(z.string()).optional().default({}),
  tags: z.array(z.string()).optional().default([])
})

const productImagesSchema = z.object({
  images: z.array(z.any()).optional().default([]),
  primaryImageIndex: z.number().min(0).default(0),
  altTexts: z.array(z.string()).optional().default([])
})

const pricingStockSchema = z.object({
  price: z.number().min(0.01, 'Price must be greater than 0'),
  costPrice: z.number().min(0, 'Cost price cannot be negative').optional(),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  lowStockThreshold: z.number().int().min(0, 'Threshold cannot be negative').default(10)
})

// Combined schema for final validation
export const productFormSchema = z.object({
  step1: basicInfoSchema,
  step2: productDetailsSchema,
  step3: productImagesSchema,
  step4: pricingStockSchema
})

export type ProductFormData = z.infer<typeof productFormSchema>

interface MultiStepProductFormProps {
  onSubmit: (data: ProductFormData) => Promise<void>
  initialData?: Partial<ProductFormData>
  isLoading?: boolean
}

const steps = [
  { id: 1, title: 'Basic Information', description: 'Name, category, and status' },
  { id: 2, title: 'Product Details', description: 'Description and specifications' },
  { id: 3, title: 'Images', description: 'Upload product images' },
  { id: 4, title: 'Pricing & Stock', description: 'Price and inventory details' }
]

export function MultiStepProductForm({ 
  onSubmit, 
  initialData, 
  isLoading = false 
}: MultiStepProductFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const methods = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      step1: {
        name: '',
        category: '',
        status: 'draft'
      },
      step2: {
        description: '',
        specifications: {},
        tags: []
      },
      step3: {
        images: [],
        primaryImageIndex: 0,
        altTexts: []
      },
      step4: {
        price: 0,
        costPrice: 0,
        stock: 0,
        lowStockThreshold: 10
      },
      ...initialData
    },
    mode: 'onChange'
  })

  const { handleSubmit, trigger, formState: { errors } } = methods

  const validateCurrentStep = async (): Promise<boolean> => {
    const stepKey = `step${currentStep}` as keyof ProductFormData
    const isValid = await trigger(stepKey)
    
    if (isValid) {
      setCompletedSteps(prev => new Set([...prev, currentStep]))
    }
    
    return isValid
  }

  const handleNext = async () => {
    const isValid = await validateCurrentStep()
    if (isValid && currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepClick = async (stepNumber: number) => {
    // Allow navigation to previous steps or next step if current is valid
    if (stepNumber < currentStep || (stepNumber === currentStep + 1 && await validateCurrentStep())) {
      setCurrentStep(stepNumber)
    }
  }

  const handleFormSubmit = async (data: ProductFormData) => {
    // Final validation of all steps
    const isValid = await trigger()
    if (isValid) {
      await onSubmit(data)
    }
  }

  const progress = (currentStep / steps.length) * 100

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <BasicProductInfoStep />
      case 2:
        return <ProductDetailsStep />
      case 3:
        return <ProductImagesStep />
      case 4:
        return <PricingAndStockStep />
      default:
        return null
    }
  }

  const hasStepErrors = (stepNumber: number) => {
    const stepKey = `step${stepNumber}` as keyof ProductFormData
    return !!errors[stepKey]
  }

  return (
    <FormProvider {...methods}>
      <div className="max-w-4xl mx-auto p-6">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {steps.map((step) => (
              <button
                key={step.id}
                type="button"
                onClick={() => handleStepClick(step.id)}
                className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                  currentStep === step.id
                    ? 'bg-blue-100 text-blue-700'
                    : completedSteps.has(step.id)
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : hasStepErrors(step.id)
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
                disabled={step.id > currentStep + 1}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-1 ${
                  currentStep === step.id
                    ? 'bg-blue-600 text-white'
                    : completedSteps.has(step.id)
                    ? 'bg-green-600 text-white'
                    : hasStepErrors(step.id)
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-400 text-white'
                }`}>
                  {completedSteps.has(step.id) ? '✓' : step.id}
                </div>
                <span className="text-xs font-medium">{step.title}</span>
                <span className="text-xs text-gray-500">{step.description}</span>
              </button>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Form content */}
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>
                Step {currentStep}: {steps[currentStep - 1].title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* Navigation buttons */}
          <div className="flex justify-between mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              Previous
            </Button>

            <div className="flex gap-2">
              {currentStep < steps.length ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isLoading}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? 'Creating Product...' : 'Create Product'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </FormProvider>
  )
}