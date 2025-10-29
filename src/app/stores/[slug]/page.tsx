
import { notFound } from 'next/navigation';
import { STORES, StoreSlug } from '@/lib/stores';
import StoreProducts from '@/components/store-products';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function generateStaticParams() {
  return Object.keys(STORES).map((slug) => ({
    slug,
  }));
}

function StorePageSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 md:p-12">
       <header className="container mx-auto mb-8">
        <div className="mb-4">
            <Button asChild variant="outline" size="sm" disabled>
                <Link href="/stores">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to All Stores
                </Link>
            </Button>
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 shrink-0 rounded-lg" />
          <div>
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-6 w-64" />
          </div>
        </div>
      </header>
      <main className="container mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="aspect-square w-full" />)}
        </div>
      </main>
    </div>
  )
}

function StoreProductsPageContent({ params }: { params: { slug: string } }) {
  const storeInfo = STORES[params.slug as StoreSlug];

  if (!storeInfo) {
    notFound();
  }

  return <StoreProducts storeInfo={storeInfo} />;
}

export default function StoreProductsPage({ params }: { params: { slug: string } }) {
    return (
        <Suspense fallback={<StorePageSkeleton />}>
            <StoreProductsPageContent params={params} />
        </Suspense>
    )
}
