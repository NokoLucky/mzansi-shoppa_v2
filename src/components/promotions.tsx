'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Skeleton } from './ui/skeleton';
import { AlertCircle, Navigation, CalendarDays, Tag, Store, Percent } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { format, parseISO } from 'date-fns';
import { apiService } from '@/services/api';

type Promotion = {
  title: string;
  store: string;
  img: string;
  dataAiHint: string;
  category: string;
  discountPercent?: number;
  savingsAmount?: string;
  originalPrice?: string;
  currentPrice?: string;
  promotionType?: string;
  validUntil?: string;
};

function PromotionSkeleton() {
  return (
    <div className="p-1">
      <Card className="border-2 border-secondary/30 h-full">
        <CardContent className="p-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-4 w-40" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function PromotionCard({ promo }: { promo: Promotion }) {
  const getStoreColor = (store: string) => {
    const storeColors: { [key: string]: string } = {
      'Checkers': 'bg-red-100 text-red-800 border-red-200',
      'Shoprite': 'bg-green-100 text-green-800 border-green-200',
      'Pick n Pay': 'bg-blue-100 text-blue-800 border-blue-200',
      'Woolworths': 'bg-purple-100 text-purple-800 border-purple-200',
      'Spar': 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return storeColors[store] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPromotionTypeIcon = (type?: string) => {
    switch (type) {
      case 'percentage_discount':
        return <Percent className="h-3 w-3" />;
      case 'multibuy':
        return <Tag className="h-3 w-3" />;
      case 'price_drop':
        return <Tag className="h-3 w-3" />;
      case 'bundle':
        return <Tag className="h-3 w-3" />;
      default:
        return <Tag className="h-3 w-3" />;
    }
  };

  const getPromotionTypeText = (type?: string) => {
    switch (type) {
      case 'percentage_discount':
        return 'Discount';
      case 'multibuy':
        return 'Multi-buy';
      case 'price_drop':
        return 'Price Drop';
      case 'bundle':
        return 'Bundle Deal';
      default:
        return 'Special Offer';
    }
  };

  return (
    <div className="p-1 h-full">
      <Card className="border-2 border-secondary/20 hover:border-accent/50 transition-colors flex flex-col h-full shadow-sm hover:shadow-md">
        <CardContent className="p-6 flex flex-col flex-grow">
          {/* Store Badge */}
          <div className="flex items-center justify-between mb-3">
            <Badge 
              variant="outline" 
              className={`${getStoreColor(promo.store)} font-semibold text-xs flex items-center gap-1`}
            >
              <Store className="h-3 w-3" />
              {promo.store}
            </Badge>
            {promo.discountPercent && (
              <Badge variant="destructive" className="font-headline font-bold">
                {promo.discountPercent}% OFF
              </Badge>
            )}
          </div>

          {/* Promotion Title */}
          <h4 className="font-headline text-xl font-semibold leading-tight mb-2 text-foreground">
            {promo.title}
          </h4>

          {/* Category */}
          <Badge variant="secondary" className="mb-3 text-xs w-fit">
            {promo.category}
          </Badge>

          {/* Price Information */}
          <div className="space-y-2 mb-4">
            {promo.currentPrice && (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary">
                  {promo.currentPrice}
                </span>
                {promo.originalPrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    {promo.originalPrice}
                  </span>
                )}
              </div>
            )}
            
            {promo.savingsAmount && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                Save {promo.savingsAmount}
              </Badge>
            )}
          </div>

          {/* Promotion Type and Expiry */}
          <div className="mt-auto space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                {getPromotionTypeIcon(promo.promotionType)}
                <span>{getPromotionTypeText(promo.promotionType)}</span>
              </div>
              
              {promo.validUntil && (
                <div className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  <span>{format(parseISO(promo.validUntil), 'MMM dd')}</span>
                </div>
              )}
            </div>

            {/* Find Store Button */}
            <Button asChild variant="outline" size="sm" className="w-full font-headline mt-2">
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(promo.store + ', South Africa')}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Navigation className="mr-2 h-4 w-4" />
                Find Store
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Promotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPromotions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await apiService.getCurrentPromotions();
        
        if (result && result.promotions) {
          setPromotions(result.promotions);
        } else {
          throw new Error("Could not retrieve promotions.");
        }
      } catch (err) {
        console.error(err);
        setError("Sorry, we couldn't load promotions right now. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPromotions();
  }, []);

  return (
    <Card className="shadow-lg border border-accent/20">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-2">
          <Tag className="h-6 w-6 text-accent" />
          Hot Deals This Week
        </CardTitle>
        <CardDescription>Exclusive promotions from your favorite stores</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <Carousel className="w-full">
            <CarouselContent>
              {[...Array(3)].map((_, i) => (
                <CarouselItem key={i} className="md:basis-1/2 lg:basis-1/3">
                  <PromotionSkeleton />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        )}
        {!isLoading && error && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        {!isLoading && !error && promotions.length > 0 && (
          <Carousel 
            className="w-full" 
            opts={{ 
              loop: true, 
              align: "start",
              dragFree: true
            }}
            plugins={[
              Autoplay({
                delay: 8000,
                stopOnInteraction: true,
              }),
            ]}
          >
            <CarouselContent>
              {promotions.map((promo, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <PromotionCard promo={promo} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="ml-12" />
            <CarouselNext className="mr-12" />
          </Carousel>
        )}
        {!isLoading && !error && promotions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No current promotions available.</p>
            <p className="text-sm">Check back later for new deals!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}