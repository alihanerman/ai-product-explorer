// src/app/api/ai/compare/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CompareProductsSchema } from "@/lib/validations";
import { getAuthUser } from "@/lib/auth";
import { Product } from "@prisma/client";

// --- Helper Function to Group Products ---
const groupProductsForComparison = (products: Product[]) => {
  const categories: Record<string, Product[]> = {};
  products.forEach((p) => {
    if (!categories[p.category]) {
      categories[p.category] = [];
    }
    categories[p.category].push(p);
  });

  // Define which categories can be compared together
  const comparableGroups = [
    ["laptop", "desktop"],
    ["phone", "tablet"],
  ];

  let bestGroup: Product[] = [];
  const allGroups: Product[][] = [];

  // Find the largest group of comparable items
  for (const group of comparableGroups) {
    const currentGroup = products.filter((p) => group.includes(p.category));
    if (currentGroup.length > bestGroup.length) {
      bestGroup = currentGroup;
    }
    allGroups.push(currentGroup);
  }

  // If no comparable group is found, find the single largest category
  if (bestGroup.length < 2) {
    const largestCategoryGroup =
      Object.values(categories).sort((a, b) => b.length - a.length)[0] || [];
    if (largestCategoryGroup.length >= 2) {
      bestGroup = largestCategoryGroup;
    }
  }

  const productsToCompare = bestGroup;
  const excludedProducts = products.filter(
    (p) => !productsToCompare.some((pc) => pc.id === p.id)
  );

  return { productsToCompare, excludedProducts };
};

// --- Helper to format product details for the prompt ---
const formatProductDetails = (products: Product[]): string => {
  if (products.length === 0) return "None.";
  return products
    .map(
      (p) => `
- Product Name: ${p.name}
  - Category: ${p.category}
  - Brand: ${p.brand}
  - Price: $${p.price.toLocaleString("en-US")}
  - Rating: ${p.rating}/5
  - CPU: ${p.cpu}
  - RAM: ${p.ram_gb}GB
  - Storage: ${p.storage_gb}GB
  - Screen: ${p.screen_inch}"
  - Weight: ${p.weight_kg}kg
  - Battery: ${p.battery_wh}Wh`
    )
    .join("\n");
};

// --- Manual fallback comparison when AI services fail ---
// const generateManualComparison = (
//   productsToCompare: Product[]
// ): string => {
//   if (productsToCompare.length < 2) {
//     return "Unable to generate comparison - insufficient products in the same category.";
//   }
//   // This function remains as a fallback, no changes needed to its internal logic.
//   const comparison =
//     "A basic comparison is provided as AI services are unavailable.\n\n";
//   // ... (rest of your existing manual comparison logic)
//   return comparison;
// };

