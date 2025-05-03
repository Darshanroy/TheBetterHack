'use server';

/**
 * @fileOverview An AI agent that provides dietary recommendations for fruits and vegetables.
 *
 * - getDietaryRecommendations - A function that handles the dietary recommendation process.
 * - DietaryRecommendationInput - The input type for the getDietaryRecommendations function.
 * - DietaryRecommendationOutput - The return type for the getDietaryRecommendations function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const DietaryRecommendationInputSchema = z.object({
  healthConditions: z
    .array(z.string())
    .describe('A list of health conditions the consumer has.'),
  dietaryGoals: z
    .string()
    .describe('The dietary goals of the consumer, e.g., weight loss, healthy eating.'),
});
export type DietaryRecommendationInput = z.infer<typeof DietaryRecommendationInputSchema>;

const DietaryRecommendationOutputSchema = z.object({
  recommendations: z.array(z.string()).describe('A list of dietary recommendations for fruits and vegetables based on the input.'),
  explanation: z.string().describe('An explanation of why these recommendations are being made.'),
});
export type DietaryRecommendationOutput = z.infer<typeof DietaryRecommendationOutputSchema>;

export async function getDietaryRecommendations(input: DietaryRecommendationInput): Promise<DietaryRecommendationOutput> {
  return dietaryRecommendationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dietaryRecommendationPrompt',
  input: {
    schema: z.object({
      healthConditions: z
        .array(z.string())
        .describe('A list of health conditions the consumer has.'),
      dietaryGoals: z
        .string()
        .describe('The dietary goals of the consumer, e.g., weight loss, healthy eating.'),
    }),
  },
  output: {
    schema: z.object({
      recommendations: z.array(z.string()).describe('A list of dietary recommendations for fruits and vegetables based on the input.'),
      explanation: z.string().describe('An explanation of why these recommendations are being made.'),
    }),
  },
  prompt: `You are a registered dietician who provides personalized dietary recommendations based on a person's health conditions and dietary goals.

  Given the following health conditions: {{#each healthConditions}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  And the dietary goal of: {{{dietaryGoals}}}

  Recommend specific fruits and vegetables, and explain why these recommendations are being made, considering the health conditions and dietary goals.
  Only recommend fruits and vegetables.
  Format your response as a list of recommendations, followed by a detailed explanation.
  `,
});

const dietaryRecommendationFlow = ai.defineFlow<
  typeof DietaryRecommendationInputSchema,
  typeof DietaryRecommendationOutputSchema
>({
  name: 'dietaryRecommendationFlow',
  inputSchema: DietaryRecommendationInputSchema,
  outputSchema: DietaryRecommendationOutputSchema,
},
async input => {
  const {output} = await prompt(input);
  return output!;
});
