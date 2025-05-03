'use server';

/**
 * @fileOverview Summarizes crop demand requests for farmers.
 *
 * - summarizeCropDemand - A function that summarizes crop demand requests.
 * - SummarizeCropDemandInput - The input type for the summarizeCropDemand function.
 * - SummarizeCropDemandOutput - The return type for the summarizeCropDemand function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const SummarizeCropDemandInputSchema = z.object({
  cropDemandRequests: z.array(
    z.object({
      crop: z.string().describe('The type of crop requested.'),
      quantity: z.number().describe('The quantity of the crop requested.'),
      location: z.string().describe('The location where the crop is needed.'),
    })
  ).describe('A list of crop demand requests from consumers.'),
});
export type SummarizeCropDemandInput = z.infer<typeof SummarizeCropDemandInputSchema>;

const SummarizeCropDemandOutputSchema = z.object({
  summary: z.string().describe('A summary of the crop demand requests.'),
});
export type SummarizeCropDemandOutput = z.infer<typeof SummarizeCropDemandOutputSchema>;

export async function summarizeCropDemand(input: SummarizeCropDemandInput): Promise<SummarizeCropDemandOutput> {
  return summarizeCropDemandFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeCropDemandPrompt',
  input: {
    schema: z.object({
      cropDemandRequests: z.array(
        z.object({
          crop: z.string().describe('The type of crop requested.'),
          quantity: z.number().describe('The quantity of the crop requested.'),
          location: z.string().describe('The location where the crop is needed.'),
        })
      ).describe('A list of crop demand requests from consumers.'),
    }),
  },
  output: {
    schema: z.object({
      summary: z.string().describe('A summary of the crop demand requests.'),
    }),
  },
  prompt: `You are an AI assistant helping farmers understand crop demand.

  Summarize the following crop demand requests, highlighting the crops in high demand, their quantities, and locations:

  {{#each cropDemandRequests}}
  - Crop: {{crop}}, Quantity: {{quantity}}, Location: {{location}}
  {{/each}}
  `,
});

const summarizeCropDemandFlow = ai.defineFlow<
  typeof SummarizeCropDemandInputSchema,
  typeof SummarizeCropDemandOutputSchema
>(
  {
    name: 'summarizeCropDemandFlow',
    inputSchema: SummarizeCropDemandInputSchema,
    outputSchema: SummarizeCropDemandOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
