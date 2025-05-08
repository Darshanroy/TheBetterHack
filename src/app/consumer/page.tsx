'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  likes: number;
  comments: number;
  farmer: {
    name: string;
    avatarUrl?: string;
    farmerProfile: {
      farmName: string;
    };
  };
  products?: {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
  }[];
}

export default function ConsumerHomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const fetchPosts = useCallback(async () => {
    if (!hasMore || isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/posts?page=${page}&limit=10`);
      const data = await response.json();
      
      if (response.ok) {
        setPosts(prev => [...prev, ...data.posts]);
        setHasMore(data.hasMore);
        setPage(prev => prev + 1);
      } else {
        console.error('Failed to fetch posts:', data.error);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, hasMore, isLoading]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
      });
      
      if (response.ok) {
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            const isLiked = likedPosts.has(postId);
            return {
              ...post,
              likes: isLiked ? post.likes - 1 : post.likes + 1
            };
          }
          return post;
        }));
        
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          if (newSet.has(postId)) {
            newSet.delete(postId);
          } else {
            newSet.add(postId);
          }
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleAddToCart = async (productId: string) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      
      if (response.ok) {
        // Show success toast or update UI
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Latest Updates</h1>
      
      <div className="space-y-6">
        {posts.map((post) => (
          <Card key={post.id} className="overflow-hidden">
            {/* Post Header */}
            <div className="flex items-center p-4">
              <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                <img 
                  src={post.farmer.avatarUrl || '/default-avatar.png'} 
                  alt={post.farmer.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="font-semibold">{post.farmer.name}</p>
                <p className="text-sm text-muted-foreground">{post.farmer.farmerProfile.farmName}</p>
              </div>
            </div>

            {/* Post Image */}
            {post.imageUrl && (
              <div className="aspect-square relative">
                <img 
                  src={post.imageUrl} 
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Post Actions */}
            <div className="p-4 space-y-4">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleLike(post.id)}
                >
                  <Heart className={`h-6 w-6 ${likedPosts.has(post.id) ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
                <Button variant="ghost" size="icon">
                  <MessageCircle className="h-6 w-6" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Share2 className="h-6 w-6" />
                </Button>
              </div>

              {/* Likes and Comments */}
              <div className="space-y-1">
                <p className="font-semibold">{post.likes} likes</p>
                <p className="text-sm text-muted-foreground">{post.comments} comments</p>
              </div>

              {/* Post Content */}
              <div>
                <p className="font-semibold">{post.title}</p>
                <p className="text-sm">{post.content}</p>
              </div>

              {/* Attached Products */}
              {post.products && post.products.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Available Products:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {post.products.map(product => (
                      <div key={product.id} className="flex items-center space-x-2 p-2 border rounded-lg">
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">₹{product.price}</p>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => handleAddToCart(product.id)}
                        >
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button 
            onClick={fetchPosts} 
            disabled={isLoading}
            className="w-full md:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <p className="text-center text-muted-foreground">
          No more posts to load
        </p>
      )}
    </div>
  );
}

    