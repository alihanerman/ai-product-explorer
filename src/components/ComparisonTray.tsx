"use client";

import { useState } from "react";
import Image from "next/image";
import {
  X,
  GitCompare,
  Sparkles,
  PanelRightOpen,
  PanelRightClose,
  Scale,
  ArrowLeftRight,
  
} from "lucide-react";
import { Button } from "@/components/ui/Button";

import { useProductStore } from "@/lib/stores/productStore";
import { EnhancedComparisonView } from "@/components/EnhancedComparisonView";

interface ComparisonTrayProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export function ComparisonTray({
  isOpen = true,
  onToggle,
}: ComparisonTrayProps) {
  const {
    comparisonList,
    removeFromComparison,
    clearComparison,
    fetchComparisonSummary,
    comparisonSummary,
    isComparingLoading,
  } = useProductStore();

  const [showComparisonModal, setShowComparisonModal] = useState(false);

  if (comparisonList.length === 0) return null;

  const handleGenerateComparison = async (userPreferences?: {
    budget?: "low" | "medium" | "high";
    screenSize?: "compact" | "standard" | "large";
    usage?: "basic" | "work" | "gaming" | "creative";
    mobility?: "desktop" | "portable" | "ultraportable";
  }) => {
    if (comparisonList.length >= 2) {
      await fetchComparisonSummary(userPreferences);
      setShowComparisonModal(true);
    }
  };

  return (
    <>
      {/* Mobile Toggle Button - only shown on small screens */}
      <div className="lg:hidden fixed bottom-4 right-4 z-20">
        <Button
          onClick={onToggle}
          className="rounded-full h-12 w-12 shadow-lg"
          size="sm"
        >
          <Scale className="h-5 w-5" />
          {comparisonList.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
              {comparisonList.length}
            </span>
          )}
        </Button>
      </div>

      {/* Desktop Closed State Toggle Button */}
      {!isOpen && (
        <div className="hidden lg:block fixed right-0 top-1/2 transform -translate-y-1/2 z-20">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggle}
            className="h-16 w-12 rounded-l-lg rounded-r-none border-r-0 bg-background/95 backdrop-blur-sm shadow-lg hover:w-14 transition-all duration-200 relative"
          >
            <ArrowLeftRight className="h-6 w-6" />
            {comparisonList.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center text-[11px]">
                {comparisonList.length}
              </span>
            )}
          </Button>
        </div>
      )}

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-20"
          onClick={onToggle}
        />
      )}

      {/* Comparison Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 right-0 z-30 lg:z-auto
          ${isOpen ? "w-80 lg:w-80 lg:flex-shrink-0" : "w-0 lg:w-0"} 
          bg-card ${isOpen ? "border-l" : "border-l-0"}
          transform transition-all duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
          ${!isOpen ? "overflow-hidden" : ""}
          flex flex-col max-h-screen
        `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            <h3 className="font-semibold">
              Compare ({comparisonList.length}/4)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {/* Clear all comparison button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearComparison}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
              title="Clear all comparisons"
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Desktop toggle button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="hidden lg:flex h-8 w-8 p-0"
            >
              {isOpen ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRightOpen className="h-4 w-4" />
              )}
            </Button>

            {/* Mobile close panel button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="lg:hidden h-8 w-8 p-0"
              title="Close comparison panel"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Comparison Action */}
        {comparisonList.length >= 2 && (
          <div className="p-4 border-b">
            <Button
              onClick={() => handleGenerateComparison()}
              isLoading={isComparingLoading}
              className="w-full bg-gradient-to-r from-yellow-400 via-orange-400 to-amber-500 dark:from-yellow-500 dark:via-orange-500 dark:to-amber-600 hover:from-yellow-500 hover:via-orange-500 hover:to-amber-600 dark:hover:from-yellow-400 dark:hover:via-orange-400 dark:hover:to-amber-500 text-white dark:text-gray-900 border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              size="sm"
            >
              <div className="flex items-center gap-2">
                <GitCompare className="h-4 w-4" />
                <Sparkles className="h-3 w-3 opacity-80" />
              </div>
              AI Compare
            </Button>
          </div>
        )}

        {/* Product List - Vertical Layout */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {comparisonList.map((product) => (
            <div
              key={product.id}
              className="relative bg-muted/30 rounded-lg border p-3 group hover:bg-muted/50 transition-colors"
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    width={80}
                    height={80}
                    className="w-20 h-20 object-cover rounded"
                  />
                </div>

                <div className="flex-1 min-w-0 pr-8">
                  <h4 className="font-medium text-sm line-clamp-2 mb-1">
                    {product.name}
                  </h4>
                  <p className="text-xs text-muted-foreground mb-1">
                    {product.brand}
                  </p>
                  <p className="text-sm font-semibold text-primary">
                    ${product.price.toLocaleString("en-US")}
                  </p>
                  {product.rating && (
                    <p className="text-xs text-muted-foreground">
                      ⭐ {product.rating}/5
                    </p>
                  )}
                </div>
              </div>

              {/* Close Button - Always visible on mobile, hover on desktop */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeFromComparison(product.id)}
                className="absolute top-2 right-2 h-6 w-6 rounded-md opacity-100 lg:opacity-0 lg:group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground transition-all duration-200"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remove from comparison</span>
              </Button>
            </div>
          ))}
        </div>
      </aside>

      {/* Comparison Modal */}
      {showComparisonModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg max-w-6xl max-h-[90vh] w-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">Product Comparison</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComparisonModal(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <EnhancedComparisonView
                products={comparisonList}
                comparisonSummary={comparisonSummary}
                onRegenerateWithPreferences={handleGenerateComparison}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