export async function POST(request: NextRequest) {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    // Eğer API anahtarı yoksa, sunucuda bir hata logla ve istemciye hata dön.
    console.error("GEMINI_API_KEY is not set in environment variables.");
    return NextResponse.json(
      { error: "Server configuration error: API key is missing." },
      { status: 500 }
    );
  }

  let prompt = "";
  // Try different models if the first one is rate limited
  const modelUsed = "gemini-2.0-flash";

  try {
    await getAuthUser(); // Verify authentication
    const body = await request.json();
    const validatedData = CompareProductsSchema.parse(body);

    const products = await prisma.product.findMany({
      where: {
        id: { in: validatedData.productIds },
      },
    });

    if (products.length < 2) {
      return NextResponse.json(
        { error: "At least two products are required for comparison." },
        { status: 400 }
      );
    }

    const { productsToCompare, excludedProducts } =
      groupProductsForComparison(products);

    if (productsToCompare.length < 2) {
      const fallbackComparison = `An AI comparison could not be generated because there are no two or more products from similar categories selected. Please select at least two phones/tablets or two laptops/desktops to compare.`;
      return NextResponse.json({ products, comparison: fallbackComparison });
    }

    // --- GET USER PREFERENCES ---
    const userPrefs = validatedData.userPreferences;
    const prefContext = userPrefs
      ? `
# USER PREFERENCES
The user has indicated the following preferences:
${userPrefs.budget ? `- Budget: ${userPrefs.budget} range` : ""}
${
  userPrefs.screenSize
    ? `- Screen Size: Prefers ${userPrefs.screenSize} screens`
    : ""
}
${userPrefs.usage ? `- Primary Usage: ${userPrefs.usage}` : ""}
${userPrefs.mobility ? `- Mobility Needs: ${userPrefs.mobility}` : ""}

IMPORTANT: Tailor your recommendations and analysis to these specific preferences!`
      : "";

    // --- BUILD THE ADVANCED PROMPT ---
    prompt = `
# ROLE
You are a friendly and knowledgeable personal shopping assistant. Your goal is to help the user make a confident decision by comparing the products they've selected. Use clear, simple language.

# TASK
Provide a detailed comparison of the products in '[PRODUCTS_TO_COMPARE]'. Acknowledge any '[EXCLUDED_PRODUCTS]' and briefly explain why they aren't in the main comparison. Tailor your final recommendation to the '[USER_PREFERENCES]'.

# CONTEXT
[PRODUCTS_TO_COMPARE]
${formatProductDetails(productsToCompare)}

[EXCLUDED_PRODUCTS]
${formatProductDetails(excludedProducts)}
${prefContext}

# OUTPUT STRUCTURE & RULES
1.  **Exclusion Notice (If necessary):** If '[EXCLUDED_PRODUCTS]' is not empty, start with a brief, friendly note. Example: "Just a heads-up, I'm focusing the main comparison on the laptops. The iPad is in a different category, but I can compare it separately if you like!"
2.  **Quick Glance Table:** Create a simple markdown table comparing the key specs (Price, Rating, RAM, Storage, Screen) for easy side-by-side viewing.
3.  **### Who Wins for You?**
    - Based on the user's preferences, create a bulleted list declaring a "winner" for each preference.
    - Example:
        - **For Budget (${
          userPrefs?.budget || "N/A"
        }):** The **[Product Name]** is the clear winner.
        - **For Gaming (${
          userPrefs?.usage || "N/A"
        }):** The **[Product Name]** with its superior RAM is your best bet.
4.  **### Strengths & Weaknesses**
    - For each product, provide 2-3 bullet points on its main pros and cons, keeping the user's needs in mind.
5.  **### The Final Verdict**
    - Conclude with a clear, concise summary table to help the user decide.

| If you value...          | Then choose...     | Because...                               |
| ----------------------- | ------------------ | ---------------------------------------- |
| **Overall Value**       | [Product Name]     | It offers the best balance of price and performance. |
| **Maximum Performance** | [Product Name]     | It has the most RAM and the fastest CPU. |
| **Portability**         | [Product Name]     | It's the lightest and has the best battery life. |

6.  **Tone:** Be encouraging and helpful, like a real person guiding a friend. Keep the total response under 500 words.
`;

    // --- AI SERVICE CALL ---
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiApiKey, // Artık geminiApiKey'in bir string olduğu kesin
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      // Fallback logic remains, no change needed here
      throw new Error("AI service request failed");
    }

    const geminiResponse = await response.json();
    const comparison =
      geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!comparison) {
      throw new Error("No response from AI service");
    }

    // --- LOGGING ---
    await prisma.aiLog.create({
      data: {
        prompt,
        response: comparison,
        modelUsed,
      },
    });

    return NextResponse.json({
      products,
      comparison,
    });
  } catch (error) {
    console.error("Compare products error:", error);

    return NextResponse.json(
      {
        products: [],
        comparison:
          "An error occurred while generating the AI comparison. Please try again later.",
      },
      { status: 500 }
    );
  }
}
