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
  - Price: $${p.price.toLocaleString()}
  - Rating: ${p.rating}/5
  - CPU: ${p.cpu}
  - RAM: ${p.ram_gb}GB
  - Storage: ${p.storage_gb}GB
  - Screen: ${p.screen_inch}
  - Weight: ${p.weight_kg}kg
  - Battery: ${p.battery_wh}Wh`
    )
    .join("\n");
};

// --- Manual fallback comparison when AI services fail ---
const generateManualComparison = (
  productsToCompare: Product[],
  excludedProducts: Product[],
  userPreferences?: {
    budget?: "low" | "medium" | "high";
    screenSize?: "compact" | "standard" | "large";
    usage?: "basic" | "work" | "gaming" | "creative";
    mobility?: "desktop" | "portable" | "ultraportable";
  }
): string => {
  if (productsToCompare.length < 2) {
    return "Unable to generate comparison - insufficient products in the same category.";
  }

  let comparison = "";

  // Exclusion notice
  if (excludedProducts.length > 0) {
    const excludedNames = excludedProducts.map((p) => p.name).join(", ");
    comparison += `**Note:** ${excludedNames} ${
      excludedProducts.length === 1 ? "is" : "are"
    } not included in this comparison as ${
      excludedProducts.length === 1 ? "it belongs" : "they belong"
    } to different product categories.\n\n`;
  }

  // Basic comparison
  comparison += "### Product Comparison Summary\n\n";

  const sortedByPrice = [...productsToCompare].sort(
    (a, b) => a.price - b.price
  );
  const sortedByRating = [...productsToCompare].sort(
    (a, b) => b.rating - a.rating
  );
  const sortedByRAM = [...productsToCompare].sort(
    (a, b) => b.ram_gb - a.ram_gb
  );

  comparison += `**Price Range:** $${sortedByPrice[0].price.toLocaleString()} to $${sortedByPrice[
    sortedByPrice.length - 1
  ].price.toLocaleString()}\n\n`;
  comparison += `**Most Affordable:** ${sortedByPrice[0].brand} ${
    sortedByPrice[0].name
  } at $${sortedByPrice[0].price.toLocaleString()}\n\n`;
  comparison += `**Highest Rated:** ${sortedByRating[0].brand} ${sortedByRating[0].name} (${sortedByRating[0].rating}/5 stars)\n\n`;
  comparison += `**Most RAM:** ${sortedByRAM[0].brand} ${sortedByRAM[0].name} with ${sortedByRAM[0].ram_gb}GB\n\n`;

  comparison += "### Quick Specs Overview\n\n";
  productsToCompare.forEach((product) => {
    comparison += `**${product.brand} ${product.name}**\n`;
    comparison += `- Price: $${product.price.toLocaleString()}\n`;
    comparison += `- Rating: ${product.rating}/5\n`;
    comparison += `- RAM: ${product.ram_gb}GB | Storage: ${product.storage_gb}GB\n`;
    comparison += `- CPU: ${product.cpu}\n\n`;
  });

  comparison += "### Recommendation\n\n";

  // Tailor recommendations based on user preferences
  if (userPreferences?.budget === "low") {
    comparison += `**Budget-Focused Choice:** The **${sortedByPrice[0].brand} ${
      sortedByPrice[0].name
    }** at $${sortedByPrice[0].price.toLocaleString()} offers the best value for money.\n\n`;
  } else if (userPreferences?.budget === "high") {
    comparison += `**Premium Choice:** For the best specs regardless of price, consider the **${sortedByRAM[0].brand} ${sortedByRAM[0].name}** with top-tier performance.\n\n`;
  }

  if (userPreferences?.screenSize === "compact") {
    const compactOptions = productsToCompare.filter((p) => p.screen_inch <= 14);
    if (compactOptions.length > 0) {
      const smallestScreen = compactOptions.sort(
        (a, b) => a.screen_inch - b.screen_inch
      )[0];
      comparison += `**Compact Size:** The **${smallestScreen.brand} ${smallestScreen.name}** with its ${smallestScreen.screen_inch}" screen meets your compact preference.\n\n`;
    }
  } else if (userPreferences?.screenSize === "large") {
    const largeOptions = productsToCompare.filter((p) => p.screen_inch >= 15);
    if (largeOptions.length > 0) {
      const largestScreen = largeOptions.sort(
        (a, b) => b.screen_inch - a.screen_inch
      )[0];
      comparison += `**Large Screen:** The **${largestScreen.brand} ${largestScreen.name}** with its ${largestScreen.screen_inch}" display provides the large screen you prefer.\n\n`;
    }
  }

  if (userPreferences?.usage === "gaming") {
    const highRAM = sortedByRAM[0];
    comparison += `**Gaming Performance:** The **${highRAM.brand} ${highRAM.name}** with ${highRAM.ram_gb}GB RAM is best suited for gaming needs.\n\n`;
  } else if (userPreferences?.usage === "work") {
    comparison += `**Work Productivity:** For professional use, consider the **${sortedByRating[0].brand} ${sortedByRating[0].name}** with its ${sortedByRating[0].rating}/5 rating for reliability.\n\n`;
  }

  // Default recommendations
  comparison += `**Overall:** For the best value, consider the **${sortedByPrice[0].brand} ${sortedByPrice[0].name}**. `;
  comparison += `For top performance, the **${sortedByRAM[0].brand} ${sortedByRAM[0].name}** offers the most RAM. `;
  comparison += `For reliability, the **${sortedByRating[0].brand} ${sortedByRating[0].name}** has the highest user rating.\n\n`;
  comparison +=
    "*Note: This is a basic comparison generated when AI services are temporarily unavailable.*";

  return comparison;
};

