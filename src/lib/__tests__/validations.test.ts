import {
  ProductFiltersSchema,
  ProductIdSchema,
  LoginSchema,
  ParseQuerySchema,
  SearchSuggestionsSchema,
  CompareProductsSchema,
} from "../validations";

describe("validation schemas", () => {
  describe("ProductFiltersSchema", () => {
    it("should validate valid product filters", () => {
      const validFilters = {
        category: "laptops",
        brands: ["Apple", "Dell"],
        minPrice: 500,
        maxPrice: 2000,
        sortBy: "price" as const,
        sortDirection: "asc" as const,
        page: 1,
        limit: 20,
        search: "gaming laptop",
      };

      const result = ProductFiltersSchema.safeParse(validFilters);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validFilters);
      }
    });

    it("should use default values for page and limit", () => {
      const result = ProductFiltersSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it("should reject invalid sortBy values", () => {
      const result = ProductFiltersSchema.safeParse({
        sortBy: "invalid",
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative prices", () => {
      const result = ProductFiltersSchema.safeParse({
        minPrice: -100,
      });
      expect(result.success).toBe(false);
    });

    it("should reject limit over 100", () => {
      const result = ProductFiltersSchema.safeParse({
        limit: 150,
      });
      expect(result.success).toBe(false);
    });

    it("should coerce string numbers to numbers", () => {
      const result = ProductFiltersSchema.safeParse({
        minPrice: "500",
        maxPrice: "1000",
        page: "2",
        limit: "10",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.minPrice).toBe(500);
        expect(result.data.maxPrice).toBe(1000);
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(10);
      }
    });
  });

  describe("ProductIdSchema", () => {
    it("should validate valid CUID", () => {
      const result = ProductIdSchema.safeParse({
        id: "clh7ckocj0000qh08w5h9w5h9",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid ID format", () => {
      const result = ProductIdSchema.safeParse({
        id: "invalid-id",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("LoginSchema", () => {
    it("should validate valid login data", () => {
      const validLogin = {
        email: "test@example.com",
        password: "password123",
      };

      const result = LoginSchema.safeParse(validLogin);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validLogin);
      }
    });

    it("should reject invalid email", () => {
      const result = LoginSchema.safeParse({
        email: "invalid-email",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty password", () => {
      const result = LoginSchema.safeParse({
        email: "test@example.com",
        password: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("ParseQuerySchema", () => {
    it("should validate non-empty query", () => {
      const result = ParseQuerySchema.safeParse({
        query: "gaming laptop under $1000",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty query", () => {
      const result = ParseQuerySchema.safeParse({
        query: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("SearchSuggestionsSchema", () => {
    it("should validate with default limit", () => {
      const result = SearchSuggestionsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(5);
      }
    });

    it("should validate with custom limit", () => {
      const result = SearchSuggestionsSchema.safeParse({
        q: "laptop",
        limit: 8,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.q).toBe("laptop");
        expect(result.data.limit).toBe(8);
      }
    });

    it("should reject limit over 10", () => {
      const result = SearchSuggestionsSchema.safeParse({
        limit: 15,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("CompareProductsSchema", () => {
    it("should validate valid comparison data", () => {
      const validData = {
        productIds: [
          "clh7ckocj0000qh08w5h9w5h9",
          "clh7ckocj0001qh08w5h9w5h8",
          "clh7ckocj0002qh08w5h9w5h7",
        ],
        userPreferences: {
          budget: "medium" as const,
          screenSize: "large" as const,
          usage: "gaming" as const,
          mobility: "portable" as const,
        },
      };

      const result = CompareProductsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject less than 2 products", () => {
      const result = CompareProductsSchema.safeParse({
        productIds: ["clh1"],
      });
      expect(result.success).toBe(false);
    });

    it("should reject more than 4 products", () => {
      const result = CompareProductsSchema.safeParse({
        productIds: ["clh1", "clh2", "clh3", "clh4", "clh5"],
      });
      expect(result.success).toBe(false);
    });

    it("should validate without user preferences", () => {
      const result = CompareProductsSchema.safeParse({
        productIds: ["clh7ckocj0000qh08w5h9w5h9", "clh7ckocj0001qh08w5h9w5h8"],
      });
      expect(result.success).toBe(true);
    });
  });
});
