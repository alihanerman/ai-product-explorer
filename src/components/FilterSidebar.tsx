"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Slider } from "@/components/ui/slider";
import { useProductStore, ProductFilters } from "@/lib/stores/productStore";
import { useDebounceCallback } from "@/lib/hooks/useDebounce";
import { useState, useEffect } from "react";

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

// sortBy değerlerinin bir listesini oluşturarak tip kontrolü sağlıyoruz.
const SORT_BY_VALUES = [
  "name-asc",
  "price-asc",
  "price-desc",
  "rating-desc",
] as const;

const SORT_OPTIONS: {
  value: (typeof SORT_BY_VALUES)[number];
  label: string;
}[] = [
  { value: "name-asc", label: "Name (A-Z)" },
  { value: "price-asc", label: "Price (Low to High)" },
  { value: "price-desc", label: "Price (High to Low)" },
  { value: "rating-desc", label: "Rating (High to Low)" },
];

export function FilterSidebar() {
  const { filters, setFilters, fetchProducts } = useProductStore();
  const debouncedFetch = useDebounceCallback(fetchProducts, 500);

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
    setFilters({});
    setPriceRange([MIN_PRICE, MAX_PRICE]);
    fetchProducts();
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <aside className="w-full lg:w-80 lg:flex-shrink-0 bg-card border-b lg:border-b-0 lg:border-r p-4 lg:p-6 space-y-4 lg:space-y-6 max-h-screen lg:overflow-y-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filters</h2>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Category Filter */}
      <div className="space-y-3">
        <h3 className="font-medium">Category</h3>
        <div className="space-y-2">
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
              <span className="text-primary">${priceRange[0].toLocaleString('en-US')}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Max:</span>
              <span className="text-primary">${priceRange[1].toLocaleString('en-US')}</span>
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
            <span>${MAX_PRICE.toLocaleString('en-US')}</span>
          </div>


        </div>
      </div>

      {/* Sort By */}
      <div className="space-y-3">
        <h3 className="font-medium">Sort By</h3>
        <select
          value={filters.sortBy || ""}
          onChange={(e) => {
            const value = e.target.value;
            // Gelen değerin beklenen 'sortBy' değerlerinden biri olup olmadığını kontrol ediyoruz.
            // Bu, 'as any' kullanmaktan daha güvenli bir yöntemdir.
            const sortByValue = SORT_BY_VALUES.find((v) => v === value);
            handleFilterChange("sortBy", sortByValue);
          }}
          className="w-full p-2 border border-input rounded-md bg-background"
        >
          <option value="">Default</option>
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </aside>
  );
}
