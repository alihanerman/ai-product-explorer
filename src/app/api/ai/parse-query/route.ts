import { NextRequest, NextResponse } from "next/server";
import { ParseQuerySchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const RATE_LIMIT_MAX_REQUESTS = 40; // Conservative limit to stay under 50

// In-memory rate limiting (in production, use Redis or database)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or initialize rate limit
    rateLimitMap.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  userLimit.count++;
  return true;
}

// Using Google Gemini API directly
const GEMINI_MODEL = "gemini-2.0-flash";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = ParseQuerySchema.parse(body);

    // Create a prompt for the AI to parse natural language into structured filters
    const prompt = `
You are an AI that parses user queries into structured filters for database searches. Your primary goal is to generate a JSON object that accurately reflects user intent while avoiding overlapping constraints between structural filters and the original text query.

# Query
"${validatedData.query}"

# Core Rules
1. **Separate Structural from Text Search**: When identifying key attributes (sortBy, category, brands, etc.), do NOT include those terms in any text search filter.
2. **Clear Search Query**: If structural filters are identified, clear the searchQuery to avoid combining text search and structural filters.
3. **No Double Filtering**: When you convert a term to a structural filter (e.g., "cheapest" -> sortBy: "price"), do NOT include that term in searchQuery.
4. **Never Guess Values**: Do not invent numerical values for specs like RAM or storage. If the user doesn't specify a number, do not include the field.
5. **Only Include Actual Values**: Do not include fields with null, undefined, or empty values.
6. **Handle Typos**: Recognize common typos like "bugget" = "budget", "cheep" = "cheap", "fone" = "phone".
7. **Translate Relative Terms**: Convert terms like "best", "cheapest", "fastest", "most", "highest", "budget" into sorting instructions.
8. **Recognize Aliases**: Common aliases like "iphone", "macbook" -> brand: "Apple".

# JSON Output Structure
Return ONLY a valid JSON object with these optional fields:
- category: one of "phone", "tablet", "laptop", "desktop"
- brands: array of brand names (e.g., ["Apple", "Samsung", "Google", "Dell", "HP", "Lenovo", "Microsoft", "Asus", "Acer", "OnePlus", "Xiaomi", "Razer"])
- minPrice: number
- maxPrice: number
- minRam: number (in GB)
- minStorage: number (in GB)
- sortBy: one of "price", "rating", "ram_gb", "storage_gb", "name"
- sortDirection: one of "asc" (for cheapest/lowest) or "desc" (for best/highest)
- searchQuery: string (only for generic text that doesn't fit structural filters)

# Examples
- "cheapest dell laptop" -> {"category": "laptop", "brands": ["Dell"], "sortBy": "price", "sortDirection": "asc"}
- "apple phone with best ram" -> {"category": "phone", "brands": ["Apple"], "sortBy": "ram_gb", "sortDirection": "desc"}
- "samsung tablets under $500" -> {"category": "tablet", "brands": ["Samsung"], "maxPrice": 500}
- "gaming laptops with 16gb ram" -> {"category": "laptop", "minRam": 16, "searchQuery": "gaming"}
- "budget laptop for students" -> {"category": "laptop", "sortBy": "price", "sortDirection": "asc", "searchQuery": "students"}
- "I want to bugget laptop" -> {"category": "laptop", "sortBy": "price", "sortDirection": "asc"}
- "show me all tablets" -> {"category": "tablet"}
- "macbook pro" -> {"category": "laptop", "brands": ["Apple"], "searchQuery": "pro"}
- "what's the weather like?" -> {}

Parse the user's query according to these rules and return only the JSON object.
`;

    // Check if we have API key
    if (!process.env.GEMINI_API_KEY) {
      console.warn("Gemini API key not configured, using fallback parsing");
      return NextResponse.json({
        originalQuery: validatedData.query,
        parsedFilters: {},
      });
    }

    // Check rate limit
    const userId = "default"; // In production, get from auth
    if (!checkRateLimit(userId)) {
      console.warn("Rate limit exceeded, using fallback parsing");
      return NextResponse.json({
        originalQuery: validatedData.query,
        parsedFilters: {},
      });
    }

    // Try different models until one works
    let aiResponse: {
      choices?: Array<{ message?: { content?: string } }>;
    } | null = null;
    let modelUsed = "";
    let lastError = "";

    // Use Google Gemini API instead of OpenRouter
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-goog-api-key": process.env.GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 200,
            }
          }),
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        lastError = `Google Gemini API Error: ${response.status} ${response.statusText} - ${errorBody}`;
        throw new Error(lastError);
      }

      const geminiResponse = await response.json();
      modelUsed = "gemini-2.0-flash";
      
      // Extract text from Gemini response format
      const generatedText = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!generatedText) {
        throw new Error("No content generated by Gemini");
      }
      
      // Convert to OpenRouter-like format for compatibility with existing code
      aiResponse = {
        choices: [{
          message: {
            content: generatedText
          }
        }]
      };
      
    } catch (error) {
      console.error("Error with Gemini API:", error);
      lastError = error instanceof Error ? error.message : String(error);
      
      // Log the error for monitoring
      try {
        await prisma.aiLog.create({
          data: {
            prompt,
            response: JSON.stringify({
              error: lastError,
              originalQuery: validatedData.query,
              parsedFilters: {},
            }),
            modelUsed: "gemini-error",
          },
        });
      } catch (logError) {
        console.error("Failed to log error:", logError);
      }
    }

    // If no model worked, use fallback
    if (!aiResponse) {
      console.warn("All AI models failed, using fallback parsing");
      try {
        await prisma.aiLog.create({
          data: {
            prompt,
            response: JSON.stringify({
              error: "All models failed",
              lastError,
              originalQuery: validatedData.query,
              parsedFilters: {},
            }),
            modelUsed: "fallback",
          },
        });
      } catch (logError) {
        console.error("Failed to log model failure:", logError);
      }

      return NextResponse.json({
        originalQuery: validatedData.query,
        parsedFilters: {},
      });
    }

    const aiContent = aiResponse.choices?.[0]?.message?.content?.trim();

    if (!aiContent) {
      throw new Error("No response from AI service");
    }

    // Try to parse the AI response as JSON
    let parsedFilters: Record<string, unknown> = {};
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : aiContent;
      const rawFilters = JSON.parse(jsonString) as Record<string, unknown>;

      // Clean up the parsed filters - remove null, undefined, and empty values
      Object.keys(rawFilters).forEach((key) => {
        const value = rawFilters[key];
        if (
          value !== null &&
          value !== undefined &&
          value !== "" &&
          !(Array.isArray(value) && value.length === 0)
        ) {
          parsedFilters[key] = value;
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
          modelUsed: modelUsed, // Log the model that actually worked
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
