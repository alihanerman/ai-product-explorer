import { z } from "zod";

// Product filtering and sorting schemas
export const ProductFiltersSchema = z.object({
  category: z.string().optional(),
  brands: z.array(z.string()).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sortBy: z
    .enum(["price-asc", "price-desc", "rating-desc", "name-asc"])
    .optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const ProductIdSchema = z.object({
  id: z.string().cuid(),
});

// Auth schemas
export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Favorites schema
export const ToggleFavoriteSchema = z.object({
  productId: z.string().cuid(),
});

// AI schemas
export const ParseQuerySchema = z.object({
  query: z.string().min(1, "Query cannot be empty"),
});

export const CompareProductsSchema = z.object({
  productIds: z
    .array(z.string().cuid())
    .min(2, "At least 2 products required")
    .max(4, "Maximum 4 products allowed"),
  userPreferences: z
    .object({
      budget: z.enum(["low", "medium", "high"]).optional(),
      screenSize: z.enum(["compact", "standard", "large"]).optional(),
      usage: z.enum(["basic", "work", "gaming", "creative"]).optional(),
      mobility: z.enum(["desktop", "portable", "ultraportable"]).optional(),
    })
    .optional(),
});

export type ProductFilters = z.infer<typeof ProductFiltersSchema>;
export type LoginData = z.infer<typeof LoginSchema>;
export type ToggleFavoriteData = z.infer<typeof ToggleFavoriteSchema>;
export type ParseQueryData = z.infer<typeof ParseQuerySchema>;
export type CompareProductsData = z.infer<typeof CompareProductsSchema>;
