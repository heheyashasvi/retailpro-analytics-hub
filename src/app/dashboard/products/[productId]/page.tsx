import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { productService } from '@/services/product'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProductActions } from '@/components/products/product-actions'
import { 
  Edit, 
  ArrowLeft, 
  Package, 
  DollarSign, 
  Tag, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface ProductDetailPageProps {
  params: {
    productId: string
  }
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const product = await productService.getProduct(params.productId)

  if (!product) {
    notFound()
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  const getStatusBadge = (status: typeof product.status) => {
    const variants = {
      active: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      inactive: { variant: 'secondary' as const, icon: XCircle, color: 'text-gray-600' },
      draft: { variant: 'outline' as const, icon: AlertTriangle, color: 'text-yellow-600' },
    }

    const config = variants[status]
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getStockStatus = () => {
    const threshold = product.lowStockThreshold || 10
    if (product.stock === 0) {
      return { 
        badge: <Badge variant="destructive">Out of Stock</Badge>,
        color: 'text-red-600'
      }
    } else if (product.stock <= threshold) {
      return { 
        badge: <Badge variant="outline" className="bg-orange-100 text-orange-800">Low Stock</Badge>,
        color: 'text-orange-600'
      }
    }
    return { 
      badge: <Badge variant="outline" className="bg-green-100 text-green-800">In Stock</Badge>,
      color: 'text-green-600'
    }
  }

  const primaryImage = product.images.find(img => img.isPrimary) || product.images[0]
  const stockStatus = getStockStatus()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/products">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
            <p className="text-muted-foreground">
              Product ID: {product.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/products/${product.id}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit Product
            </Button>
          </Link>
          <ProductActions 
            productId={product.id} 
            productName={product.name}
            productStatus={product.status}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Images */}
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
            </CardHeader>
            <CardContent>
              {product.images.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {product.images.map((image, index) => (
                    <div key={image.id} className="relative">
                      <div className="relative aspect-square rounded-lg overflow-hidden border">
                        <Image
                          src={image.url}
                          alt={image.altText || product.name}
                          fill
                          className="object-cover"
                        />
                        {image.isPrimary && (
                          <div className="absolute top-2 left-2">
                            <Badge variant="default" className="text-xs">
                              Primary
                            </Badge>
                          </div>
                        )}
                      </div>
                      {image.altText && (
                        <p className="text-sm text-muted-foreground mt-2 truncate">
                          {image.altText}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No images uploaded</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{product.description}</p>
            </CardContent>
          </Card>

          {/* Specifications */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-sm font-medium text-muted-foreground">{key}</dt>
                      <dd className="text-sm mt-1">{value}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Product Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                {getStatusBadge(product.status)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Stock Status</span>
                {stockStatus.badge}
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Selling Price</span>
                <span className="text-lg font-bold">{formatPrice(product.price)}</span>
              </div>
              {product.costPrice && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Cost Price</span>
                  <span className="text-sm">{formatPrice(product.costPrice)}</span>
                </div>
              )}
              {product.costPrice && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Profit Margin</span>
                  <span className="text-sm font-medium text-green-600">
                    {(((product.price - product.costPrice) / product.price) * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Inventory
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Stock</span>
                <span className={`text-lg font-bold ${stockStatus.color}`}>
                  {product.stock} units
                </span>
              </div>
              {product.lowStockThreshold && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Low Stock Alert</span>
                  <span className="text-sm">{product.lowStockThreshold} units</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category & Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Category</span>
                <Badge variant="outline">{product.category}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Created</span>
                <span className="text-sm flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(product.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Updated</span>
                <span className="text-sm flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(product.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}