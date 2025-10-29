"use strict";
/**
 * @fileOverview This file connects to Firestore to find product prices
 * that have been populated by the web scraper.
 */
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
exports.findPriceInDb = findPriceInDb;
const firestore_1 = require("firebase-admin/firestore");
const logger = __importStar(require("firebase-functions/logger"));
const db = (0, firestore_1.getFirestore)();
/**
 * Normalizes a product name for consistent lookups.
 * @param name The product name.
 * @returns A lowercase, trimmed version of the name.
 */
function normalizeProductName(name) {
    return name.toLowerCase().trim();
}
/**
 * Finds the price of a product by querying the `storeProducts` collection.
 * It searches for the product name and tries to match the store.
 * @param productName The full name of the product.
 * @param storeName The name of the store.
 * @returns The price as a number, or null if not found.
 */
async function findPriceInDb(productName, storeName) {
    const normalizedName = normalizeProductName(productName);
    logger.log(`Searching for '${normalizedName}' at '${storeName}'`);
    try {
        const productsRef = db.collection('storeProducts');
        // A real app might need a more sophisticated search (e.g., using a search service like Algolia),
        // but for now, we'll try to find documents that might contain the product name.
        // This is not a perfect text search.
        const snapshot = await productsRef
            .where('store', '==', storeName)
            .get();
        if (snapshot.empty) {
            // logger.log(`No products found for store: ${storeName}`);
            return null;
        }
        // Since Firestore doesn't support case-insensitive or partial text search well,
        // we fetch results for the store and filter in memory. This is not efficient for large datasets.
        for (const doc of snapshot.docs) {
            const product = doc.data();
            if (product.name && normalizeProductName(product.name).includes(normalizedName)) {
                logger.log(`Found match: ${product.name} at price ${product.price}`);
                return product.price;
            }
        }
        // logger.log(`No specific match for '${normalizedName}' found at ${storeName} after filtering.`);
        return null;
    }
    catch (error) {
        logger.error('Error querying Firestore for product price:', error);
        return null;
    }
}
//# sourceMappingURL=product-db.js.map