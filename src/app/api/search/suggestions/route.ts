import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const SuggestionsQuerySchema = z.object({
  q: z.string().min(1, "Query is required"),
  limit: z.coerce.number().int().min(1).max(10).default(5),
});

// Predefined popular search suggestions
const POPULAR_SUGGESTIONS = [
  "Apple iPhone 15 Pro",
  "Samsung Galaxy S24",
  "MacBook Pro M3",
  "iPad Air",
  "Google Pixel 8",
  "Dell XPS 13",
  "iPhone under $800",
  "laptops with 16GB RAM",
  "gaming laptops",
  "tablets for drawing",
  "phones with best camera",
  "ultrabook under $1000",
  "Apple vs Samsung phones",
  "budget Android phones",
  "laptops for programming",
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limit = searchParams.get("limit");

    // If no query provided, return popular suggestions
    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        suggestions: POPULAR_SUGGESTIONS.slice(0, 5),
        type: "popular",
      });
    }

    const validatedParams = SuggestionsQuerySchema.parse({
      q: query,
      limit: limit || 5,
    });

    const searchQuery = validatedParams.q.toLowerCase().trim();

    // 1. Product name matches
    const productSuggestions = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: searchQuery, mode: "insensitive" } },
          { brand: { contains: searchQuery, mode: "insensitive" } },
          { category: { contains: searchQuery, mode: "insensitive" } },
        ],
      },
      select: {
        name: true,
        brand: true,
        category: true,
      },
      take: validatedParams.limit,
      orderBy: {
        name: "asc",
      },
    });

    // 2. Brand suggestions
    const brandSuggestions = await prisma.product.groupBy({
      by: ["brand"],
      where: {
        brand: { contains: searchQuery, mode: "insensitive" },
      },
      orderBy: {
        brand: "asc",
      },
      take: 3,
    });

    // 3. Category suggestions
    const categorySuggestions = await prisma.product.groupBy({
      by: ["category"],
      where: {
        category: { contains: searchQuery, mode: "insensitive" },
      },
      orderBy: {
        category: "asc",
      },
      take: 3,
    });

    // 4. Popular search patterns that match
    const popularMatches = POPULAR_SUGGESTIONS.filter((suggestion) =>
      suggestion.toLowerCase().includes(searchQuery)
    ).slice(0, 3);

    // Combine and format suggestions
    const suggestions: Array<{
      text: string;
      type: "product" | "brand" | "category" | "popular" | "query";
      data?: {
        brand?: string;
        category?: string;
      };
    }> = [];

    // Add product suggestions
    productSuggestions.forEach((product) => {
      suggestions.push({
        text: product.name,
        type: "product",
        data: { brand: product.brand, category: product.category },
      });
    });

    // Add brand suggestions
    brandSuggestions.forEach((brand) => {
      if (suggestions.length < validatedParams.limit) {
        suggestions.push({
          text: `${brand.brand} products`,
          type: "brand",
          data: { brand: brand.brand },
        });
      }
    });

    // Add category suggestions
    categorySuggestions.forEach((category) => {
      if (suggestions.length < validatedParams.limit) {
        suggestions.push({
          text: `${category.category}s`,
          type: "category",
          data: { category: category.category },
        });
      }
    });

    // Add popular suggestions
    popularMatches.forEach((suggestion) => {
      if (suggestions.length < validatedParams.limit) {
        suggestions.push({
          text: suggestion,
          type: "popular",
        });
      }
    });

    // Generate smart query suggestions
    const smartSuggestions = generateSmartSuggestions(searchQuery);
    smartSuggestions.forEach((suggestion) => {
      if (suggestions.length < validatedParams.limit) {
        suggestions.push({
          text: suggestion,
          type: "query",
        });
      }
    });

    return NextResponse.json({
      suggestions: suggestions.slice(0, validatedParams.limit),
      query: searchQuery,
    });
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}

function generateSmartSuggestions(query: string): string[] {
  const suggestions: string[] = [];
  const lowerQuery = query.toLowerCase();

  // Price-based suggestions
  if (lowerQuery.includes("cheap") || lowerQuery.includes("budget")) {
    suggestions.push(`${query} under $500`);
    suggestions.push(`${query} under $800`);
  }

  if (lowerQuery.includes("expensive") || lowerQuery.includes("premium")) {
    suggestions.push(`${query} over $1000`);
    suggestions.push(`${query} over $1500`);
  }

  // Feature-based suggestions
  if (lowerQuery.includes("laptop")) {
    suggestions.push(`${query} with 16GB RAM`);
    suggestions.push(`${query} for gaming`);
    suggestions.push(`${query} for work`);
  }

  if (lowerQuery.includes("phone")) {
    suggestions.push(`${query} with best camera`);
    suggestions.push(`${query} with long battery`);
    suggestions.push(`${query} with 5G`);
  }

  if (lowerQuery.includes("tablet")) {
    suggestions.push(`${query} for drawing`);
    suggestions.push(`${query} with keyboard`);
    suggestions.push(`${query} for students`);
  }

  // Brand comparisons
  const brands = ["apple", "samsung", "google", "dell", "hp", "lenovo"];
  const mentionedBrand = brands.find((brand) => lowerQuery.includes(brand));
  if (mentionedBrand) {
    const otherBrands = brands.filter((b) => b !== mentionedBrand);
    suggestions.push(`${mentionedBrand} vs ${otherBrands[0]}`);
  }

  return suggestions.slice(0, 3);
}
