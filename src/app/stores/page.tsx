
'use client';

import { useState } from 'react';
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { STORES } from "@/lib/stores";
import { useRouter } from 'next/navigation';

const participatingStores = Object.values(STORES);

export default function StoresPage() {
  const router = useRouter();
  const [loadingStore, setLoadingStore] = useState<string | null>(null);

  const handleViewProducts = (slug: string) => {
    setLoadingStore(slug);
    router.push(`/stores/${slug}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 md:p-12">
      <header className="container mx-auto mb-8">
        <h1 className="text-4xl sm:text-5xl font-headline font-bold text-primary">
            Participating Stores
        </h1>
        <p className="mt-2 text-lg sm:text-xl font-body text-muted-foreground">Browse products from your favorite local stores.</p>
      </header>

      <main className="container mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {participatingStores.map((store) => (
            <Card key={store.slug} className="shadow-lg border border-primary/10 hover:border-primary/30 transition-all flex flex-col">
              <CardHeader className="flex-row items-center gap-4">
                <div className="h-16 w-16 shrink-0 rounded-lg border-2 border-secondary p-1">
                    <div className="relative w-full h-full">
                        <Image 
                            src={store.logo} 
                            alt={`${store.name} logo`} 
                            fill 
                            className="object-contain" 
                            data-ai-hint={store.dataAiHint} 
                            sizes="64px"
                        />
                    </div>
                </div>
                <div>
                  <CardTitle className="font-headline text-2xl">{store.name}</CardTitle>
                  <CardDescription>{store.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex-grow flex items-end">
                <Button 
                  className="w-full mt-4 font-headline"
                  onClick={() => handleViewProducts(store.slug)}
                  loading={loadingStore === store.slug}
                  disabled={loadingStore !== null}
                >
                    View Products
                    <ArrowRight className="ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
