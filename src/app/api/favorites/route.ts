import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ToggleFavoriteSchema } from '@/lib/validations';

export async function GET() {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const favorites = await prisma.favorite.findMany({
      where: { userId: authUser.userId },
      select: { productId: true },
    });
    
    const favoriteProductIds = favorites.map(f => f.productId);
    
    return NextResponse.json({ favoriteProductIds });
  } catch (error) {
    console.error('Get favorites error:', error);
    return NextResponse.json(
      { error: 'Failed to get favorites' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const validatedData = ToggleFavoriteSchema.parse(body);
    
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: validatedData.productId },
    });
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Check if already favorited
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId: authUser.userId,
          productId: validatedData.productId,
        },
      },
    });
    
    if (existingFavorite) {
      // Remove from favorites
      await prisma.favorite.delete({
        where: {
          userId_productId: {
            userId: authUser.userId,
            productId: validatedData.productId,
          },
        },
      });
      
      return NextResponse.json({
        message: 'Removed from favorites',
        isFavorited: false,
      });
    } else {
      // Add to favorites
      await prisma.favorite.create({
        data: {
          userId: authUser.userId,
          productId: validatedData.productId,
        },
      });
      
      return NextResponse.json({
        message: 'Added to favorites',
        isFavorited: true,
      });
    }
  } catch (error) {
    console.error('Toggle favorite error:', error);
    return NextResponse.json(
      { error: 'Failed to toggle favorite' },
      { status: 500 }
    );
  }
}