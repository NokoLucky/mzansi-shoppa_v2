const API_BASE = 'https://grocery-ai-api.vercel.app/api/ai';

export const apiService = {
  // Get price estimates for shopping list
  async getPriceEstimates(shoppingList: string[], latitude?: number, longitude?: number) {
    const response = await fetch(`${API_BASE}/get-price-estimates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shoppingList, latitude, longitude }),
    });
    return response.json();
  },

  // Get item suggestions for autocomplete
  async suggestItemCompletions(query: string) {
    const response = await fetch(`${API_BASE}/suggest-item-completions?q=${encodeURIComponent(query)}`);
    return response.json();
  },

  // Get current promotions
  async getCurrentPromotions() {
    const response = await fetch(`${API_BASE}/get-current-promotions`);
    return response.json();
  },

  // Generate product image
  async generateProductImage(dataAiHint: string) {
    const response = await fetch(`${API_BASE}/generate-product-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataAiHint }),
    });
    return response.json();
  },

  // Get store products
  async getStoreProducts(storeName: string, existingProducts: string[] = []) {
    const response = await fetch(`${API_BASE}/get-store-products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeName, existingProducts }),
    });
    return response.json();
  },
};