export async function POST(request: NextRequest) {
  let prompt = "";
  // Try different models if the first one is rate limited
  const availableModels = [
    "meta-llama/llama-3.2-3b-instruct:free",
    "microsoft/phi-3-mini-128k-instruct:free",
    "google/gemma-2-9b-it:free",
    "mistralai/mistral-7b-instruct:free",
    "huggingface/starcoder2-15b:free",
    "openchat/openchat-7b:free",
    "gryphe/mythomist-7b:free",
  ];

  let modelUsed = availableModels[0]; // Default model

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
You are an expert tech reviewer writing a concise and helpful comparison for a customer on an e-commerce website. Be objective, clear, and focus on user needs.

# TASK
Your goal is to provide a detailed, objective comparison of the products listed under '[PRODUCTS_TO_COMPARE]'. You must also acknowledge the products under '[EXCLUDED_PRODUCTS]' and briefly explain why they are not part of the main comparison.

# CONTEXT
[PRODUCTS_TO_COMPARE]
${formatProductDetails(productsToCompare)}

[EXCLUDED_PRODUCTS]
${formatProductDetails(excludedProducts)}
${prefContext}

# RULES & OUTPUT_STRUCTURE
1.  **Start with the Exclusion:** Begin your response by listing the names of the products from '[EXCLUDED_PRODUCTS]' and state clearly that they are not being compared because they belong to different categories (e.g., "The iPad Pro and Dell XPS 15 are not included in this comparison as they are a tablet and a laptop, respectively.").
2.  **Main Comparison:** After the exclusion notice, proceed with comparing ONLY the products from '[PRODUCTS_TO_COMPARE]'.
3.  **Analysis Format:** Structure your main comparison analysis with the following sections using markdown headers:
    -   **### Overall Summary:** A brief, high-level overview of the products being compared.
    -   **### Key Differences & Performance:** Compare them on critical specs (CPU, RAM, Storage, Screen, Battery). For each spec, state which product is better and why. ${
      userPrefs?.screenSize
        ? `Pay special attention to screen size preferences (user wants ${userPrefs.screenSize}).`
        : ""
    }
    -   **### Strengths & Weaknesses:** Provide 2-3 bullet points for each product's main pros and cons. ${
      userPrefs?.usage
        ? `Focus on how well each product suits ${userPrefs.usage} usage.`
        : ""
    }
    -   **### Best Use Cases:** Describe the ideal user for each product. ${
      userPrefs?.mobility ? `Consider ${userPrefs.mobility} needs.` : ""
    }
    -   **### Final Recommendation:** Conclude with a clear recommendation based on user preferences and different profiles. ${
      userPrefs?.budget ? `Prioritize ${userPrefs.budget} budget options.` : ""
    } For example: "For the best overall performance and camera, choose the... However, if budget is your main concern, the... offers better value."
