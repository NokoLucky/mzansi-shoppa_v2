'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, Navigation, AlertCircle, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from 'next/image';
import { buttonVariants, Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { STORES } from '@/lib/stores';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { apiService } from '@/services/api';

type Store = {
  name: string;
  distance: string;
  totalPrice: number;
  logoUrl: string;
  isCheapest: boolean;
  priceBreakdown: { item: string; price: number }[];
};

type Location = {
    latitude: number;
    longitude: number;
} | null;

const storeNameMapping: Record<string, keyof typeof STORES> = {
    "Checkers": "checkers",
    "Shoprite": "shoprite",
    "Spar": "spar",
    "Woolworths": "woolworths",
    "Woolworths Food": "woolworths",
    "Pick n Pay": "pick-n-pay",
    "Game": "game",
    "Makro": "makro",
};

function StoreRecommendationsSkeleton() {
  return (
    <ul className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <li key={i} className="flex items-center gap-4 p-3 rounded-lg border border-border">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-grow space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <Skeleton className="h-10 w-10" />
        </li>
      ))}
    </ul>
  )
}

export default function StoreRecommendations({ shoppingList, location }: { shoppingList: string[], location: Location }) {
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shoppingList.length === 0) {
      setIsLoading(false);
      setStores([]);
      return;
    }

    const fetchEstimates = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await apiService.getPriceEstimates(
          shoppingList,
          location?.latitude,
          location?.longitude
        );
        
        if (result && result.stores) {
          setStores(result.stores);
        } else {
            throw new Error("Could not retrieve price estimates.");
        }
      } catch (err) {
        console.error('Error fetching price estimates:', err);
        setError("Sorry, we couldn't get price estimates at the moment. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEstimates();
  }, [shoppingList, location]);

  return (
    <Card className="shadow-lg border border-accent/20">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">
          Store Price Estimates
        </CardTitle>
        <CardDescription>Price estimates for your shopping list at various stores.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <StoreRecommendationsSkeleton />}
        {!isLoading && error && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        {!isLoading && !error && stores.length > 0 && (
            <ul className="space-y-4">
            {stores.map((store) => {
                const storeKey = Object.keys(storeNameMapping).find(key => store.name.includes(key));
                const mappedKey = storeKey ? storeNameMapping[storeKey] : undefined;
                const logoUrl = mappedKey ? STORES[mappedKey].logo : 'https://placehold.co/40x40/FFC72C/FFFFFF.png';
                
                return (
                    <li key={store.name}>
                        <Collapsible className={cn('p-3 rounded-lg transition-all', store.isCheapest ? 'border-2 border-primary bg-primary/10' : 'border border-border')}>
                           <div className="flex flex-col gap-3">
                                <div className='flex items-center gap-4 w-full'>
                                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
                                        <Image src={logoUrl} alt={`${store.name} logo`} fill className="object-contain" sizes="40px" />
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-center">
                                        <h3 className="font-body font-semibold">{store.name}</h3>
                                        {store.isCheapest && <Badge variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90"><Trophy className="h-4 w-4 mr-1" /> Best Estimate</Badge>}
                                        </div>
                                        <div className="flex justify-between items-baseline text-sm mt-1">
                                        <p className="text-muted-foreground">{store.distance} away</p>
                                        <p className="font-bold font-body text-lg text-primary">R{store.totalPrice.toFixed(2)}</p>
                                        </div>
                                    </div>
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.name + ', South Africa')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={`Navigate to ${store.name}`}
                                        className={cn(buttonVariants({ variant: "outline", size: "icon" }), "shrink-0")}
                                    >
                                        <Navigation className="h-5 w-5" />
                                    </a>
                                </div>
                                <CollapsibleTrigger asChild>
                                    <Button variant="secondary" className="w-full justify-center text-sm h-9">
                                        Price Breakdown
                                        <ChevronDown className="h-4 w-4 ml-2 transition-transform duration-200 data-[state=open]:rotate-180" />
                                    </Button>
                                </CollapsibleTrigger>
                            </div>

                            <CollapsibleContent className="pt-4 pl-4 pr-4 text-sm">
                                <h4 className="font-semibold mb-2">Price Breakdown Details</h4>
                                <ul className="space-y-1 text-muted-foreground">
                                    {store.priceBreakdown.map((item, index) => (
                                        <li key={index} className="flex justify-between">
                                            <span>{item.item}</span>
                                            <span className="font-medium text-foreground">R{item.price.toFixed(2)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CollapsibleContent>
                        </Collapsible>
                    </li>
                )
            })}
            </ul>
        )}
         {!isLoading && !error && stores.length === 0 && shoppingList.length > 0 && (
            <p className="text-muted-foreground text-center">No price estimates available.</p>
         )}
         {!isLoading && shoppingList.length === 0 && (
            <p className="text-muted-foreground text-center">Your shopping list is empty.</p>
         )}
      </CardContent>
    </Card>
  );
}