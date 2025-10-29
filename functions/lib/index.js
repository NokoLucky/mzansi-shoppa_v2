"use strict";
'use server';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.test = exports.suggestrelateditems = exports.suggestitemcompletions = exports.optimizelist = exports.getstoreproducts = exports.getpriceestimates = exports.getcurrentpromotions = exports.generateproductimage = void 0;
// This must be the first import
const app_1 = require("firebase-admin/app");
// This is the single entry point for initialization.
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)();
}
const logger = __importStar(require("firebase-functions/logger"));
const v2_1 = require("firebase-functions/v2");
const generate_product_image_1 = require("./ai/flows/generate-product-image");
const get_current_promotions_1 = require("./ai/flows/get-current-promotions");
const get_price_estimates_1 = require("./ai/flows/get-price-estimates");
const get_store_products_1 = require("./ai/flows/get-store-products");
const optimize_list_flow_1 = require("./ai/flows/optimize-list-flow");
const suggest_item_completions_1 = require("./ai/flows/suggest-item-completions");
const suggest_related_items_1 = require("./ai/flows/suggest-related-items");
// Set global options for all functions
(0, v2_1.setGlobalOptions)({
    region: "us-central1",
});
// Helper to handle errors for onCall functions
const onCallWrapper = (handler) => v2_1.https.onCall({
    // Allow all origins to call these functions
    cors: true,
}, async (request) => {
    try {
        const result = await handler(request.data);
        return result;
    }
    catch (err) {
        logger.error(err);
        const genkitErr = err;
        throw new v2_1.https.HttpsError('internal', genkitErr.message || 'An unknown error occurred.');
    }
});
exports.generateproductimage = onCallWrapper(generate_product_image_1.generateProductImage);
exports.getcurrentpromotions = onCallWrapper(get_current_promotions_1.getCurrentPromotions);
exports.getpriceestimates = onCallWrapper(get_price_estimates_1.getPriceEstimates);
exports.getstoreproducts = onCallWrapper(get_store_products_1.getStoreProducts);
exports.optimizelist = onCallWrapper(optimize_list_flow_1.optimizeList);
exports.suggestitemcompletions = onCallWrapper(suggest_item_completions_1.suggestItemCompletions);
exports.suggestrelateditems = onCallWrapper(suggest_related_items_1.suggestRelatedItems);
// A map of our functions for the test endpoint
const functionsMap = {
    generateproductimage: generate_product_image_1.generateProductImage,
    getcurrentpromotions: get_current_promotions_1.getCurrentPromotions,
    getpriceestimates: get_price_estimates_1.getPriceEstimates,
    getstoreproducts: get_store_products_1.getStoreProducts,
    optimizelist: optimize_list_flow_1.optimizeList,
    suggestitemcompletions: suggest_item_completions_1.suggestItemCompletions,
    suggestrelateditems: suggest_related_items_1.suggestRelatedItems,
};
// Generic test endpoint
exports.test = v2_1.https.onRequest(async (request, response) => {
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
    }
    catch (err) {
        logger.error(err);
        const genkitErr = err;
        response.status(500).json({
            error: {
                message: genkitErr.message || 'An unknown error occurred.',
                status: genkitErr.name || 'INTERNAL'
            }
        });
    }
});
//# sourceMappingURL=index.js.map