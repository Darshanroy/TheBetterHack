import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function POST(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const postId = params.postId;
    
    // Get the current post
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Update the post's like count
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        likes: post.likes + 1
      }
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error('Error liking post:', error);
    return NextResponse.json(
      { error: 'Failed to like post' },
      { status: 500 }
    );
  }
} 