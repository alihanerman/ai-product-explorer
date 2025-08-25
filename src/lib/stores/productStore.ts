import { create } from "zustand";
import { Product } from "@prisma/client";

export interface ProductFilters {
  category?: string;
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "price" | "rating" | "ram_gb" | "storage_gb" | "name";
  sortDirection?: "asc" | "desc";
}

export interface ProductState {
  // Products data
  products: Product[];
  currentProduct: Product | null;

  // Filters and search
  filters: ProductFilters;
  searchQuery: string;

  // Pagination
  currentPage: number;
  totalPages: number;
  totalCount: number;

  // UI states
  isLoading: boolean;
  error: string | null;

  // Favorites
  favoriteProductIds: string[];

  // Comparison
  comparisonList: Product[];
  comparisonSummary: string | null;
  isComparingLoading: boolean;

  // Actions
  setProducts: (
    products: Product[],
    pagination?: { totalPages: number; totalCount: number; page: number }
  ) => void;
  setCurrentProduct: (product: Product | null) => void;
  setFilters: (filters: Partial<ProductFilters>) => void;
  setSearchQuery: (query: string) => void;
  setCurrentPage: (page: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFavoriteProductIds: (ids: string[]) => void;
  toggleFavorite: (productId: string) => void;
  addToComparison: (product: Product) => void;
  removeFromComparison: (productId: string) => void;
  clearComparison: () => void;
  setComparisonSummary: (summary: string | null) => void;
  setComparingLoading: (loading: boolean) => void;
  resetSearchAndFilters: () => void;

  // API actions
  fetchProducts: () => Promise<void>;
  fetchProduct: (id: string) => Promise<void>;
  parseSearchQuery: (query: string) => Promise<void>;
  fetchComparisonSummary: (userPreferences?: {
    budget?: "low" | "medium" | "high";
    screenSize?: "compact" | "standard" | "large";
    usage?: "basic" | "work" | "gaming" | "creative";
    mobility?: "desktop" | "portable" | "ultraportable";
  }) => Promise<void>;
  
  // Favorites API actions
  fetchFavorites: () => Promise<void>;
  toggleFavoriteAPI: (productId: string) => Promise<void>;
  fetchFavoriteProducts: () => Promise<Product[]>;
  
  // Search API actions
  fetchSearchSuggestions: () => Promise<unknown[]>;

  // URL actions
  initializeFromURL: (searchParams: URLSearchParams) => void;
  updateURL: () => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
  // Initial state
  products: [],
  currentProduct: null,
  filters: {},
  searchQuery: "",
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
  isLoading: false,
  error: null,
  favoriteProductIds: [],
  comparisonList: [],
  comparisonSummary: null,
  isComparingLoading: false,

  // Basic setters
  setProducts: (products, pagination) =>
    set((state) => ({
      products,
      totalPages: pagination?.totalPages || state.totalPages,
      totalCount: pagination?.totalCount || state.totalCount,
      currentPage: pagination?.page || state.currentPage,
    })),

  setCurrentProduct: (product) => set({ currentProduct: product }),

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      currentPage: 1, // Reset to first page when filters change
    }));
    setTimeout(() => get().updateURL(), 0);
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    setTimeout(() => get().updateURL(), 0);
  },
  setCurrentPage: (page) => set({ currentPage: page }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setFavoriteProductIds: (ids) => set({ favoriteProductIds: ids }),

  toggleFavorite: (productId) =>
    set((state) => ({
      favoriteProductIds: state.favoriteProductIds.includes(productId)
        ? state.favoriteProductIds.filter((id) => id !== productId)
        : [...state.favoriteProductIds, productId],
    })),

  addToComparison: (product) =>
    set((state) => {
      if (state.comparisonList.length >= 4) return state; // Max 4 products
      if (state.comparisonList.some((p) => p.id === product.id)) return state; // Already added
      return { comparisonList: [...state.comparisonList, product] };
    }),

  removeFromComparison: (productId) =>
    set((state) => ({
      comparisonList: state.comparisonList.filter((p) => p.id !== productId),
      comparisonSummary:
        state.comparisonList.length <= 2 ? null : state.comparisonSummary,
    })),

  clearComparison: () => set({ comparisonList: [], comparisonSummary: null }),
  setComparisonSummary: (summary) => set({ comparisonSummary: summary }),
  setComparingLoading: (loading) => set({ isComparingLoading: loading }),

  resetSearchAndFilters: () => {
    set({ 
      searchQuery: "", 
      filters: {}, 
      currentPage: 1,
      error: null 
    });
    // Update URL after state reset
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/');
      }
      get().fetchProducts();
    }, 0);
  },

  // API actions
  fetchProducts: async () => {
    const state = get();
    set({ isLoading: true, error: null });

    try {
      const params = new URLSearchParams();

      if (state.searchQuery) params.set("search", state.searchQuery);
      if (state.filters.category)
        params.set("category", state.filters.category);
      if (state.filters.brands?.length)
        params.set("brands", state.filters.brands.join(","));
      if (state.filters.minPrice !== undefined)
        params.set("minPrice", state.filters.minPrice.toString());
      if (state.filters.maxPrice !== undefined)
        params.set("maxPrice", state.filters.maxPrice.toString());
      if (state.filters.sortBy) params.set("sortBy", state.filters.sortBy);
      if (state.filters.sortDirection)
        params.set("sortDirection", state.filters.sortDirection);
      params.set("page", state.currentPage.toString());
      params.set("limit", "20");

      const response = await fetch(`/api/products?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      set({
        products: data.products,
        totalPages: data.pagination.totalPages,
        totalCount: data.pagination.totalCount,
        currentPage: data.pagination.page,
        isLoading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch products",
        isLoading: false,
      });
    }
  },

  fetchProduct: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/products/${id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch product");
      }

      const data = await response.json();
      set({
        currentProduct: data.product,
        isLoading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch product",
        isLoading: false,
      });
    }
  },

  parseSearchQuery: async (query: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch("/api/ai/parse-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error("Failed to parse search query");
      }

      const data = await response.json();
      const { parsedFilters } = data;

      // Check if AI found meaningful structural filters
      const hasStructuralFilters = !!(
        parsedFilters.category ||
        parsedFilters.brands?.length ||
        parsedFilters.minPrice ||
        parsedFilters.maxPrice ||
        parsedFilters.sortBy
      );

      // Apply the parsed filters
      const newFilters: ProductFilters = {};
      if (parsedFilters.category) newFilters.category = parsedFilters.category;
      if (parsedFilters.brands) newFilters.brands = parsedFilters.brands;
      if (parsedFilters.minPrice) newFilters.minPrice = parsedFilters.minPrice;
      if (parsedFilters.maxPrice) newFilters.maxPrice = parsedFilters.maxPrice;
      if (parsedFilters.sortBy) newFilters.sortBy = parsedFilters.sortBy;
      if (parsedFilters.sortDirection)
        newFilters.sortDirection = parsedFilters.sortDirection;

      // Determine the search query based on AI analysis
      let finalSearchQuery = "";
      if (hasStructuralFilters) {
        // If AI found structural filters, only use AI's searchQuery (if any)
        finalSearchQuery = parsedFilters.searchQuery || "";
      } else {
        // If no structural filters found, use original query for text search
        finalSearchQuery = query;
      }

      set(() => ({
        filters: newFilters,
        searchQuery: finalSearchQuery,
        currentPage: 1,
      }));

      await get().fetchProducts();
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to parse search query",
        isLoading: false,
        searchQuery: query, // Fallback to original query
      });
      // Fallback to simple text search if AI fails
      await get().fetchProducts();
    }
  },

  fetchComparisonSummary: async (userPreferences?: {
    budget?: "low" | "medium" | "high";
    screenSize?: "compact" | "standard" | "large";
    usage?: "basic" | "work" | "gaming" | "creative";
    mobility?: "desktop" | "portable" | "ultraportable";
  }) => {
    const state = get();
    if (state.comparisonList.length < 2) return;

    set({ isComparingLoading: true });

    try {
      const productIds = state.comparisonList.map((p) => p.id);
      const response = await fetch("/api/ai/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds,
          userPreferences,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate comparison");
      }

      const data = await response.json();
      set({
        comparisonSummary: data.comparison,
        isComparingLoading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate comparison",
        isComparingLoading: false,
      });
    }
  },

  // Favorites API actions
  fetchFavorites: async () => {
    try {
      const response = await fetch("/api/favorites");
      if (response.ok) {
        const data = await response.json();
        set({ favoriteProductIds: data.favoriteProductIds });
      }
    } catch (error) {
      console.error("Failed to fetch favorites:", error);
      set({ error: "Failed to fetch favorites" });
    }
  },

  toggleFavoriteAPI: async (productId: string) => {
    const state = get();
    const isFavorited = state.favoriteProductIds.includes(productId);
    
    try {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          action: isFavorited ? "remove" : "add",
        }),
      });

      if (response.ok) {
        // Update local state immediately for better UX
        get().toggleFavorite(productId);
      } else {
        throw new Error("Failed to update favorite");
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      set({ error: "Failed to update favorite" });
    }
  },

  fetchFavoriteProducts: async () => {
    const state = get();
    if (!state.favoriteProductIds.length) return [];

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: state.favoriteProductIds,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.products || [];
      } else {
        throw new Error("Failed to fetch favorite products");
      }
    } catch (error) {
      console.error("Failed to fetch favorite products:", error);
      set({ error: "Failed to fetch favorite products" });
      return [];
    }
  },

  // Search API actions
  fetchSearchSuggestions: async () => {
    try {
      const response = await fetch("/api/search/suggestions");
      if (response.ok) {
        const data = await response.json();
        return data.suggestions || [];
      } else {
        throw new Error("Failed to fetch suggestions");
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      return [];
    }
  },

  // URL actions
  initializeFromURL: (searchParams: URLSearchParams) => {
    const urlFilters: ProductFilters = {};
    const urlSearchQuery = searchParams.get("q") || "";

    if (searchParams.get("category")) {
      urlFilters.category = searchParams.get("category")!;
    }
    if (searchParams.get("brands")) {
      urlFilters.brands = searchParams.get("brands")!.split(",");
    }
    if (searchParams.get("minPrice")) {
      urlFilters.minPrice = parseInt(searchParams.get("minPrice")!);
    }
    if (searchParams.get("maxPrice")) {
      urlFilters.maxPrice = parseInt(searchParams.get("maxPrice")!);
    }
    if (searchParams.get("sortBy")) {
      urlFilters.sortBy = searchParams.get(
        "sortBy"
      )! as ProductFilters["sortBy"];
    }
    if (searchParams.get("sortDirection")) {
      urlFilters.sortDirection = searchParams.get(
        "sortDirection"
      )! as ProductFilters["sortDirection"];
    }

    set({
      filters: urlFilters,
      searchQuery: urlSearchQuery,
    });
  },

  updateURL: () => {
    if (typeof window === "undefined") return; // Server-side check

    const state = get();
    const params = new URLSearchParams();

    if (state.searchQuery) {
      params.set("q", state.searchQuery);
    }
    if (state.filters.category) {
      params.set("category", state.filters.category);
    }
    if (state.filters.brands && state.filters.brands.length > 0) {
      params.set("brands", state.filters.brands.join(","));
    }
    if (state.filters.minPrice !== undefined) {
      params.set("minPrice", state.filters.minPrice.toString());
    }
    if (state.filters.maxPrice !== undefined) {
      params.set("maxPrice", state.filters.maxPrice.toString());
    }
    if (state.filters.sortBy) {
      params.set("sortBy", state.filters.sortBy);
    }
    if (state.filters.sortDirection) {
      params.set("sortDirection", state.filters.sortDirection);
    }

    const newURL = params.toString() ? `/?${params.toString()}` : "/";
    window.history.replaceState({}, "", newURL);
  },
}));
