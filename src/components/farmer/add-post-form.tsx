
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { submitPost, type Post } from '@/services/posts'; // Assume service exists
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// TODO: Add fields for attaching products if needed

const postFormSchema = z.object({
  title: z.string().min(5, {
    message: 'Post title must be at least 5 characters.',
  }),
  content: z.string().min(10, {
    message: 'Post content must be at least 10 characters.',
  }),
  // Optional: Add product attachment field later
  // attachedProductId: z.string().optional(),
});

type PostFormValues = z.infer<typeof postFormSchema>;

export function AddPostForm() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: '',
      content: '',
    },
  });

   // Populate form from query params
  useEffect(() => {
      const title = searchParams.get('title');
      const content = searchParams.get('content');

      if (title) form.setValue('title', title);
      if (content) form.setValue('content', content);
  }, [searchParams, form]);


  async function onSubmit(data: PostFormValues) {
     console.log('Submitting post:', data);
     try {
        const postData: Omit<Post, 'id'> = {
            title: data.title,
            content: data.content,
        };
      await submitPost(postData);
       toast({
        title: "Success!",
        description: "Post submitted successfully.",
      });
      form.reset(); // Reset form after successful submission
    } catch (error) {
      console.error("Failed to submit post:", error);
       toast({
        title: "Error",
        description: "Failed to submit post. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Post Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Fresh Strawberry Harvest!" {...field} />
              </FormControl>
              <FormDescription>
                A catchy title for your post (announcement, update, etc.).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Post Content</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Share details about your harvest, farm news, or promotions..."
                  className="resize-none h-32" // Make textarea taller
                  {...field}
                />
              </FormControl>
               <FormDescription>
                 Write the main content of your post here.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

         {/* TODO: Add product attachment dropdown/search */}
         {/* <FormField ... name="attachedProductId" ... /> */}


        <Button type="submit" disabled={form.formState.isSubmitting}>
           {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Create Post
        </Button>
      </form>
    </Form>
  );
}
