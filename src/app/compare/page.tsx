'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { doc, updateDoc, arrayUnion, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/context/auth-context';
import StoreRecommendations from '@/components/store-recommendations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LocateFixed, Sparkles, Bookmark } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { getFirebaseInstances } from '@/lib/firebase';


type Location = {
    latitude: number;
    longitude: number;
} | null;

function ComparePageContent() {
    const searchParams = useSearchParams();
    const itemsParam = searchParams.get('items');
    const [shoppingList, setShoppingList] = useState<string[]>([]);
    
    useEffect(() => {
        if (itemsParam) {
            setShoppingList(itemsParam.split(','));
        }
    }, [itemsParam]);
    
    const { user, loading: authLoading } = useAuth();
    const [isSaving, setIsSaving] = useState(false);

    const [location, setLocation] = useState<Location>(null);
    const [locationStatus, setLocationStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

    const [budget, setBudget] = useState('');
    const [isOptimizing, setIsOptimizing] = useState(false);
    const { toast } = useToast();

    const requestLocation = () => {
        setLocationStatus('pending');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setLocationStatus('success');
            },
            () => {
                setLocationStatus('error');
            }
        );
    };

    useEffect(() => {
        requestLocation();
    }, []);

    const handleOptimize = async () => {
        const budgetValue = parseFloat(budget);
        if (isNaN(budgetValue) || budgetValue <= 0) {
            toast({
                title: "Invalid Budget",
                description: "Please enter a valid, positive number for your budget.",
                variant: "destructive"
            });
            return;
        }

        setIsOptimizing(true);
        try {
            // TODO: We need to create an optimize-list API endpoint
            // For now, we'll disable this feature and show a message
            toast({
                title: "Feature Coming Soon",
                description: "List optimization will be available in the next update.",
                variant: "default"
            });
            
            // OLD CODE (commented out since we don't have this API yet):
            // const { app } = getFirebaseInstances();
            // const functions = getFunctions(app, 'us-central1');
            // const optimizeListFn = httpsCallable(functions, 'optimizelist');
            // const response: any = await optimizeListFn({
            //     shoppingList,
            //     budget: budgetValue,
            // });
            // const result = response.data;
            // ... rest of optimization logic

        } catch (error) {
            console.error(error);
            toast({
                title: "Optimization Failed",
                description: "We couldn't optimize your list at this time. Please try again later.",
                variant: "destructive"
            });
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleSaveList = async () => {
        if (!user) {
            toast({
                title: "Please Sign In",
                description: "You need to be signed in to save a shopping list.",
                variant: "destructive"
            });
            return;
        }

        if (shoppingList.length === 0) {
            toast({
                title: "Empty List",
                description: "Cannot save an empty list.",
                variant: "destructive"
            });
            return;
        }

        setIsSaving(true);
        try {
            const { db } = getFirebaseInstances();
            const userDocRef = doc(db, 'users', user.uid);

            const newList = {
                date: new Date().toISOString(),
                items: shoppingList,
            };

            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
                await updateDoc(userDocRef, {
                    savedLists: arrayUnion(newList)
                });
            } else {
                // This case is unlikely if user is signed up properly, but good to have
                await setDoc(userDocRef, { savedLists: [newList] }, { merge: true });
            }

            toast({
                title: "List Saved!",
                description: "You can find your saved lists on the 'Saved' page.",
            });
        } catch (error) {
            console.error("Failed to save list to Firestore", error);
            toast({
                title: "Save Failed",
                description: "Could not save your list. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };


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
                <h1 className="text-4xl sm:text-5xl font-headline font-bold text-primary">
                    Price Comparison
                </h1>
                <p className="mt-2 text-lg sm:text-xl font-body text-muted-foreground">Here are the estimates for your list. Prices are not live and may vary.</p>
            </header>

            <main className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                 <div className="lg:col-span-1 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Your List</CardTitle>
                            <CardDescription>Items being compared.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {shoppingList.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {shoppingList.map(item => (
                                        <Badge key={item} variant="secondary" className="text-base px-3 py-1">{item}</Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">No items to compare.</p>
                            )}
                        </CardContent>
                         <CardFooter>
                            <Button 
                                variant="outline" 
                                className="w-full font-headline" 
                                onClick={handleSaveList} 
                                disabled={shoppingList.length === 0 || isSaving || authLoading}
                                loading={isSaving}
                            >
                                <Bookmark className="h-4 w-4 mr-2" />
                                Save List for Later
                            </Button>
                        </CardFooter>
                    </Card>

                    {locationStatus === 'error' && (
                        <Alert>
                            <LocateFixed className="h-4 w-4" />
                            <AlertTitle>Location Disabled</AlertTitle>
                            <AlertDescription>
                                We couldn't access your location. Distance estimates will be less accurate.
                                <Button variant="link" className="p-0 h-auto ml-1" onClick={requestLocation}>Try again?</Button>
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <div className="lg:col-span-2 space-y-8">
                    <StoreRecommendations shoppingList={shoppingList} location={location} />

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-accent" />
                                Budget Mode
                            </CardTitle>
                            <CardDescription>Enter your budget and we'll help you optimize.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="budget">Your Budget (R)</Label>
                                <Input 
                                    id="budget"
                                    type="number"
                                    placeholder="e.g., 500"
                                    value={budget}
                                    onChange={(e) => setBudget(e.target.value)}
                                    disabled={isOptimizing}
                                />
                             </div>
                             <Button onClick={handleOptimize} loading={isOptimizing} disabled={isOptimizing || !budget} className="w-full font-headline">
                                Optimize List
                             </Button>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}


export default function ComparePage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
            <ComparePageContent />
        </Suspense>
    )
}