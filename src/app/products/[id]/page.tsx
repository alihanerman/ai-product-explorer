"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  Star,
  Cpu,
  HardDrive,
  Monitor,
  Battery,
  Weight,
  ArrowLeftRight,
} from "lucide-react";
import { Product } from "@prisma/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ComparisonTray } from "@/components/ComparisonTray";
import { useAuthStore } from "@/lib/stores/authStore";
import { useProductStore } from "@/lib/stores/productStore";

export default function ProductDetailPage() {
  const params = useParams();
  const { user } = useAuthStore();
  const {
    favoriteProductIds,
    toggleFavorite,
    addToComparison,
    comparisonList,
  } = useProductStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  const productId = params.id as string;
  const isFavorited = favoriteProductIds.includes(productId);
  const isInComparison = comparisonList.some((p) => p.id === productId);
  const canAddToComparison = comparisonList.length < 4 && !isInComparison;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/products/${productId}`);

        if (!response.ok) {
          throw new Error("Product not found");
        }

        const data = await response.json();
        setProduct(data.product);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load product");
      } finally {
        setIsLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const handleToggleFavorite = async () => {
    if (!user || !product) return;

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

  const handleAddToComparison = () => {
    if (product && canAddToComparison) {
      addToComparison(product);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-32 mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-muted rounded-lg" />
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded w-3/4" />
                <div className="h-6 bg-muted rounded w-1/2" />
                <div className="h-12 bg-muted rounded w-1/3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Link href="/">
              <Button>Back to Products</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Breadcrumb */}
        <Link
          href="/"
          className="inline-flex items-center text-sm sm:text-base text-muted-foreground hover:text-foreground mb-4 sm:mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Link>

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-6 sm:mb-8">
          {/* Product Image */}
          <div className="aspect-square relative overflow-hidden rounded-lg border">
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Product Info */}
          <div className="space-y-4 sm:space-y-6">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <span className="text-xs sm:text-sm text-muted-foreground capitalize bg-muted px-2 py-1 rounded w-fit">
                  {product.category}
                </span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{product.rating}</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
                {product.name}
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-4">
                {product.brand}
              </p>

              <div className="text-3xl sm:text-4xl font-bold text-primary mb-4 sm:mb-6">
                ${product.price.toLocaleString("en-US")}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {user && (
                <Button
                  variant={isFavorited ? "destructive" : "outline"}
                  onClick={handleToggleFavorite}
                  isLoading={isTogglingFavorite}
                  className="w-full sm:w-auto text-sm"
                >
                  <Heart
                    className={`h-4 w-4 mr-2 ${
                      isFavorited ? "fill-current" : ""
                    }`}
                  />
                  <span className="hidden sm:inline">
                    {isFavorited ? "Remove from Favorites" : "Add to Favorites"}
                  </span>
                  <span className="sm:hidden">
                    {isFavorited ? "Remove" : "Favorite"}
                  </span>
                </Button>
              )}

              {canAddToComparison && (
                <Button
                  variant="outline"
                  onClick={handleAddToComparison}
                  className="w-full sm:w-auto text-sm"
                >
                  <ArrowLeftRight className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Add to Compare</span>
                  <span className="sm:hidden">Compare</span>
                </Button>
              )}
            </div>

            {/* Specifications */}
            <Card>
              <CardHeader>
                <CardTitle>Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Cpu className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-primary font-medium">
                        Processor
                      </p>
                      <p className="font-medium">{product.cpu}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <HardDrive className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-primary font-medium">
                        Memory & Storage
                      </p>
                      <p className="font-medium">
                        {product.ram_gb}GB RAM, {product.storage_gb}GB
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Monitor className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-primary font-medium">
                        Display
                      </p>
                      <p className="font-medium">
                        {product.screen_inch}&quot; Screen
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Weight className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-primary font-medium">Weight</p>
                      <p className="font-medium">{product.weight_kg}kg</p>
                    </div>
                  </div>

                  {product.battery_wh > 0 && (
                    <div className="flex items-center gap-3 col-span-2">
                      <Battery className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-primary font-medium">
                          Battery
                        </p>
                        <p className="font-medium">{product.battery_wh}Wh</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ComparisonTray />
    </div>
  );
}
