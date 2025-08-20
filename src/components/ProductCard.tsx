'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Plus, Star } from 'lucide-react';
import { Product } from '@prisma/client';
import { Card, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useProductStore } from '@/lib/stores/productStore';
import { useAuthStore } from '@/lib/stores/authStore';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuthStore();
  const { favoriteProductIds, toggleFavorite, addToComparison, comparisonList } = useProductStore();
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  
  const isFavorited = favoriteProductIds.includes(product.id);
  const isInComparison = comparisonList.some(p => p.id === product.id);
  const canAddToComparison = comparisonList.length < 4 && !isInComparison;

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) return;
    
    setIsTogglingFavorite(true);
    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      });
      
      if (response.ok) {
        toggleFavorite(product.id);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const handleAddToComparison = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToComparison(product);
  };

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200">
      <Link href={`/products/${product.id}`}>
        <div className="aspect-square relative overflow-hidden rounded-t-lg">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
          />
          
          {/* Action buttons overlay */}
          <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {user && (
              <Button
                size="sm"
                variant={isFavorited ? 'destructive' : 'secondary'}
                onClick={handleToggleFavorite}
                isLoading={isTogglingFavorite}
                className="h-8 w-8 p-0"
              >
                <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
              </Button>
            )}
            
            {canAddToComparison && (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleAddToComparison}
                className="h-8 w-8 p-0"
                title="Add to comparison"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground capitalize">
              {product.category}
            </span>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{product.rating}</span>
            </div>
          </div>
          
          <h3 className="font-semibold text-lg mb-1 line-clamp-2">
            {product.name}
          </h3>
          
          <p className="text-sm text-muted-foreground mb-2">
            {product.brand}
          </p>
          
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
            <div>RAM: {product.ram_gb}GB</div>
            <div>Storage: {product.storage_gb}GB</div>
            <div>CPU: {product.cpu}</div>
            <div>Screen: {product.screen_inch}"</div>
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0">
          <div className="flex items-center justify-between w-full">
            <span className="text-2xl font-bold text-primary">
              ${product.price.toLocaleString()}
            </span>
            <Button size="sm">
              View Details
            </Button>
          </div>
        </CardFooter>
      </Link>
    </Card>
  );
}