4.  **Special Rule for Laptops/Desktops:** If comparing laptops and desktops, specifically highlight the trade-offs between mobility, power, and upgradability.
5.  **Tone:** Be helpful and professional. Avoid overly technical jargon. Keep the total response under 600 words.
`;

    // --- AI SERVICE CALL ---
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
          model: modelUsed,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.4,
          max_tokens: 1024,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI service error:", errorText);

      // Check if it's a rate limit error - try a different model
      if (response.status === 429 || errorText.includes("rate-limited")) {
        console.log(
          `Model ${modelUsed} is rate-limited, trying alternative model...`
        );

        // Try with a different model
        const alternativeModel = availableModels.find(
          (model) => model !== modelUsed
        );
        if (alternativeModel) {
          try {
            const retryResponse = await fetch(
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
                  model: alternativeModel,
                  messages: [{ role: "user", content: prompt }],
                  temperature: 0.4,
                  max_tokens: 1024,
                }),
              }
            );

            if (retryResponse.ok) {
              modelUsed = alternativeModel;
              const retryAiResponse = await retryResponse.json();
              const retryComparison =
                retryAiResponse.choices?.[0]?.message?.content?.trim();

              if (retryComparison) {
                console.log(
                  `✅ Fallback successful with model: ${alternativeModel}`
                );

                // Log successful retry
                await prisma.aiLog.create({
                  data: {
                    prompt,
                    response: retryComparison,
                    modelUsed,
                  },
                });

                return NextResponse.json({
                  products,
                  comparison: retryComparison,
                });
              }
            } else {
              console.log(
                `❌ Alternative model ${alternativeModel} also failed`
              );
            }
          } catch (retryError) {
            console.log(`❌ Error trying alternative model: ${retryError}`);
          }
        }

        // If we reach here, all AI models failed - use manual fallback
        console.log(
          "🤖 All AI models failed, providing manual fallback response"
        );
        const manualComparison = generateManualComparison(
          productsToCompare,
          excludedProducts,
          userPrefs
        );

        // Log the fallback
        await prisma.aiLog.create({
          data: {
            prompt,
            response: `MANUAL_FALLBACK: ${manualComparison}`,
            modelUsed: "manual_fallback",
          },
        });

        return NextResponse.json({
          products,
          comparison: manualComparison,
        });
      }

      throw new Error("AI service request failed");
    }

    const aiResponse = await response.json();
    const comparison = aiResponse.choices?.[0]?.message?.content?.trim();

    if (!comparison) {
      throw new Error("No response from AI service");
    }

    // --- LOGGING ---
    if (prompt && comparison) {
      await prisma.aiLog.create({
        data: {
          prompt,
          response: comparison,
          modelUsed,
        },
      });
    }

    return NextResponse.json({
      products,
      comparison,
    });
  } catch (error) {
    console.error("Compare products error:", error);

    // --- LOGGING ON ERROR ---
    if (prompt && error instanceof Error) {
      await prisma.aiLog.create({
        data: {
          prompt,
          response: `ERROR: ${error.message}`,
          modelUsed,
        },
      });
    }

    let fallbackComparison =
      "An error occurred while generating the AI comparison. Please try again later.";

    // Provide more specific error messages for users
    if (error instanceof Error) {
      if (error.message.includes("rate-limited")) {
        fallbackComparison =
          "The AI service is temporarily busy due to high demand. Please try again in a few moments.";
      }
    }

    return NextResponse.json(
      {
        products: [],
        comparison: fallbackComparison,
      },
      { status: 500 }
    );
  }
}
