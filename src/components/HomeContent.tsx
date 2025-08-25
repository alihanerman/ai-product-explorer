"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SearchBar } from "@/components/SearchBar";
import { FilterSidebar } from "@/components/FilterSidebar";
import { ProductGrid } from "@/components/ProductGrid";
import { ComparisonTray } from "@/components/ComparisonTray";
import { useAuthStore } from "@/lib/stores/authStore";
import { useProductStore } from "@/lib/stores/productStore";

export function HomeContent() {
  const searchParams = useSearchParams();
  const { user, checkAuth } = useAuthStore();
  const { setFavoriteProductIds, initializeFromURL, fetchProducts } =
    useProductStore();

  // State for sidebar toggling (closed by default on mobile, open on desktop)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 1024px)").matches; // lg breakpoint
  });
  const [isComparisonTrayOpen, setIsComparisonTrayOpen] = useState(true);

  // Sadece ilk yükleme sırasında URL'den parametreleri oku
  useEffect(() => {
    initializeFromURL(searchParams);
  }, [initializeFromURL, searchParams]); // Initial load için gerekli dependency'ler

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    // Kullanıcı giriş yaptığında favorilerini çek
    const fetchFavorites = async () => {
      if (user) {
        try {
          const response = await fetch("/api/favorites");
          if (response.ok) {
            const data = await response.json();
            setFavoriteProductIds(data.favoriteProductIds);
          }
        } catch (error) {
          console.error("Failed to fetch favorites:", error);
        }
      } else {
        setFavoriteProductIds([]);
      }
    };

    fetchFavorites();
  }, [user, setFavoriteProductIds]);

  // İlk yükleme
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <>
      <main>
        {/* Search Section */}
        <section
          aria-labelledby="search-heading"
          className="border-b bg-muted/30"
        >
          <div className="container mx-auto px-4 py-6 sm:py-8">
            <div className="text-center mb-4 sm:mb-6">
              <h1
                id="search-heading"
                className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2"
              >
                AI-Powered Product Explorer
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
                Discover, compare, and find the perfect electronic products with
                AI assistance
              </p>
            </div>

            <div className="flex justify-center">
              <SearchBar />
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="container mx-auto flex flex-col lg:flex-row min-h-0 relative">
          <FilterSidebar 
            isOpen={isFilterSidebarOpen} 
            onToggle={() => setIsFilterSidebarOpen(!isFilterSidebarOpen)} 
          />
          <ProductGrid />
          <ComparisonTray 
            isOpen={isComparisonTrayOpen}
            onToggle={() => setIsComparisonTrayOpen(!isComparisonTrayOpen)}
          />
        </div>
      </main>
    </>
  );
}
