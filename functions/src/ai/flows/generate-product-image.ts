
'use server';

import { ai } from '../genkit';
import { z } from 'zod';
import { getStorage } from 'firebase-admin/storage';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// This is the single point of initialization for the admin SDK.
if (!getApps().length) {
    initializeApp();
}

const storage = getStorage();
const db = getFirestore();
// Use the default bucket associated with the Firebase project.
const bucket = storage.bucket(); 

console.log(`📦 Using default storage bucket: ${bucket.name}`);

const GenerateProductImageInputSchema = z.object({
  dataAiHint: z.string().describe('A 1-2 word hint for the image content.'),
  width: z.number().optional().describe('The width of the image.'),
  height: z.number().optional().describe('The height of the image.'),
});

const GenerateProductImageOutputSchema = z.object({
  imageUrl: z.string().url().describe('The URL of the generated image.'),
});

// Schema for the image cache document in Firestore
const ImageCacheSchema = z.object({
    imageUrl: z.string().url(),
    createdAt: z.string().datetime(),
    hint: z.string(),
});
type ImageCache = z.infer<typeof ImageCacheSchema>;


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
    // 1. Create a deterministic ID from the hint
    const normalizedHint = input.dataAiHint.toLowerCase().replace(/\s+/g, '-');
    const cacheRef = db.collection('generatedImages').doc(normalizedHint);
    
    // 2. Check Firestore for a cached image URL first.
    const doc = await cacheRef.get();
    if (doc.exists) {
        const cachedData = doc.data() as ImageCache;
        console.log(`✅ CACHE HIT: Returning cached image from Firestore for hint: "${input.dataAiHint}"`);
        return { imageUrl: cachedData.imageUrl };
    }

    console.log(`⏳ CACHE MISS: Generating, uploading, and caching new image for hint: "${input.dataAiHint}"`);

    // 3. If it doesn't exist in Firestore, generate the image.
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

    // 4. Upload the newly generated image to Cloud Storage.
    const fileName = `generated-images/${normalizedHint}.png`;
    const file = bucket.file(fileName);
    const base64Data = media.url.split(',')[1];
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    await file.save(imageBuffer, {
      metadata: {
        contentType: 'image/png',
        cacheControl: 'public, max-age=31536000', // Cache for 1 year
      },
    });

    // 5. Get a signed URL for the new image. This requires the 'iam.serviceAccounts.signBlob' permission.
    const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: '03-09-2491', // A very far-future date
    });
    console.log(`✅ Generated signed URL: ${signedUrl}`);


    // 6. Save the new signed image URL to Firestore for future caching.
    const newCacheEntry: ImageCache = {
        imageUrl: signedUrl,
        createdAt: new Date().toISOString(),
        hint: input.dataAiHint,
    };
    await cacheRef.set(newCacheEntry);
    console.log(`💾 New image for "${input.dataAiHint}" saved to Firestore cache.`);

    return {
      imageUrl: signedUrl,
    };
  }
);
