'use server';

/**
 * @fileOverview A flow for generating product descriptions for fruits and vegetables.
 *
 * - generateProductDescription - A function that generates a product description.
 * - GenerateProductDescriptionInput - The input type for the generateProductDescription function.
 * - GenerateProductDescriptionOutput - The return type for the generateProductDescription function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateProductDescriptionInputSchema = z.object({
  productName: z.string().describe('The name of the product (fruit or vegetable).'),
  productType: z.enum(['fruit', 'vegetable']).describe('The type of product.'),
  keyTraits: z.string().describe('Key traits of the product e.g., sweet, juicy, organic.'),
});
export type GenerateProductDescriptionInput = z.infer<typeof GenerateProductDescriptionInputSchema>;

const GenerateProductDescriptionOutputSchema = z.object({
  description: z.string().describe('A compelling product description.'),
});
export type GenerateProductDescriptionOutput = z.infer<typeof GenerateProductDescriptionOutputSchema>;

export async function generateProductDescription(
  input: GenerateProductDescriptionInput
): Promise<GenerateProductDescriptionOutput> {
  return generateProductDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProductDescriptionPrompt',
  input: {
    schema: z.object({
      productName: z.string().describe('The name of the product (fruit or vegetable).'),
      productType: z.enum(['fruit', 'vegetable']).describe('The type of product.'),
      keyTraits: z.string().describe('Key traits of the product e.g., sweet, juicy, organic.'),
    }),
  },
  output: {
    schema: z.object({
      description: z.string().describe('A compelling product description.'),
    }),
  },
  prompt: `You are an expert copywriter specializing in writing compelling product descriptions for fruits and vegetables.

  Given the following information, write a short, engaging description to attract customers:

  Product Name: {{{productName}}}
  Product Type: {{{productType}}}
  Key Traits: {{{keyTraits}}}

  Description:`,
});

const generateProductDescriptionFlow = ai.defineFlow<
  typeof GenerateProductDescriptionInputSchema,
  typeof GenerateProductDescriptionOutputSchema
>(
  {
    name: 'generateProductDescriptionFlow',
    inputSchema: GenerateProductDescriptionInputSchema,
    outputSchema: GenerateProductDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
