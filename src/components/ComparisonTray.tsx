"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronUp, ChevronDown, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";

import { useProductStore } from "@/lib/stores/productStore";
import { EnhancedComparisonView } from "@/components/EnhancedComparisonView";

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

  const handleGenerateComparison = async (userPreferences?: {
    budget?: "low" | "medium" | "high";
    screenSize?: "compact" | "standard" | "large";
    usage?: "basic" | "work" | "gaming" | "creative";
    mobility?: "desktop" | "portable" | "ultraportable";
  }) => {
    if (comparisonList.length >= 2) {
      await fetchComparisonSummary(userPreferences);
      setIsExpanded(true);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50">
      {/* Tray Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b">
        <div className="flex items-center gap-2 sm:gap-4">
          <h3 className="font-semibold text-sm sm:text-base">
            Compare ({comparisonList.length}/4)
          </h3>

          {comparisonList.length >= 2 && (
            <Button
              size="sm"
              onClick={() => handleGenerateComparison()}
              isLoading={isComparingLoading}
              className="text-xs sm:text-sm"
            >
              <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">AI </span>Compare
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 sm:h-9 sm:w-9"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
            ) : (
              <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={clearComparison}
            className="h-8 w-8 sm:h-9 sm:w-9"
          >
            <X className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>

      {/* Product List */}
      <div className="p-3 sm:p-4">
        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2">
          {comparisonList.map((product) => (
            <div
              key={product.id}
              className="flex-shrink-0 w-40 sm:w-48 bg-card rounded-lg border p-2 sm:p-3"
            >
              <div className="relative">
                <Image
                  src={product.image_url}
                  alt={product.name}
                  width={160}
                  height={120}
                  className="w-full h-20 sm:h-24 object-cover rounded"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFromComparison(product.id)}
                  className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-black/20 backdrop-blur-sm border border-white/20 text-white hover:bg-red-500 hover:border-red-400 transition-all duration-200"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              <div className="mt-2">
                <h4 className="font-medium text-xs sm:text-sm line-clamp-2">
                  {product.name}
                </h4>
                <p className="text-xs text-muted-foreground">{product.brand}</p>
                <p className="text-xs sm:text-sm font-semibold text-primary">
                  ${product.price.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Comparison Results */}
      {isExpanded && comparisonList.length >= 2 && (
        <div className="border-t p-3 sm:p-4 max-h-[70vh] overflow-y-auto">
          <EnhancedComparisonView
            products={comparisonList}
            comparisonSummary={comparisonSummary}
            onRegenerateWithPreferences={handleGenerateComparison}
          />
        </div>
      )}
    </div>
  );
}
