"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Product } from "@prisma/client";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { useAuthStore } from "@/lib/stores/authStore";
import { useProductStore } from "@/lib/stores/productStore";

export default function FavoritesPage() {
  const { user, checkAuth } = useAuthStore();
  const { favoriteProductIds } = useProductStore();
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("name-asc");

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Sort products
  const sortProducts = useCallback(
    (products: Product[], sortType: string): Product[] => {
      const sorted = [...products];
      switch (sortType) {
        case "price-asc":
          return sorted.sort((a, b) => a.price - b.price);
        case "price-desc":
          return sorted.sort((a, b) => b.price - a.price);
        case "rating-desc":
          return sorted.sort((a, b) => b.rating - a.rating);
        case "name-asc":
        default:
          return sorted.sort((a, b) => a.name.localeCompare(b.name));
      }
    },
    []
  );

  useEffect(() => {
    const fetchFavoriteProducts = async () => {
      if (!user || favoriteProductIds.length === 0) {
        setFavoriteProducts([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch favorite product details
        const response = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productIds: favoriteProductIds }),
        });

        if (response.ok) {
          const data = await response.json();
          const sortedProducts = sortProducts(data.products || [], sortBy);
          setFavoriteProducts(sortedProducts);
        } else {
          setError("An error occurred while loading favorite products");
        }
      } catch (error) {
        console.error("Failed to fetch favorite products:", error);
        setError("An error occurred while loading favorite products");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavoriteProducts();
  }, [user, favoriteProductIds, sortBy, sortProducts]);

  // Re-sort existing products when sortBy changes
  useEffect(() => {
    if (favoriteProducts.length > 0) {
      const sortedProducts = sortProducts(favoriteProducts, sortBy);
      setFavoriteProducts(sortedProducts);
    }
  }, [sortBy, favoriteProducts, sortProducts]);

  // Redirect to login page if user is not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Favorites</h1>
            <p className="text-muted-foreground mb-6">
              You need to log in to view your favorite products.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Log In
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 sm:py-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-foreground">Favorites</span>
        </nav>
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Your Favorite Products
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Find the products you liked here
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Try Again
            </button>
          </div>
        ) : favoriteProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 mb-4 rounded-full bg-muted flex items-center justify-center">
              <svg
                className="w-12 h-12 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">
              You don&apos;t have any favorite products yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Click the heart icon to like products
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Explore Products
            </Link>
          </div>
        ) : (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
              <p className="text-sm text-muted-foreground">
                {favoriteProducts.length} favorite products found
              </p>

              <div className="flex items-center gap-2">
                <label htmlFor="sort-select" className="text-sm font-medium">
                  Sort:
                </label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm border border-border rounded-md px-3 py-1 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="price-asc">Price (Low-High)</option>
                  <option value="price-desc">Price (High-Low)</option>
                  <option value="rating-desc">Rating (High-Low)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {favoriteProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
