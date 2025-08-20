'use client';

import { useEffect } from 'react';
import { Header } from '@/components/Header';
import { SearchBar } from '@/components/SearchBar';
import { FilterSidebar } from '@/components/FilterSidebar';
import { ProductGrid } from '@/components/ProductGrid';
import { ComparisonTray } from '@/components/ComparisonTray';
import { useAuthStore } from '@/lib/stores/authStore';
import { useProductStore } from '@/lib/stores/productStore';

export default function HomePage() {
  const { user, checkAuth } = useAuthStore();
  const { setFavoriteProductIds } = useProductStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    // Fetch user's favorites when logged in
    const fetchFavorites = async () => {
      if (user) {
        try {
          const response = await fetch('/api/favorites');
          if (response.ok) {
            const data = await response.json();
            setFavoriteProductIds(data.favoriteProductIds);
          }
        } catch (error) {
          console.error('Failed to fetch favorites:', error);
        }
      } else {
        setFavoriteProductIds([]);
      }
    };

    fetchFavorites();
  }, [user, setFavoriteProductIds]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Search Section */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold mb-2">AI-Powered Product Explorer</h1>
            <p className="text-lg text-muted-foreground">
              Discover, compare, and find the perfect electronic products with AI assistance
            </p>
          </div>
          
          <div className="flex justify-center">
            <SearchBar />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        <FilterSidebar />
        <ProductGrid />
      </div>

      <ComparisonTray />
    </div>
  );
}