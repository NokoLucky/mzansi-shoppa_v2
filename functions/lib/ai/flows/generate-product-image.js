"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateProductImage = generateProductImage;
const genkit_1 = require("../genkit");
const zod_1 = require("zod");
const storage_1 = require("firebase-admin/storage");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
// This is the single point of initialization for the admin SDK.
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)();
}
const storage = (0, storage_1.getStorage)();
const db = (0, firestore_1.getFirestore)();
// Use the default bucket associated with the Firebase project.
const bucket = storage.bucket();
console.log(`📦 Using default storage bucket: ${bucket.name}`);
const GenerateProductImageInputSchema = zod_1.z.object({
    dataAiHint: zod_1.z.string().describe('A 1-2 word hint for the image content.'),
    width: zod_1.z.number().optional().describe('The width of the image.'),
    height: zod_1.z.number().optional().describe('The height of the image.'),
});
const GenerateProductImageOutputSchema = zod_1.z.object({
    imageUrl: zod_1.z.string().url().describe('The URL of the generated image.'),
});
// Schema for the image cache document in Firestore
const ImageCacheSchema = zod_1.z.object({
    imageUrl: zod_1.z.string().url(),
    createdAt: zod_1.z.string().datetime(),
    hint: zod_1.z.string(),
});
async function generateProductImage(input) {
    return await generateProductImageFlow(input);
}
const generateProductImageFlow = genkit_1.ai.defineFlow({
    name: 'generateProductImageFlow',
    inputSchema: GenerateProductImageInputSchema,
    outputSchema: GenerateProductImageOutputSchema,
}, async (input) => {
    // 1. Create a deterministic ID from the hint
    const normalizedHint = input.dataAiHint.toLowerCase().replace(/\s+/g, '-');
    const cacheRef = db.collection('generatedImages').doc(normalizedHint);
    // 2. Check Firestore for a cached image URL first.
    const doc = await cacheRef.get();
    if (doc.exists) {
        const cachedData = doc.data();
        console.log(`✅ CACHE HIT: Returning cached image from Firestore for hint: "${input.dataAiHint}"`);
        return { imageUrl: cachedData.imageUrl };
    }
    console.log(`⏳ CACHE MISS: Generating, uploading, and caching new image for hint: "${input.dataAiHint}"`);
    // 3. If it doesn't exist in Firestore, generate the image.
    const { media } = await genkit_1.ai.generate({
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
    const newCacheEntry = {
        imageUrl: signedUrl,
        createdAt: new Date().toISOString(),
        hint: input.dataAiHint,
    };
    await cacheRef.set(newCacheEntry);
    console.log(`💾 New image for "${input.dataAiHint}" saved to Firestore cache.`);
    return {
        imageUrl: signedUrl,
    };
});
//# sourceMappingURL=generate-product-image.js.map