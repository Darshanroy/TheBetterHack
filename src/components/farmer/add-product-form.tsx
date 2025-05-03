
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
import { submitProduct, type Product } from '@/services/products'; // Assume service exists
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { generateProductDescription, type GenerateProductDescriptionInput } from '@/ai/flows/generate-product-description'; // Import AI flow
import { Loader2, Sparkles, IndianRupee } from 'lucide-react'; // Use IndianRupee
import { useToast } from '@/hooks/use-toast';


const productFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Product name must be at least 2 characters.',
  }),
  description: z.string().min(10, {
    message: 'Description must be at least 10 characters.',
  }),
  price: z.coerce.number().positive({ message: 'Price must be a positive number (INR).' }),
  imageUrl: z.string().url({ message: 'Please enter a valid image URL.' }).optional().or(z.literal('')),
   // Add fields relevant for AI description generation
  productType: z.enum(['fruit', 'vegetable']).default('fruit'),
  keyTraits: z.string().optional().describe('Key traits like sweet, juicy, organic, color, size etc.'),
  unit: z.string().min(1, { message: 'Please specify the unit (e.g., Kg, Bunch, Piece, Litre)'}).default('Kg'), // Added Unit field
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export function AddProductForm() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      imageUrl: '',
      productType: 'fruit',
      keyTraits: '',
      unit: 'Kg', // Default unit
    },
  });

   // Populate form from query params
  useEffect(() => {
      const name = searchParams.get('name');
      const description = searchParams.get('description');
      const price = searchParams.get('price');
      const imageUrl = searchParams.get('imageUrl');
      const productType = searchParams.get('productType') as 'fruit' | 'vegetable' | null;
      const keyTraits = searchParams.get('keyTraits');
      const unit = searchParams.get('unit');


      if (name) form.setValue('name', name);
      if (description) form.setValue('description', description);
      if (price && !isNaN(parseFloat(price))) form.setValue('price', parseFloat(price));
      if (imageUrl) form.setValue('imageUrl', imageUrl);
      if (productType) form.setValue('productType', productType);
      if (keyTraits) form.setValue('keyTraits', keyTraits);
      if (unit) form.setValue('unit', unit);


  }, [searchParams, form]);


  async function onSubmit(data: ProductFormValues) {
     console.log('Submitting product:', data);
     try {
        // Note: The Product interface in services/products.ts might need updating
        // if it doesn't include the 'unit' field. For now, we map to existing fields.
        const productData: Omit<Product, 'id'> = {
            name: `${data.name} (${data.unit})`, // Append unit to name for now
            description: data.description,
            price: data.price, // Price is already in INR
            // Use placeholder if URL is empty, otherwise use provided URL
            imageUrl: data.imageUrl || `https://picsum.photos/seed/${encodeURIComponent(data.name)}/400/300`,
        };
      await submitProduct(productData);
      toast({
        title: "Success!",
        description: "Product submitted successfully.",
      });
      form.reset(); // Reset form after successful submission
    } catch (error) {
      console.error("Failed to submit product:", error);
       toast({
        title: "Error",
        description: "Failed to submit product. Please try again.",
        variant: "destructive",
      });
    }
  }

  const handleGenerateDescription = async () => {
    const name = form.getValues('name');
    const type = form.getValues('productType');
    const traits = form.getValues('keyTraits');

    if (!name || !type || !traits) {
       toast({
        title: "Missing Information",
        description: "Please provide Product Name, Type, and Key Traits to generate a description.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingDesc(true);
    try {
        const input: GenerateProductDescriptionInput = {
            productName: name,
            productType: type,
            keyTraits: traits,
        };
      const result = await generateProductDescription(input);
      form.setValue('description', result.description);
       toast({
        title: "Description Generated!",
        description: "AI successfully generated a product description.",
      });
    } catch (error) {
      console.error("Failed to generate description:", error);
       toast({
        title: "AI Error",
        description: "Failed to generate description. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDesc(false);
    }
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name (e.g., Nati Tomato, Tender Coconut)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Organic Banganapalli Mangoes" {...field} />
              </FormControl>
              <FormDescription>
                The specific name of the fruit or vegetable you are selling.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

         <FormField
          control={form.control}
          name="productType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Type</FormLabel>
               <FormControl>
                 {/* Replace with ShadCN Select if needed */}
                <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <option value="fruit">Fruit</option>
                    <option value="vegetable">Vegetable</option>
                 </select>
              </FormControl>
              <FormDescription>
                Select whether this is a fruit or a vegetable.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

         <FormField
          control={form.control}
          name="keyTraits"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Key Traits</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Sweet, tangy, locally grown (Bangalore), yellow" {...field} />
              </FormControl>
              <FormDescription>
                Keywords describing the product (used for AI description).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the product, its taste, origin (e.g., Ooty, Coorg), usage suggestions..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
               <FormDescription className="flex items-center justify-between">
                 <span>Provide details about the product.</span>
                 <Button
                   type="button"
                   variant="outline"
                   size="sm"
                   onClick={handleGenerateDescription}
                   disabled={isGeneratingDesc || !form.watch('name') || !form.watch('productType') || !form.watch('keyTraits')}
                 >
                   {isGeneratingDesc ? (
                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                   ) : (
                     <Sparkles className="mr-2 h-4 w-4 text-accent" />
                   )}
                   Generate with AI
                 </Button>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Price (INR)</FormLabel>
                 <FormControl>
                    <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="number" step="0.01" placeholder="0.00" className="pl-8" {...field} />
                    </div>
                 </FormControl>
                <FormDescription>
                    Set the price in Indian Rupees (₹).
                </FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Kg, Bunch, Piece, Dozen, Litre" {...field} />
                    </FormControl>
                    <FormDescription>
                        Specify the selling unit for the price.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
        </div>


         <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL (Optional)</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://your-image-host.com/image.jpg" {...field} />
              </FormControl>
              <FormDescription>
                Link to an image of your product. If left blank, a placeholder will be used.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* TODO: Add inventory management field */}
        {/* <FormField ... name="inventory" ... /> */}

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Add Product
        </Button>
      </form>
    </Form>
  );
}

    