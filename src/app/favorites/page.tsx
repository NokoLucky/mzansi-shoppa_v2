'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { History, Trash2, ListPlus, ArrowLeft, PackageOpen, LogIn, AlertCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';
import { getFirebaseInstances } from '@/lib/firebase';
import { toast } from 'sonner'; // or your preferred toast library

type SavedList = {
  date: string;
  items: string[];
};

function FavoritesSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
                <Card key={i} className="shadow-lg border border-primary/10">
                    <CardHeader>
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2 mt-1" />
                    </CardHeader>
                    <CardContent>
                         <div className="flex flex-wrap gap-2">
                            <Skeleton className="h-6 w-16 rounded-full" />
                            <Skeleton className="h-6 w-20 rounded-full" />
                            <Skeleton className="h-6 w-12 rounded-full" />
                         </div>
                    </CardContent>
                    <CardFooter className="flex justify-between gap-2">
                        <Skeleton className="h-10 w-10" />
                        <Skeleton className="h-10 w-full" />
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}

export default function FavoritesPage() {
  const [savedLists, setSavedLists] = useState<SavedList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchLists = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { db } = getFirebaseInstances();
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists() && docSnap.data().savedLists) {
          setSavedLists(docSnap.data().savedLists);
        } else {
          // Initialize with empty array if no savedLists field exists
          setSavedLists([]);
        }
      } catch (error) {
        console.error('Error fetching saved lists:', error);
        if (error instanceof FirebaseError) {
          if (error.code === 'permission-denied') {
            const errorMsg = 'Firestore permission denied. Please check security rules.';
            setError(errorMsg);
            toast.error(errorMsg);
          } else if (error.code === 'unavailable') {
            const errorMsg = 'Network error. Please check your connection.';
            setError(errorMsg);
            toast.error(errorMsg);
          } else {
            const errorMsg = `Error loading lists: ${error.message}`;
            setError(errorMsg);
            toast.error(errorMsg);
          }
        } else {
          const errorMsg = 'An unexpected error occurred while loading your lists.';
          setError(errorMsg);
          toast.error(errorMsg);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchLists();
  }, [user, authLoading]);

  const handleUseList = (items: string[]) => {
    const query = new URLSearchParams({ items: items.join(',') }).toString();
    router.push(`/?${query}`);
  };

  const handleDeleteList = async (date: string) => {
    if (!user) return;
    
    try {
      const { db } = getFirebaseInstances();
      const updatedLists = savedLists.filter(list => list.date !== date);
      setSavedLists(updatedLists);
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { savedLists: updatedLists });
      toast.success('List deleted successfully');
    } catch (error) {
      console.error('Error deleting list:', error);
      toast.error('Failed to delete list. Please try again.');
      // Re-fetch lists to restore state
      const { db } = getFirebaseInstances();
      const userDocRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists() && docSnap.data().savedLists) {
        setSavedLists(docSnap.data().savedLists);
      }
    }
  };

  const handleClearAll = async () => {
    if (!user) return;
    
    try {
      const { db } = getFirebaseInstances();
      setSavedLists([]);
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { savedLists: [] });
      toast.success('All lists cleared successfully');
    } catch (error) {
      console.error('Error clearing all lists:', error);
      toast.error('Failed to clear all lists. Please try again.');
      // Re-fetch lists to restore state
      const { db } = getFirebaseInstances();
      const userDocRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists() && docSnap.data().savedLists) {
        setSavedLists(docSnap.data().savedLists);
      }
    }
  };

  const retryFetch = () => {
    if (user) {
      setError(null);
      setIsLoading(true);
      // The useEffect will trigger again due to isLoading change
    }
  };

  if (authLoading || isLoading) {
    return (
       <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 md:p-12">
            <header className="container mx-auto mb-8">
                <div className="mb-4">
                    <Button asChild variant="outline" size="sm" disabled>
                        <Link href="/">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Home
                        </Link>
                    </Button>
                </div>
                <div className="flex items-center gap-3">
                    <History className="h-10 w-10 text-primary" />
                    <div>
                        <h1 className="text-4xl sm:text-5xl font-headline font-bold text-primary">
                            Saved Lists
                        </h1>
                        <p className="mt-1 text-lg sm:text-xl font-body text-muted-foreground">
                            Revisit and reuse your previous shopping lists.
                        </p>
                    </div>
                </div>
            </header>
            <main className="container mx-auto">
                <FavoritesSkeleton />
            </main>
        </div>
    )
  }

  if (!user) {
      return (
          <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
              <Card className="w-full max-w-md mx-auto text-center shadow-lg border-primary/20">
                  <CardHeader>
                      <CardTitle className="font-headline text-3xl">Please Sign In</CardTitle>
                      <CardDescription>You need to be signed in to view your saved lists.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <Button asChild size="lg" className="font-headline">
                          <Link href="/login">
                              <LogIn className="mr-2" />
                              Go to Sign In Page
                          </Link>
                      </Button>
                  </CardContent>
              </Card>
          </div>
      );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 md:p-12">
        <header className="container mx-auto mb-8">
          <div className="mb-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <History className="h-10 w-10 text-primary" />
            <div>
              <h1 className="text-4xl sm:text-5xl font-headline font-bold text-primary">
                Saved Lists
              </h1>
              <p className="mt-1 text-lg sm:text-xl font-body text-muted-foreground">
                Revisit and reuse your previous shopping lists.
              </p>
            </div>
          </div>
        </header>

        <main className="container mx-auto">
          <Card className="text-center py-16 px-8 shadow-lg border-destructive/20">
            <CardContent className="flex flex-col items-center gap-4">
              <AlertCircle className="h-16 w-16 text-destructive" />
              <h2 className="text-2xl font-headline font-semibold">Error Loading Lists</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                {error}
              </p>
              <div className="flex gap-4 mt-4">
                <Button onClick={retryFetch} className="font-headline">
                  Try Again
                </Button>
                <Button asChild variant="outline" className="font-headline">
                  <Link href="/">
                    Back to Home
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 md:p-12">
      <header className="container mx-auto mb-8">
         <div className="mb-4">
            <Button asChild variant="outline" size="sm">
                <Link href="/">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Home
                </Link>
            </Button>
        </div>
        <div className="flex items-center gap-3">
            <History className="h-10 w-10 text-primary" />
            <div>
                <h1 className="text-4xl sm:text-5xl font-headline font-bold text-primary">
                    Saved Lists
                </h1>
                <p className="mt-1 text-lg sm:text-xl font-body text-muted-foreground">
                    Revisit and reuse your previous shopping lists.
                </p>
            </div>
        </div>
      </header>

      <main className="container mx-auto">
        {savedLists.length > 0 && (
             <div className="text-right mb-4">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Clear All History
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete all your saved shopping lists from your account.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearAll}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        )}

        {savedLists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedLists.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(list => (
              <Card key={list.date} className="shadow-lg border border-primary/10 flex flex-col">
                <CardHeader>
                  <CardTitle className="font-headline text-xl">
                    List from {new Date(list.date).toLocaleDateString()}
                  </CardTitle>
                  <CardDescription>
                    {new Date(list.date).toLocaleTimeString()} - {list.items.length} items
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="flex flex-wrap gap-2">
                    {list.items.map((item, index) => (
                      <Badge key={`${list.date}-${item}-${index}`} variant="secondary">{item}</Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between gap-2">
                   <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete list</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this list?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the list from {new Date(list.date).toLocaleDateString()}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteList(list.date)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                   <Button className="font-headline flex-grow" onClick={() => handleUseList(list.items)}>
                        <ListPlus className="h-4 w-4 mr-2"/>
                        Use This List
                   </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-16 px-8 shadow-lg border-dashed">
            <CardContent className="flex flex-col items-center gap-4">
                <PackageOpen className="h-16 w-16 text-muted-foreground"/>
                <h2 className="text-2xl font-headline font-semibold">No Saved Lists Yet</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                    After you compare prices for a list, you'll have the option to save it. Your saved lists will appear here for future use.
                </p>
                <Button asChild className="mt-4 font-headline">
                    <Link href="/">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Start a New List
                    </Link>
                </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}