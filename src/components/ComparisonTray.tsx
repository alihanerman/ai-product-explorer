'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, ChevronUp, ChevronDown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useProductStore } from '@/lib/stores/productStore';

export function ComparisonTray() {
  const {
    comparisonList,
    removeFromComparison,
    clearComparison,
    fetchComparisonSummary,
    comparisonSummary,
    isComparingLoading,
  } = useProductStore();
  
  const [isExpanded, setIsExpanded] = useState(false);

  if (comparisonList.length === 0) return null;

  const handleGenerateComparison = async () => {
    if (comparisonList.length >= 2) {
      await fetchComparisonSummary();
      setIsExpanded(true);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50">
      {/* Tray Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold">
            Compare Products ({comparisonList.length}/4)
          </h3>
          
          {comparisonList.length >= 2 && (
            <Button
              size="sm"
              onClick={handleGenerateComparison}
              isLoading={isComparingLoading}
            >
              <Zap className="h-4 w-4 mr-1" />
              AI Compare
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
          
          <Button variant="ghost" size="sm" onClick={clearComparison}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Product List */}
      <div className="p-4">
        <div className="flex gap-4 overflow-x-auto">
          {comparisonList.map((product) => (
            <div
              key={product.id}
              className="flex-shrink-0 w-48 bg-card rounded-lg border p-3"
            >
              <div className="relative">
                <Image
                  src={product.image_url}
                  alt={product.name}
                  width={160}
                  height={120}
                  className="w-full h-24 object-cover rounded"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeFromComparison(product.id)}
                  className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="mt-2">
                <h4 className="font-medium text-sm line-clamp-2">
                  {product.name}
                </h4>
                <p className="text-xs text-muted-foreground">{product.brand}</p>
                <p className="text-sm font-semibold text-primary">
                  ${product.price.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Comparison Results */}
      {isExpanded && comparisonSummary && (
        <div className="border-t p-4 max-h-96 overflow-y-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Comparison Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                {comparisonSummary.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-2">
                    {paragraph}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}