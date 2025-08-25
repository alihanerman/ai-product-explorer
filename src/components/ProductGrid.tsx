"use client";

import React, { useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Search, Filter } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/Button";
import { useProductStore } from "@/lib/stores/productStore";
import { Product } from "@prisma/client";

interface HighlightedProduct extends Product {
  relevanceScore?: number;
  matchedFields?: string[];
  highlightedName?: string;
}

export function ProductGrid() {
  const {
    products,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalCount,
    setCurrentPage,
    fetchProducts,
    searchQuery,
    filters,
  } = useProductStore();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, currentPage]);

  // Enhance products with search relevance and highlighting
  const enhancedProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return products;
    }

    const query = searchQuery.toLowerCase();
    const queryWords = query.split(" ").filter((word) => word.length > 2);

    return products
      .map((product): HighlightedProduct => {
        let relevanceScore = 0;
        const matchedFields: string[] = [];

        // Calculate relevance score
        const name = product.name.toLowerCase();
        const brand = product.brand.toLowerCase();
        const category = product.category.toLowerCase();

        // Exact matches get highest score
        if (name.includes(query)) {
          relevanceScore += 100;
          matchedFields.push("name");
        }
        if (brand.includes(query)) {
          relevanceScore += 80;
          matchedFields.push("brand");
        }

        if (category.includes(query)) {
          relevanceScore += 60;
          matchedFields.push("category");
        }

        // Partial word matches
        queryWords.forEach((word) => {
          if (name.includes(word)) {
            relevanceScore += 30;
            if (!matchedFields.includes("name")) matchedFields.push("name");
          }
          if (brand.includes(word)) {
            relevanceScore += 25;
            if (!matchedFields.includes("brand")) matchedFields.push("brand");
          }

          if (category.includes(word)) {
            relevanceScore += 20;
            if (!matchedFields.includes("category"))
              matchedFields.push("category");
          }
        });

        // Create highlighted text
        const highlightText = (text: string, searchTerms: string[]) => {
          let highlighted = text;
          searchTerms.forEach((term) => {
            const regex = new RegExp(`(${term})`, "gi");
            highlighted = highlighted.replace(
              regex,
              '<mark class="bg-yellow-200 dark:bg-yellow-900 px-1 rounded">$1</mark>'
            );
          });
          return highlighted;
        };

        const highlightedName = highlightText(product.name, [
          query,
          ...queryWords,
        ]);

        return {
          ...product,
          relevanceScore,
          matchedFields,
          highlightedName,
        };
      })
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  }, [products, searchQuery]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Get active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.category) count++;
    if (filters.brands && filters.brands.length > 0) count++;
    if (filters.minPrice !== undefined) count++;
    if (filters.maxPrice !== undefined) count++;
    return count;
  }, [filters]);

  if (isLoading) {
    return (
      <div className="flex-1 p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="bg-card rounded-lg border p-4 animate-pulse"
            >
              <div className="aspect-square bg-muted rounded mb-4" />
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-6 bg-muted rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-4 sm:p-6">
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">Error loading products</div>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => fetchProducts()}>Try again</Button>
        </div>
      </div>
    );
  }

  if (enhancedProducts.length === 0) {
    return (
      <div className="flex-1 p-4 sm:p-6">
        <div className="text-center py-12">
          <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No products found</h3>
          <div className="space-y-2 text-muted-foreground">
            {searchQuery && <p>No results for "{searchQuery}"</p>}
            {activeFiltersCount > 0 && (
              <p>Try adjusting your filters ({activeFiltersCount} active)</p>
            )}
            <p>Try searching for different terms or browse all products</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6">
      {/* Results Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">
              {searchQuery ? "Search Results" : "Products"}
            </h2>
            {searchQuery && (
              <div className="text-sm text-muted-foreground">
                for "{searchQuery}"
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{totalCount} products</span>
            {activeFiltersCount > 0 && (
              <div className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                <span>{activeFiltersCount} filters</span>
              </div>
            )}
          </div>
        </div>

        {searchQuery && enhancedProducts.length > 0 && (
          <div className="text-sm text-muted-foreground">
            Showing {enhancedProducts.length} result
            {enhancedProducts.length !== 1 ? "s" : ""}
            {totalPages > 1 && ` (page ${currentPage} of ${totalPages})`}
            {searchQuery && (
              <span className="ml-2">• Results ranked by relevance</span>
            )}
          </div>
        )}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {enhancedProducts.map((product) => {
          const highlightedProduct = product as HighlightedProduct;
          return (
            <div
              key={product.id}
              className={`relative ${
                searchQuery &&
                highlightedProduct.relevanceScore &&
                highlightedProduct.relevanceScore > 50
                  ? "ring-2 ring-primary/20"
                  : ""
              }`}
            >
              <ProductCard product={product} />

              {/* Relevance indicators */}
              {searchQuery &&
                highlightedProduct.matchedFields &&
                highlightedProduct.matchedFields.length > 0 && (
                  <div className="absolute top-2 right-2 z-10">
                    <div className="bg-primary/10 backdrop-blur-sm rounded-full px-2 py-1 text-xs">
                      <div className="flex items-center gap-1">
                        {highlightedProduct.relevanceScore &&
                          highlightedProduct.relevanceScore > 80 && (
                            <div
                              className="w-2 h-2 bg-green-500 rounded-full"
                              title="High relevance"
                            />
                          )}
                        {highlightedProduct.relevanceScore &&
                          highlightedProduct.relevanceScore > 40 &&
                          highlightedProduct.relevanceScore <= 80 && (
                            <div
                              className="w-2 h-2 bg-yellow-500 rounded-full"
                              title="Medium relevance"
                            />
                          )}
                        {highlightedProduct.relevanceScore &&
                          highlightedProduct.relevanceScore <= 40 && (
                            <div
                              className="w-2 h-2 bg-blue-500 rounded-full"
                              title="Low relevance"
                            />
                          )}
                        <span className="text-xs font-medium">
                          {highlightedProduct.matchedFields.join(", ")}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center gap-1">
            {/* Show first page */}
            {currentPage > 3 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  className="w-10"
                >
                  1
                </Button>
                {currentPage > 4 && (
                  <span className="px-2 text-muted-foreground">...</span>
                )}
              </>
            )}

            {/* Show current page and neighbors */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = Math.max(1, currentPage - 2) + i;
              if (page > totalPages) return null;

              return (
                <Button
                  key={page}
                  variant={page === currentPage ? "primary" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className="w-10"
                >
                  {page}
                </Button>
              );
            })}

            {/* Show last page */}
            {currentPage < totalPages - 2 && (
              <>
                {currentPage < totalPages - 3 && (
                  <span className="px-2 text-muted-foreground">...</span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(totalPages)}
                  className="w-10"
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
