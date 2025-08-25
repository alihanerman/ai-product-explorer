"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Plus, Star } from "lucide-react";
import { Product } from "@prisma/client";
import { Card, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useProductStore } from "@/lib/stores/productStore";
import { useAuthStore } from "@/lib/stores/authStore";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuthStore();
  const {
    favoriteProductIds,
    toggleFavorite,
    addToComparison,
    comparisonList,
  } = useProductStore();
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  const isFavorited = favoriteProductIds.includes(product.id);
  const isInComparison = comparisonList.some((p) => p.id === product.id);
  const canAddToComparison = comparisonList.length < 4 && !isInComparison;

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) return;

    setIsTogglingFavorite(true);
    try {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });

      if (response.ok) {
        toggleFavorite(product.id);
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
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
    <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <Link href={`/products/${product.id}`}>
        <div className="aspect-square relative overflow-hidden rounded-t-lg bg-muted">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-200"
          />

          {/* Action buttons overlay */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
            {user && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleToggleFavorite}
                isLoading={isTogglingFavorite}
                className={`h-9 w-9 p-0 rounded-full backdrop-blur-sm shadow-lg border transition-all duration-200 hover:scale-110 ${
                  isFavorited
                    ? "bg-red-500/90 border-red-400 text-white hover:bg-red-600/90"
                    : "bg-white/90 border-gray-200 text-gray-600 hover:bg-white hover:text-red-500"
                }`}
                title={
                  isFavorited ? "Remove from favorites" : "Add to favorites"
                }
              >
                <Heart
                  className={`h-4 w-4 transition-all duration-200 ${
                    isFavorited ? "fill-current scale-110" : ""
                  }`}
                />
              </Button>
            )}

            {canAddToComparison && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleAddToComparison}
                className="h-9 w-9 p-0 rounded-full backdrop-blur-sm bg-white/90 border border-gray-200 text-gray-600 shadow-lg hover:bg-blue-500 hover:text-white hover:border-blue-400 transition-all duration-200 hover:scale-110"
                title="Add to comparison"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm text-muted-foreground capitalize">
              {product.category}
            </span>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-xs sm:text-sm font-medium">
                {product.rating}
              </span>
            </div>
          </div>

          <h3 className="font-medium text-base sm:text-lg  line-clamp-1">
            {product.name}
          </h3>

          <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground mb-3">
            <p className="font-medium text-muted-foreground mb-1 line-clamp-1">
              {product.name}
            </p>
            <div>
              <span className="text-primary font-medium">RAM:</span>{" "}
              {product.ram_gb}GB
            </div>
            <div>
              <span className="text-primary font-medium">Storage:</span>{" "}
              {product.storage_gb}GB
            </div>
            <div className="truncate">
              <span className="text-primary font-medium">CPU:</span>{" "}
              {product.cpu}
            </div>
            <div>
              <span className="text-primary font-medium">Screen:</span>{" "}
              {product.screen_inch}&quot;
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex justify-between flex-col gap-2">
          <div className="flex items-center justify-center w-full">
            <span className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">
              ${product.price.toLocaleString()}
            </span>
          </div>
          <Button
            size="sm"
            className="text-xs sm:text-sm w-full group/btn relative overflow-hidden bg-secondary hover:bg-secondary/80 transition-all duration-300"
          >
            <span className="relative z-20 text-secondary-foreground group-hover/btn:text-white transition-colors duration-300">
              View Details
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 dark:from-emerald-400 dark:to-teal-400 transform -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-300 ease-out z-10"></div>
          </Button>
        </CardFooter>
      </Link>
    </Card>
  );
}
