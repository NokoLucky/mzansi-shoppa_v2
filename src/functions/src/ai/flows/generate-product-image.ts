
'use server';

import { ai } from '../genkit';
import { z } from 'zod';
import { getStorage } from 'firebase-admin/storage';
import { getApps, initializeApp } from 'firebase-admin/app';

// Initialize Firebase Admin SDK if not already done.
// This is the single point of initialization for the admin SDK.
if (!getApps().length) {
    initializeApp();
}

const storage = getStorage();
const bucket = storage.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'default-bucket');

const GenerateProductImageInputSchema = z.object({
  dataAiHint: z.string().describe('A 1-2 word hint for the image content.'),
  width: z.number().optional().describe('The width of the image.'),
  height: z.number().optional().describe('The height of the image.'),
});

const GenerateProductImageOutputSchema = z.object({
  imageUrl: z.string().url().describe('The URL of the generated image.'),
});

export async function generateProductImage(
  input: z.infer<typeof GenerateProductImageInputSchema>
): Promise<z.infer<typeof GenerateProductImageOutputSchema>> {
  return await generateProductImageFlow(input);
}

const generateProductImageFlow = ai.defineFlow(
  {
    name: 'generateProductImageFlow',
    inputSchema: GenerateProductImageInputSchema,
    outputSchema: GenerateProductImageOutputSchema,
  },
  async (input) => {
    // 1. Create a deterministic filename from the hint
    const normalizedHint = input.dataAiHint.toLowerCase().replace(/\s+/g, '-');
    const fileName = `generated-images/${normalizedHint}.png`;
    const file = bucket.file(fileName);

    // 2. Check if the image already exists in Cloud Storage
    const [exists] = await file.exists();

    if (exists) {
      // 3. If it exists, return the public URL
      const [publicUrl] = await file.getSignedUrl({
        action: 'read',
        expires: '03-09-2491', // A far-future date
      });
      return { imageUrl: publicUrl };
    }

    // 4. If it doesn't exist, generate the image
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `A professional, clean product photograph of ${input.dataAiHint} on a plain white background, studio lighting.`,
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
      },
    });

    if (!media || !media.url) {
      throw new Error('Image generation failed to return media.');
    }

    // 5. Upload the newly generated image to Cloud Storage
    const base64Data = media.url.split(',')[1];
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    await file.save(imageBuffer, {
      metadata: {
        contentType: 'image/png',
        cacheControl: 'public, max-age=31536000', // Cache for 1 year
      },
    });

    // 6. Get and return the public URL for the new image
    const [publicUrl] = await file.getSignedUrl({
      action: 'read',
      expires: '03-09-2491',
    });

    return {
      imageUrl: publicUrl,
    };
  }
);
