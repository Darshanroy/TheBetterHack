
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
import { submitStory, type Story } from '@/services/stories'; // Assume service exists
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


const storyFormSchema = z.object({
  content: z.string().min(5, {
    message: 'Story content must be at least 5 characters.',
  }).max(150, { message: 'Story content cannot exceed 150 characters.'}), // Instagram-like limit
  duration: z.coerce.number().int().min(3, {message: 'Duration must be at least 3 seconds.'}).max(60, {message: 'Duration cannot exceed 60 seconds.'}).default(10),
  // TODO: Add field for image/video upload/URL
});

type StoryFormValues = z.infer<typeof storyFormSchema>;

export function AddStoryForm() {
  const searchParams = useSearchParams();
   const { toast } = useToast();

  const form = useForm<StoryFormValues>({
    resolver: zodResolver(storyFormSchema),
    defaultValues: {
      content: '',
      duration: 10,
    },
  });

   // Populate form from query params
  useEffect(() => {
      const content = searchParams.get('content');
      const duration = searchParams.get('duration');

      if (content) form.setValue('content', content);
      if (duration && !isNaN(parseInt(duration))) form.setValue('duration', parseInt(duration));
  }, [searchParams, form]);


  async function onSubmit(data: StoryFormValues) {
     console.log('Submitting story:', data);
     try {
        const storyData: Omit<Story, 'id'> = {
            content: data.content,
            duration: data.duration,
            // TODO: Handle media URL
        };
      await submitStory(storyData);
       toast({
        title: "Success!",
        description: "Story submitted successfully.",
      });
      form.reset(); // Reset form after successful submission
    } catch (error) {
      console.error("Failed to submit story:", error);
      toast({
        title: "Error",
        description: "Failed to submit story. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
         {/* TODO: Add Image/Video Upload/URL field */}
         {/* <FormField ... name="mediaUrl" ... /> */}
         <div className="p-4 border border-dashed rounded-md text-center text-muted-foreground">
           <p>Image/Video Upload Placeholder</p>
           <p className="text-xs">Feature coming soon!</p>
         </div>

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Story Text Overlay</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add text to your story (max 150 chars)..."
                  className="resize-none h-24"
                  maxLength={150}
                  {...field}
                />
              </FormControl>
               <FormDescription>
                 Short text that appears on your story.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (seconds)</FormLabel>
              <FormControl>
                 <Input type="number" min="3" max="60" placeholder="10" {...field} />
              </FormControl>
              <FormDescription>
                How long the story will be displayed (3-60 seconds).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />


        <Button type="submit" disabled={form.formState.isSubmitting}>
           {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Add Story
        </Button>
      </form>
    </Form>
  );
}
