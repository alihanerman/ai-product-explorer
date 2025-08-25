import { NextRequest, NextResponse } from "next/server";
import {
  ParseQuerySchema,
  ProductFilters,
  ProductFiltersSchema,
} from "@/lib/validations";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = ParseQuerySchema.parse(body);

    // Create a prompt for the AI to parse natural language into structured filters
    const prompt = `
You are a sophisticated AI assistant for an e-commerce store. Your primary function is to parse a user's natural language query into a structured JSON object.

# Query
"${validatedData.query}"

# Guiding Principles
1.  **NEVER Guess Values:** Do not invent numerical values for specs like RAM or storage. If the user doesn't specify a number, do not include the field.
2.  **NEVER Include null/undefined:** Only include fields that have actual values. Do not include fields with null, undefined, or empty values.
3.  **Handle Typos:** Recognize common typos like "bugget" = "budget", "cheep" = "cheap", "fone" = "phone".
4.  **Translate Relative Terms to Sorting:** Convert ambiguous terms like "best", "cheapest", "fastest", "most", "highest", "budget" into sorting instructions.
5.  **Infer Brand and Category Aliases:** Recognize common aliases (e.g., "iphone", "macbook" -> brand: "Apple").
6.  **Be Strict:** If the query is nonsensical or doesn't relate to products, return an empty JSON object: {}.

# JSON Output Structure
Return ONLY a valid JSON object with the following optional fields:
- category: one of "phone", "tablet", "laptop", "desktop"
- brands: array of brand names (e.g., ["Apple", "Samsung"])
- minPrice: number
- maxPrice: number
- minRam: number (in GB)
- minStorage: number (in GB)
- sortBy: one of "price", "rating", "ram_gb", "storage_gb", "name"
- sortDirection: one of "asc" (for cheapest/lowest) or "desc" (for best/highest)

# Examples
- "laptops under $1000" -> {"category": "laptop", "maxPrice": 1000}
- "samsung phones with 12gb ram" -> {"category": "phone", "brands": ["Samsung"], "minRam": 12}
- "cheapest dell laptop" -> {"category": "laptop", "brands": ["Dell"], "sortBy": "price", "sortDirection": "asc"}
- "budget laptop" -> {"category": "laptop", "sortBy": "price", "sortDirection": "asc"}
- "I want to bugget laptop" -> {"category": "laptop", "sortBy": "price", "sortDirection": "asc"}
- "iphone with the most storage" -> {"category": "phone", "brands": ["Apple"], "sortBy": "storage_gb", "sortDirection": "desc"}
- "gaming laptops with best ram" -> {"category": "laptop", "sortBy": "ram_gb", "sortDirection": "desc"}
- "show me all tablets" -> {"category": "tablet"}
- "what's the weather like?" -> {}

Parse the user's query according to these rules and return only the JSON object.
`;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer":
            process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
          "X-Title": "AI Product Explorer",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.2-3b-instruct:free",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.1,
          max_tokens: 200,
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `OpenRouter API Error: ${response.status} ${response.statusText} - ${errorBody}`
      );
    }

    const aiResponse = await response.json();
    const aiContent = aiResponse.choices?.[0]?.message?.content?.trim();

    if (!aiContent) {
      throw new Error("No response from AI service");
    }

    // Try to parse the AI response as JSON
    let parsedFilters: Partial<ProductFilters> = {};
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : aiContent;
      const rawFilters = JSON.parse(jsonString);

      // Clean up the parsed filters - remove null, undefined, and empty values
      Object.keys(rawFilters).forEach((key) => {
        const value = rawFilters[key];
        if (
          value !== null &&
          value !== undefined &&
          value !== "" &&
          !(Array.isArray(value) && value.length === 0)
        ) {
          // Only assign valid keys that exist in ProductFilters
          if (key in ProductFiltersSchema.shape) {
            (parsedFilters as Record<string, unknown>)[key] = value;
          }
        }
      });
    } catch {
      console.error("Failed to parse AI response:", aiContent);
      // Fallback: return empty filters
      parsedFilters = {};
    }

    // Log the search query and AI response
    try {
      await prisma.aiLog.create({
        data: {
          prompt,
          response: JSON.stringify({
            originalQuery: validatedData.query,
            parsedFilters,
            aiContent,
          }),
          modelUsed: "meta-llama/llama-3.2-3b-instruct:free",
        },
      });
    } catch (logError) {
      console.error("Failed to log search query:", logError);
    }

    return NextResponse.json({
      originalQuery: validatedData.query,
      parsedFilters,
    });
  } catch (error) {
    console.error("Parse query error:", error);
    // Fallback: return empty filters if AI fails
    return NextResponse.json({
      originalQuery: "",
      parsedFilters: {},
    });
  }
}
