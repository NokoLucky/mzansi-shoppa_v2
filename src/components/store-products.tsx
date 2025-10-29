'use client';

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, Plus, Info, Store, Tag, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { StoreSlug } from '@/lib/stores';
import { STORES } from '@/lib/stores';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';

type Product = {
  id: number;
  name: string;
  price: string;
  onSpecial: boolean;
  originalPrice?: string;
  dataAiHint: string;
  image: string;
};

type StoreInfo = typeof STORES[StoreSlug];

function ProductCardSkeleton() {
  return (
    <Card className="border-2 border-secondary/30 hover:border-secondary/50 transition-colors">
      <CardContent className="p-4">
        <div className="space-y-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-full" />
          <div className="flex items-baseline gap-2">
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

function ProductCard({ product, onAddItem, isAdding }: { product: Product, onAddItem: (productName: string) => void, isAdding: boolean }) {
  // Extract brand and product details from name
  const getProductBrand = (name: string) => {
    const brands = ['Clover', 'Albany', 'Sasko', 'Koo', 'All Gold', 'Lancewood', 'Nestle', 'Coca-Cola', 'Tastic', 'Bokomo', 'Rainbow', 'Eskort', 'Woolworths', 'Checkers', 'Shoprite', 'Pick n Pay', 'Spar'];
    const foundBrand = brands.find(brand => name.includes(brand));
    return foundBrand || 'Generic';
  };

  const getProductCategory = (name: string) => {
    const categories = {
      'milk': 'Dairy',
      'bread': 'Bakery',
      'eggs': 'Dairy',
      'chicken': 'Meat',
      'rice': 'Pantry',
      'pasta': 'Pantry',
      'yogurt': 'Dairy',
      'cheese': 'Dairy',
      'butter': 'Dairy',
      'juice': 'Beverages',
      'soda': 'Beverages',
      'coffee': 'Beverages',
      'cereal': 'Breakfast',
      'detergent': 'Household',
      'cleaning': 'Household'
    };

    const nameLower = name.toLowerCase();
    for (const [key, category] of Object.entries(categories)) {
      if (nameLower.includes(key)) {
        return category;
      }
    }
    return 'General';
  };

  const brand = getProductBrand(product.name);
  const category = getProductCategory(product.name);

  return (
    <Card className="border-2 border-secondary/20 hover:border-accent/50 transition-all hover:shadow-md">
      <CardContent className="p-4">
        {/* Brand and Category */}
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-xs font-medium">
            {brand}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {category}
          </Badge>
        </div>

        {/* Product Name */}
        <h3 className="font-headline text-lg font-semibold leading-tight mb-3 text-foreground line-clamp-2">
          {product.name}
        </h3>

        {/* Price Information */}
        <div className="flex items-baseline justify-between mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">
              {product.price}
            </span>
            {product.onSpecial && product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {product.originalPrice}
              </span>
            )}
          </div>
          
          {product.onSpecial && (
            <Badge variant="destructive" className="font-headline font-bold">
              <Tag className="h-3 w-3 mr-1" />
              SALE
            </Badge>
          )}
        </div>

        {/* Add to List Button */}
        <Button 
          className="w-full font-headline" 
          onClick={() => onAddItem(product.name)} 
          loading={isAdding}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add to List
        </Button>
      </CardContent>
    </Card>
  );
}

const ProductGrid = ({ productList, onAddItem, addingItemName }: { productList: Product[], onAddItem: (productName: string) => void, addingItemName: string | null }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {productList.map(product => (
      <ProductCard 
        key={product.id} 
        product={product} 
        onAddItem={onAddItem}
        isAdding={addingItemName === product.name}
      />
    ))}
  </div>
);

export default function StoreProducts({ storeInfo }: { storeInfo: StoreInfo }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingItemName, setAddingItemName] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const handleAddItemToList = (productName: string) => {
    setAddingItemName(productName);

    const currentItems = searchParams.get('items')?.split(',').filter(i => i) || [];
    const capitalizedItem = productName.charAt(0).toUpperCase() + productName.slice(1);

    if (!currentItems.map(i => i.toLowerCase()).includes(capitalizedItem.toLowerCase())) {
        const newItems = [...currentItems, capitalizedItem];
        const query = new URLSearchParams({ items: newItems.join(',') }).toString();
        
        toast({
            title: "Item Added!",
            description: `"${capitalizedItem}" has been added to your shopping list.`,
        });
        router.push(`/?${query}`);
    } else {
        toast({
            title: "Item already exists",
            description: `"${capitalizedItem}" is already in your list.`,
            variant: "destructive"
        });
        router.push('/');
    }
  };

  const fetchProducts = async (existingProductNames: string[] = []) => {
      setError(null);
      try {
        const result = await apiService.getStoreProducts(
          storeInfo.name,
          existingProductNames
        );
        
        if (result && result.products) {
          return result.products;
        } else {
          throw new Error("Could not retrieve products for this store.");
        }
      } catch (err) {
        console.error('Error fetching store products:', err);
        setError("Sorry, we couldn't load products right now. Please try again later.");
        return [];
      }
  };
  
  useEffect(() => {
    setIsLoading(true);
    fetchProducts().then(initialProducts => {
        setProducts(initialProducts);
        setIsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeInfo]);
  
  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    const existingNames = products.map(p => p.name);
    const newProducts = await fetchProducts(existingNames);
    setProducts(prevProducts => [...prevProducts, ...newProducts]);
    setIsLoadingMore(false);
  }
  
  const specialProducts = products.filter(p => p.onSpecial);
  const regularProducts = products.filter(p => !p.onSpecial);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8">
      <header className="container mx-auto mb-8">
        <div className="mb-4">
            <Button asChild variant="outline" size="sm">
                <Link href="/stores">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to All Stores
                </Link>
            </Button>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 rounded-lg border-2 border-secondary p-2 bg-background flex items-center justify-center">
            <Store className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl sm:text-5xl font-headline font-bold text-primary">{storeInfo.name}</h1>
            <p className="mt-1 text-lg sm:text-xl font-body text-muted-foreground">Browse all products and specials.</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <ProductCardSkeleton key={`product-skel-${i}`} />)}
          </div>
        ) : error ? (
           <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        ) : (
          <div className="space-y-8">
            {specialProducts.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="h-6 w-6 text-accent" />
                  <h2 className="text-2xl font-headline font-semibold text-accent">
                    On Special
                  </h2>
                  <Badge variant="outline" className="bg-accent/10 text-accent">
                    {specialProducts.length} deals
                  </Badge>
                </div>
                <ProductGrid productList={specialProducts} onAddItem={handleAddItemToList} addingItemName={addingItemName} />
              </section>
            )}

            <section>
              <div className="flex items-center gap-2 mb-6">
                <Store className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-headline font-semibold">
                  All Products
                </h2>
                <Badge variant="outline">
                  {regularProducts.length} items
                </Badge>
              </div>
              
              {products.length > 0 ? (
                <ProductGrid productList={regularProducts} onAddItem={handleAddItemToList} addingItemName={addingItemName} />
              ) : (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No products found for this store yet.</p>
                    <p className="text-sm">Please check back later or try another store.</p>
                  </CardContent>
                </Card>
              )}
            </section>

            {products.length > 0 && (
              <div className="flex justify-center mt-8">
                <Button 
                  onClick={handleLoadMore} 
                  disabled={isLoadingMore}
                  size="lg"
                  className="font-headline"
                  loading={isLoadingMore}
                  variant="outline"
                >
                  Load More Products
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}