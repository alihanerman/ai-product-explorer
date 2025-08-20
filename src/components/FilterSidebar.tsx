"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useProductStore } from "@/lib/stores/productStore";

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

const SORT_OPTIONS = [
  { value: "name-asc", label: "Name (A-Z)" },
  { value: "price-asc", label: "Price (Low to High)" },
  { value: "price-desc", label: "Price (High to Low)" },
  { value: "rating-desc", label: "Rating (High to Low)" },
];

export function FilterSidebar() {
  const { filters, setFilters, fetchProducts } = useProductStore();
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleCategoryChange = (category: string) => {
    const newCategory =
      localFilters.category === category ? undefined : category;
    setLocalFilters((prev) => ({ ...prev, category: newCategory }));
  };

  const handleBrandToggle = (brand: string) => {
    const currentBrands = localFilters.brands || [];
    const newBrands = currentBrands.includes(brand)
      ? currentBrands.filter((b) => b !== brand)
      : [...currentBrands, brand];

    setLocalFilters((prev) => ({
      ...prev,
      brands: newBrands.length > 0 ? newBrands : undefined,
    }));
  };

  const handlePriceChange = (field: "minPrice" | "maxPrice", value: string) => {
    const numValue = value === "" ? undefined : parseFloat(value);
    setLocalFilters((prev) => ({ ...prev, [field]: numValue }));
  };

  const handleSortChange = (sortBy: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      sortBy: sortBy as "price-asc" | "price-desc" | "rating-desc" | "name-asc",
    }));
  };

  const applyFilters = () => {
    setFilters(localFilters);
    fetchProducts();
  };

  const clearFilters = () => {
    const clearedFilters = {};
    setLocalFilters(clearedFilters);
    setFilters(clearedFilters);
    fetchProducts();
  };

  const hasActiveFilters = Object.keys(localFilters).some(
    (key) => localFilters[key as keyof typeof localFilters] !== undefined
  );

  return (
    <div className="w-80 bg-card border-r p-6 space-y-6">
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
                checked={localFilters.category === category.value}
                onChange={() => handleCategoryChange(category.value)}
                className="rounded border-gray-300"
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
                checked={localFilters.brands?.includes(brand) || false}
                onChange={() => handleBrandToggle(brand)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{brand}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <h3 className="font-medium">Price Range</h3>
        <div className="space-y-2">
          <Input
            type="number"
            placeholder="Min price"
            value={localFilters.minPrice || ""}
            onChange={(e) => handlePriceChange("minPrice", e.target.value)}
          />
          <Input
            type="number"
            placeholder="Max price"
            value={localFilters.maxPrice || ""}
            onChange={(e) => handlePriceChange("maxPrice", e.target.value)}
          />
        </div>
      </div>

      {/* Sort By */}
      <div className="space-y-3">
        <h3 className="font-medium">Sort By</h3>
        <select
          value={localFilters.sortBy || ""}
          onChange={(e) => handleSortChange(e.target.value)}
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

      {/* Apply Filters Button */}
      <Button onClick={applyFilters} className="w-full">
        Apply Filters
      </Button>
    </div>
  );
}
