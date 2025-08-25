import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProductFiltersSchema } from "@/lib/validations";
import { Prisma } from "@prisma/client";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const rawParams = {
      category: searchParams.get("category") || undefined,
      brands:
        searchParams.get("brands")?.split(",").filter(Boolean) || undefined,
      minPrice: searchParams.get("minPrice") || undefined,
      maxPrice: searchParams.get("maxPrice") || undefined,
      sortBy: searchParams.get("sortBy") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      search: searchParams.get("search") || undefined,
    };

    const validatedParams = ProductFiltersSchema.parse(rawParams);

    // Build where clause
    const where: Prisma.ProductWhereInput = {};

    if (validatedParams.category) {
      where.category = validatedParams.category;
    }

    if (validatedParams.brands && validatedParams.brands.length > 0) {
      where.brand = { in: validatedParams.brands };
    }

    if (
      validatedParams.minPrice !== undefined ||
      validatedParams.maxPrice !== undefined
    ) {
      where.price = {};
      if (validatedParams.minPrice !== undefined) {
        where.price.gte = validatedParams.minPrice;
      }
      if (validatedParams.maxPrice !== undefined) {
        where.price.lte = validatedParams.maxPrice;
      }
    }

    // Add text search functionality
    if (validatedParams.search) {
      where.OR = [
        { name: { contains: validatedParams.search, mode: "insensitive" } },
        { brand: { contains: validatedParams.search, mode: "insensitive" } },
        { category: { contains: validatedParams.search, mode: "insensitive" } },
        { cpu: { contains: validatedParams.search, mode: "insensitive" } },
      ];
    }

    // Build orderBy clause
    let orderBy: Prisma.ProductOrderByWithRelationInput = { name: "asc" }; // default

    if (validatedParams.sortBy) {
      switch (validatedParams.sortBy) {
        case "price-asc":
          orderBy = { price: "asc" };
          break;
        case "price-desc":
          orderBy = { price: "desc" };
          break;
        case "rating-desc":
          orderBy = { rating: "desc" };
          break;
        case "name-asc":
          orderBy = { name: "asc" };
          break;
      }
    }

    // Calculate pagination
    const skip = (validatedParams.page - 1) * validatedParams.limit;

    // Fetch products and total count
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: validatedParams.limit,
      }),
      prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / validatedParams.limit);

    return NextResponse.json({
      products,
      pagination: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        totalCount,
        totalPages,
        hasNext: validatedParams.page < totalPages,
        hasPrev: validatedParams.page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

const ProductIdsSchema = z.object({
  productIds: z.array(z.string()),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productIds } = ProductIdsSchema.parse(body);

    // Fetch products by IDs
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      products,
    });
  } catch (error) {
    console.error("Error fetching products by IDs:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
