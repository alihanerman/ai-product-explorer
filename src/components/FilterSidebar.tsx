"use client";

import {
  X,
  Filter,
  SlidersHorizontal,
  PanelLeftOpen,
  PanelLeftClose,
  Heart,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/slider";
import { useProductStore, ProductFilters } from "@/lib/stores/productStore";
import { useDebounceCallback } from "@/lib/hooks/useDebounce";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/stores/authStore";
import { LogsModal } from "@/components/LogsModal";

const CATEGORIES = [
  { value: "phone", label: "Phones" },
  { value: "tablet", label: "Tablets" },
  { value: "laptop", label: "Laptops" },
  { value: "desktop", label: "Desktops" },
];

const BRANDS = [
  "Apple",
  "Samsung",
  "Google",
  "Dell",
  "HP",
  "Lenovo",
  "Microsoft",
  "Asus",
  "Acer",
  "OnePlus",
  "Xiaomi",
  "Razer",
];

// Yeni ayrık sortBy ve sortDirection formatı
const SORT_OPTIONS = [
  { sortBy: undefined, sortDirection: undefined, label: "Default" },
  { sortBy: "name", sortDirection: "asc", label: "Name (A-Z)" },
  { sortBy: "price", sortDirection: "asc", label: "Price (Low to High)" },
  { sortBy: "price", sortDirection: "desc", label: "Price (High to Low)" },
  { sortBy: "rating", sortDirection: "desc", label: "Rating (High to Low)" },
  { sortBy: "ram_gb", sortDirection: "desc", label: "RAM (High to Low)" },
  {
    sortBy: "storage_gb",
    sortDirection: "desc",
    label: "Storage (High to Low)",
  },
] as const;

interface FilterSidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export function FilterSidebar({ isOpen = true, onToggle }: FilterSidebarProps) {
  const { filters, setFilters, fetchProducts, resetSearchAndFilters } =
    useProductStore();
  const { user } = useAuthStore();
  const debouncedFetch = useDebounceCallback(fetchProducts, 500);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);

  // Price range state for slider
  const [priceRange, setPriceRange] = useState<[number, number]>([350, 2890]);
  const [isSliderActive, setIsSliderActive] = useState(false);

  // Constants for price range (based on actual product data)
  const MIN_PRICE = 350;
  const MAX_PRICE = 2890;

  // Update slider when filters change
  useEffect(() => {
    if (!isSliderActive) {
      setPriceRange([
        filters.minPrice ?? MIN_PRICE,
        filters.maxPrice ?? MAX_PRICE,
      ]);
    }
  }, [filters.minPrice, filters.maxPrice, isSliderActive]);

  const handleFilterChange = <K extends keyof ProductFilters>(
    key: K,
    value: ProductFilters[K]
  ) => {
    const newFilters = { ...filters };

    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }

    setFilters(newFilters);

    if (key !== "minPrice" && key !== "maxPrice") {
      fetchProducts();
    } else {
      debouncedFetch();
    }
  };

  const handleBrandToggle = (brand: string) => {
    const currentBrands = filters.brands || [];
    const newBrands = currentBrands.includes(brand)
      ? currentBrands.filter((b) => b !== brand)
      : [...currentBrands, brand];
    handleFilterChange("brands", newBrands.length > 0 ? newBrands : undefined);
  };

  const handlePriceRangeChange = (newRange: [number, number]) => {
    setPriceRange(newRange);
    setIsSliderActive(true);

    // Apply filters
    handleFilterChange(
      "minPrice",
      newRange[0] === MIN_PRICE ? undefined : newRange[0]
    );
    handleFilterChange(
      "maxPrice",
      newRange[1] === MAX_PRICE ? undefined : newRange[1]
    );

    // Reset slider active state after a delay
    setTimeout(() => setIsSliderActive(false), 100);
  };

  const clearFilters = () => {
   
    // Use the store's resetSearchAndFilters method to properly clear everything
    resetSearchAndFilters();
    // Reset price range slider
    setPriceRange([MIN_PRICE, MAX_PRICE]);
   
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <>
      {/* Mobile Navigation Bar */}
      <div className="lg:hidden sticky top-0 z-10 bg-background border-b p-4">
        <div className="flex items-center gap-3">
          {/* Filters Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onToggle}
            className="flex items-center gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                {Object.keys(filters).length}
              </span>
            )}
          </Button>

          {/* Favorites Button */}
          {user && (
            <Link href="/favorites">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Favorites</span>
              </Button>
            </Link>
          )}

          {/* Logs Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLogsModalOpen(true)}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Logs</span>
          </Button>
        </div>
      </div>

      {/* Desktop Closed State Toggle Button */}
      {!isOpen && (
        <div className="hidden lg:block fixed left-0 top-1/2 transform -translate-y-1/2 z-20">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggle}
            className="h-16 w-12 rounded-r-lg rounded-l-none border-l-0 bg-background/95 backdrop-blur-sm shadow-lg hover:w-14 transition-all duration-200"
          >
            <Filter className="h-6 w-6" />
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

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30 lg:z-auto
          ${isOpen ? "w-80 lg:w-80 lg:flex-shrink-0" : "w-0 lg:w-0"} 
          bg-card ${isOpen ? "border-r" : "border-r-0"}
          transform transition-all duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${!isOpen ? "overflow-hidden" : ""}
          flex flex-col max-h-screen
        `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 lg:p-6 border-b">
          <h2 className="text-lg font-semibold">Filters</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                
                clearFilters();
              }}
              className="!bg-transparent !border-0 !text-red-500 hover:!text-red-600 hover:!bg-red-50 dark:!text-red-400 dark:hover:!text-red-300 dark:hover:!bg-red-950/20"
              title="Clear all filters"
            >
              <X className="h-5 w-5" />
            </Button>
            {/* Desktop toggle button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="hidden lg:flex"
            >
              {isOpen ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelLeftOpen className="h-5 w-5" />
              )}
            </Button>
            {/* Mobile close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="lg:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-6">
          {/* Category Filter */}
          <div className="space-y-3">
            <h3 className="font-medium">Category</h3>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  checked={!filters.category}
                  onChange={() => handleFilterChange("category", undefined)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm">All Categories</span>
              </label>
              {CATEGORIES.map((category) => (
                <label
                  key={category.value}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="category"
                    checked={filters.category === category.value}
                    onChange={() =>
                      handleFilterChange(
                        "category",
                        filters.category === category.value
                          ? undefined
                          : category.value
                      )
                    }
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm">{category.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Brand Filter */}
          <div className="space-y-3">
            <h3 className="font-medium">Brands</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {BRANDS.map((brand) => (
                <label
                  key={brand}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filters.brands?.includes(brand) || false}
                    onChange={() => handleBrandToggle(brand)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm">{brand}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-3">
            <h3 className="font-medium">Price Range</h3>
            <div className="space-y-4">
              {/* Price Display */}
              <div className="flex items-center justify-between text-sm font-medium mb-2">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Min:</span>
                  <span className="text-primary">
                    ${priceRange[0].toLocaleString("en-US")}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Max:</span>
                  <span className="text-primary">
                    ${priceRange[1].toLocaleString("en-US")}
                  </span>
                </div>
              </div>

              {/* Dual Range Slider */}
              <div className="px-1 py-2">
                <Slider
                  value={priceRange}
                  onValueChange={(value) => {
                    if (value.length === 2) {
                      handlePriceRangeChange([value[0], value[1]]);
                    }
                  }}
                  min={MIN_PRICE}
                  max={MAX_PRICE}
                  step={25}
                  className="w-full"
                />
              </div>

              {/* Price range hints */}
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                <span>${MIN_PRICE}</span>
                <span>${MAX_PRICE.toLocaleString("en-US")}</span>
              </div>
            </div>
          </div>

          {/* Sort By */}
          <div className="space-y-3">
            <h3 className="font-medium">Sort By</h3>
            <select
              value={
                filters.sortBy && filters.sortDirection
                  ? `${filters.sortBy}-${filters.sortDirection}`
                  : ""
              }
              onChange={(e) => {
                const value = e.target.value;
                const selectedOption = SORT_OPTIONS.find(
                  (option) =>
                    value === "" ||
                    (option.sortBy &&
                      option.sortDirection &&
                      `${option.sortBy}-${option.sortDirection}` === value)
                );

                if (selectedOption) {
                  // Her iki değeri aynı anda güncelle
                  const newFilters = { ...filters };
                  if (selectedOption.sortBy && selectedOption.sortDirection) {
                    newFilters.sortBy = selectedOption.sortBy;
                    newFilters.sortDirection = selectedOption.sortDirection;
                  } else {
                    // Default seçildiğinde her ikisini de temizle
                    delete newFilters.sortBy;
                    delete newFilters.sortDirection;
                  }
                  setFilters(newFilters);
                  fetchProducts();
                }
              }}
              className="w-full p-2 border border-input rounded-md bg-background"
            >
              {SORT_OPTIONS.map((option, index) => (
                <option
                  key={index}
                  value={
                    option.sortBy && option.sortDirection
                      ? `${option.sortBy}-${option.sortDirection}`
                      : ""
                  }
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </aside>

      {/* Logs Modal */}
      <LogsModal
        isOpen={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
      />
    </>
  );
}
