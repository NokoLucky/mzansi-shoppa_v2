
'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ShoppingList from '@/components/shopping-list';
import Promotions from '@/components/promotions';
import { useToast } from "@/hooks/use-toast";

function HomePageContent() {
  const searchParams = useSearchParams();
  const itemsParam = searchParams.get('items');
  const [shoppingList, setShoppingList] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // This effect ensures the list always stays in sync with the URL's 'items' parameter.
    const newList = itemsParam ? itemsParam.split(',') : [];
    setShoppingList(newList);
  }, [itemsParam]);


  const handleAddItem = (itemToAdd: string) => {
    const capitalizedItem = itemToAdd.charAt(0).toUpperCase() + itemToAdd.slice(1);
    if (!shoppingList.map(i => i.toLowerCase()).includes(capitalizedItem.toLowerCase())) {
      setShoppingList(prev => [...prev, capitalizedItem]);
    } else {
        toast({
            title: "Item already exists",
            description: `"${capitalizedItem}" is now in your shopping list.`,
            variant: "destructive"
        })
    }
  };

  const handleRemoveItem = (itemToRemove: string) => {
    setShoppingList(prev => prev.filter(item => item !== itemToRemove));
  };


  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="py-8 px-4 sm:px-8 md:px-16 bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto">
          <h1 className="text-4xl sm:text-5xl font-headline font-bold">Mzansi Shoppa</h1>
          <p className="mt-2 text-lg sm:text-xl font-body text-primary-foreground/90">Your smart shopping companion in South Africa</p>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-8 md:p-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2">
          <ShoppingList 
            list={shoppingList}
            onAddItem={handleAddItem}
            onRemoveItem={handleRemoveItem}
          />
        </div>
        <div className="lg:col-span-1 space-y-8">
          <Promotions />
        </div>
      </main>

      <footer className="py-8 text-center text-muted-foreground font-body">
        <p>&copy; {new Date().getFullYear()} Mzansi Shoppa. All rights reserved.</p>
      </footer>
    </div>
  );
}


export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePageContent />
    </Suspense>
  )
}
