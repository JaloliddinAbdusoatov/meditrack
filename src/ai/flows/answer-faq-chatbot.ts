'use server';

/**
 * @fileOverview AI chatbot for answering frequently asked questions about the clinic.
 *
 * - answerFAQ: A function that answers FAQs about the clinic.
 * - AnswerFAQInput: The input type for the answerFAQ function.
 * - AnswerFAQOutput: The return type for the answerFAQ function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerFAQInputSchema = z.object({
  question: z.string().describe('The question to answer.'),
  clinicInfo: z.string().describe('Information about the clinic.'),
  services: z.string().describe('A list of services offered by the clinic.'),
  doctors: z.string().describe('Information about the doctors at the clinic.'),
});
export type AnswerFAQInput = z.infer<typeof AnswerFAQInputSchema>;

const AnswerFAQOutputSchema = z.object({
  answer: z.string().describe('The answer to the question.'),
});
export type AnswerFAQOutput = z.infer<typeof AnswerFAQOutputSchema>;

export async function answerFAQ(input: AnswerFAQInput): Promise<AnswerFAQOutput> {
  return answerFAQFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerFAQPrompt',
  input: {schema: AnswerFAQInputSchema},
  output: {schema: AnswerFAQOutputSchema},
  prompt: `You are a chatbot for a medical clinic. Use the information provided to answer the question.

Clinic Information: {{{clinicInfo}}}
Services: {{{services}}}
Doctors: {{{doctors}}}

Question: {{{question}}}

Answer:`,
});

const answerFAQFlow = ai.defineFlow(
  {
    name: 'answerFAQFlow',
    inputSchema: AnswerFAQInputSchema,
    outputSchema: AnswerFAQOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
