import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CompareProductsSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CompareProductsSchema.parse(body);
    
    // Fetch the products to compare
    const products = await prisma.product.findMany({
      where: {
        id: { in: validatedData.productIds },
      },
    });
    
    if (products.length !== validatedData.productIds.length) {
      return NextResponse.json(
        { error: 'One or more products not found' },
        { status: 404 }
      );
    }
    
    // Create a detailed prompt for AI comparison
    const productDetails = products.map(p => `
Product: ${p.name}
Brand: ${p.brand}
Category: ${p.category}
Price: $${p.price}
Rating: ${p.rating}/5
CPU: ${p.cpu}
RAM: ${p.ram_gb}GB
Storage: ${p.storage_gb}GB
Screen: ${p.screen_inch}"
Weight: ${p.weight_kg}kg
Battery: ${p.battery_wh}Wh
`).join('\n---\n');

    const prompt = `
Compare these ${products.length} electronic products and provide a concise analysis highlighting the key differences, pros and cons of each product. Focus on value for money, performance, and use cases.

Products to compare:
${productDetails}

Provide a structured comparison that helps users make an informed decision. Include:
1. Brief overview of each product
2. Key strengths and weaknesses
3. Best use cases for each
4. Value for money assessment
5. Final recommendation based on different user needs

Keep the response under 500 words and make it easy to read.
`;

    // Call AI service for comparison
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'AI Product Explorer',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.2-3b-instruct:free',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      throw new Error('AI service request failed');
    }

    const aiResponse = await response.json();
    const comparison = aiResponse.choices?.[0]?.message?.content?.trim();

    if (!comparison) {
      throw new Error('No response from AI service');
    }

    return NextResponse.json({
      products,
      comparison,
    });
  } catch (error) {
    console.error('Compare products error:', error);
    
    // Fallback comparison if AI fails
    const fallbackComparison = `
Comparison of ${validatedData.productIds.length} products:

Unfortunately, we couldn't generate an AI-powered comparison at this time. Here's a basic overview:

Please compare the products manually by looking at their specifications:
- Price and value for money
- Performance specifications (CPU, RAM, Storage)
- Build quality and design
- Battery life (for portable devices)
- Screen size and quality
- Overall ratings and reviews

For the best experience, try again later when our AI service is available.
    `;

    return NextResponse.json({
      products: [],
      comparison: fallbackComparison.trim(),
    });
  }
}