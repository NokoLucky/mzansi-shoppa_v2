'use server';

import * as logger from "firebase-functions/logger";
import { https, setGlobalOptions } from "firebase-functions/v2";
import { initializeApp, getApps } from "firebase-admin/app";
import { type GenkitError } from "./ai/genkit";


import { generateProductImage } from "./ai/flows/generate-product-image";
import { getCurrentPromotions } from "./ai/flows/get-current-promotions";
import { getPriceEstimates } from "./ai/flows/get-price-estimates";
import { getStoreProducts } from "./ai/flows/get-store-products";
import { optimizeList } from "./ai/flows/optimize-list-flow";
import { suggestItemCompletions } from "./ai/flows/suggest-item-completions";
import { suggestRelatedItems } from "./ai/flows/suggest-related-items";

// Initialize Firebase Admin SDK ONLY if it hasn't been initialized yet.
// This is the single entry point for initialization.
if (!getApps().length) {
  initializeApp();
}

// Set global options for all functions
setGlobalOptions({ 
  region: "us-central1",
});

// Helper to handle errors for onCall functions
const onCallWrapper = (handler: (data: any) => Promise<any>) => 
  https.onCall({
    // Allow all origins to call these functions
    cors: true,
  }, async (request) => {
    try {
      const result = await handler(request.data);
      return result;
    } catch (err: any) {
      logger.error(err);
      const genkitErr = err as GenkitError;
      throw new https.HttpsError(
        'internal', 
        genkitErr.message || 'An unknown error occurred.',
      );
    }
});


export const generateproductimage = onCallWrapper(generateProductImage);
export const getcurrentpromotions = onCallWrapper(getCurrentPromotions);
export const getpriceestimates = onCallWrapper(getPriceEstimates);
export const getstoreproducts = onCallWrapper(getStoreProducts);
export const optimizelist = onCallWrapper(optimizeList);
export const suggestitemcompletions = onCallWrapper(suggestItemCompletions);
export const suggestrelateditems = onCallWrapper(suggestRelatedItems);


// A map of our functions for the test endpoint
const functionsMap: Record<string, (data: any) => Promise<any>> = {
    generateproductimage: generateProductImage,
    getcurrentpromotions: getCurrentPromotions,
    getpriceestimates: getPriceEstimates,
    getstoreproducts: getStoreProducts,
    optimizelist: optimizeList,
    suggestitemcompletions: suggestItemCompletions,
    suggestrelateditems: suggestRelatedItems,
};

// Generic test endpoint
export const test = https.onRequest(async (request, response) => {
    response.set('Access-Control-Allow-Origin', '*');
    response.set('Access-Control-Allow-Headers', 'Content-Type');
    response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    if (request.method === 'OPTIONS') {
        response.status(204).send('');
        return;
    }

    const functionName = request.path.split('/').pop() || '';
    const handler = functionsMap[functionName];

    if (!handler) {
        response.status(404).json({ error: { message: 'Function not found.' } });
        return;
    }
    
    try {
        // For GET requests, query params are used. For POST, the body is used.
        const data = request.method === 'POST' ? request.body : request.query;
        const result = await handler(data);
        response.json({ data: result });
    } catch (err: any) {
        logger.error(err);
        const genkitErr = err as GenkitError;
        response.status(500).json({ 
            error: { 
                message: genkitErr.message || 'An unknown error occurred.',
                status: genkitErr.name || 'INTERNAL' 
            } 
        });
    }
});
