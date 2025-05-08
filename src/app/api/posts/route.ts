import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { Prisma } from '@prisma/client';

// Create a validator for the post with relations
const postWithRelations = Prisma.validator<Prisma.PostDefaultArgs>()({
  include: {
    farmer: {
      include: {
        user: true
      }
    },
    products: true
  }
});

type PostWithRelations = Prisma.PostGetPayload<typeof postWithRelations>;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        ...postWithRelations
      }),
      prisma.post.count()
    ]);

    return NextResponse.json({
      posts: posts.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        imageUrl: post.imageUrl,
        likes: post.likes,
        comments: post.comments,
        createdAt: post.createdAt,
        farmer: {
          name: post.farmer.user.name,
          avatarUrl: post.farmer.user.avatarUrl,
          farmerProfile: {
            farmName: post.farmer.farmName
          }
        },
        products: post.products
      })),
      total,
      hasMore: skip + posts.length < total
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
} 