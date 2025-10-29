"use strict";
// functions/src/services/scraper.ts
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runScraper = runScraper;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const logger = __importStar(require("firebase-functions/logger"));
const firestore_1 = require("firebase-admin/firestore");
// puppeteer-core + bundled Chromium for serverless
const chromium_1 = __importDefault(require("@sparticuz/chromium"));
const puppeteer = __importStar(require("puppeteer-core"));
const db = (0, firestore_1.getFirestore)();
const STORES = [
    {
        name: 'Checkers',
        categoryUrls: [
            'https://www.checkers.co.za/merchandised-page/fruits-65b7b5a3ca9b46f5c71cbca9',
            'https://www.checkers.co.za/merchandised-page/vegetables-65b7b5c4ca9b46f5c71cbff6',
            // …add dairy, bakery, meat, etc.
        ],
        listingSelector: '.product-item-container',
        nameSelector: 'h3.item-name',
        priceSelector: 'span.item-price',
    },
    {
        name: 'Shoprite',
        categoryUrls: [
            'https://www.shoprite.co.za/c-2256/All-Departments',
        ],
        listingSelector: '[data-product-ga]',
        dataAttribute: 'data-product-ga',
    },
    {
        name: 'Woolworths',
        categoryUrls: [
            'https://www.woolworths.co.za/cat/food?page=1',
            // …other pages or sub-categories
        ],
        listingSelector: 'li.product-list-item',
        nameSelector: 'a.product-title',
        priceSelector: 'span.product-price',
    },
    {
        name: 'Spar',
        categoryUrls: [
        // TODO: fill in
        ],
        listingSelector: '.product-tile',
        nameSelector: '.product-name',
        priceSelector: '.product-price',
    },
    {
        name: 'Game',
        categoryUrls: [
            // TODO: fill in
            'https://www.game.co.za/',
        ],
        listingSelector: '.product-tile',
        nameSelector: '.product-title',
        priceSelector: '.price-sales',
    },
    {
        name: 'Makro',
        categoryUrls: [
        // TODO: fill in
        ],
        listingSelector: '.productCard',
        nameSelector: '.productName',
        priceSelector: '.price',
    },
];
/**
 * Fetch raw HTML via axios; if it fails or returns nothing,
 * spin up headless Chrome via puppeteer-core + chromium.
 */
async function fetchPageHtml(url) {
    try {
        const { data } = await axios_1.default.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 15000,
        });
        if (data && data.length > 100)
            return data;
        logger.warn(`⚠️  axios returned short HTML for ${url}, falling back to Puppeteer`);
    }
    catch (e) {
        logger.warn(`⚠️  axios failed for ${url}: ${e.message}, using Puppeteer`);
    }
    // Puppeteer fallback
    const browser = await puppeteer.launch({
        args: chromium_1.default.args,
        executablePath: await chromium_1.default.executablePath(),
        headless: 'new',
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    const html = await page.content();
    await browser.close();
    return html;
}
/**
 * Scrape *all* category URLs for one store, collect every product tile,
 * parse out name & price, then write them to Firestore.
 */
async function scrapeStore(store) {
    logger.log(`🔍 Scraping store "${store.name}"…`);
    const seen = new Set();
    const products = [];
    for (const url of store.categoryUrls) {
        logger.log(`  ↳ Fetching category page ${url}`);
        const html = await fetchPageHtml(url);
        const $ = cheerio.load(html);
        $(store.listingSelector).each((_, el) => {
            let name;
            let price;
            if (store.dataAttribute) {
                const raw = $(el).attr(store.dataAttribute);
                if (!raw)
                    return;
                const jsonStr = raw.replace(/&quot;/g, '\"');
                try {
                    const obj = JSON.parse(jsonStr);
                    name = obj.name.trim();
                    price = parseFloat(obj.price);
                }
                catch (_a) {
                    return;
                }
            }
            else {
                name = $(el).find(store.nameSelector).text().trim();
                const raw = $(el).find(store.priceSelector).text().trim();
                const cleaned = raw.replace(/[^0-9,\.]/g, '').replace(/,/g, '.');
                price = parseFloat(cleaned);
            }
            if (!name || isNaN(price))
                return;
            const key = `${name}::${price}`;
            if (seen.has(key))
                return;
            seen.add(key);
            products.push({ name, price });
        });
    }
    if (products.length === 0) {
        logger.warn(`⚠️ No products found for ${store.name}. Check your category URLs & selectors.`);
        return;
    }
    logger.log(`💾 Saving ${products.length} items for "${store.name}"…`);
    const batch = db.batch();
    for (const { name, price } of products) {
        const slug = `${store.name}-${name}`
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .slice(0, 150);
        const docRef = db.collection('storeProducts').doc(slug);
        batch.set(docRef, { name, price, store: store.name, lastUpdated: firestore_1.Timestamp.now() }, { merge: true });
    }
    await batch.commit();
    logger.log(`✅ Saved ${products.length} items for "${store.name}"`);
}
/**
 * Entrypoint: run all stores in sequence (or parallel if you prefer).
 */
async function runScraper() {
    logger.log(`🚀 Starting scraper for ${STORES.length} stores`);
    for (const store of STORES) {
        try {
            await scrapeStore(store);
        }
        catch (err) {
            logger.error(`❌ Failed to scrape ${store.name}`, err);
        }
    }
    logger.log('🏁 All stores processed.');
}
//# sourceMappingURL=scraper.js.map