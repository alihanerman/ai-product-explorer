import { NextRequest, NextResponse } from "next/server";
import { ParseQuerySchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = ParseQuerySchema.parse(body);

    // Create a prompt for the AI to parse natural language into structured filters
    const prompt = `
You are a product search assistant. Parse the following natural language query into a structured JSON object for filtering electronic products.

Query: "${validatedData.query}"

Return ONLY a valid JSON object with these possible fields:
- category: one of "phone", "tablet", "laptop", "desktop" (if mentioned)
- brands: array of brand names (if mentioned) like ["Apple", "Samsung", "Google", "Dell", "HP", "Lenovo", "Microsoft", "Asus", "Acer", "OnePlus", "Xiaomi", "Razer"]
- minPrice: minimum price as number (if mentioned)
- maxPrice: maximum price as number (if mentioned)
- minRam: minimum RAM in GB (if mentioned)
- minStorage: minimum storage in GB (if mentioned)

Examples:
"apple laptops under $1500" -> {"category": "laptop", "brands": ["Apple"], "maxPrice": 1500}
"phones with 16gb ram" -> {"category": "phone", "minRam": 16}
"samsung tablets between $500 and $1000" -> {"category": "tablet", "brands": ["Samsung"], "minPrice": 500, "maxPrice": 1000}

Parse this query and return only the JSON:
`;

    // For demo purposes, we'll use a simple OpenRouter API call
    // In production, you'd want to use your preferred AI service
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
          model: "microsoft/phi-3-mini-128k-instruct:free", // Use alternative model as default
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
      throw new Error("AI service request failed");
    }

    const aiResponse = await response.json();
    const aiContent = aiResponse.choices?.[0]?.message?.content?.trim();

    if (!aiContent) {
      throw new Error("No response from AI service");
    }

    // Try to parse the AI response as JSON
    let parsedFilters;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : aiContent;
      parsedFilters = JSON.parse(jsonString);
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
            aiContent
          }),
          modelUsed: "microsoft/phi-3-mini-128k-instruct:free",
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
