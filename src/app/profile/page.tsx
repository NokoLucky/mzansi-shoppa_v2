
'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Award, Edit, LogOut, LogIn, Loader2 } from 'lucide-react';
import { ThemeToggle } from "@/components/theme-toggle";

const ProfileHeader = () => (
    <header className="container mx-auto mb-8">
        <h1 className="text-4xl sm:text-5xl font-headline font-bold text-primary">My Profile</h1>
        <p className="mt-2 text-lg sm:text-xl font-body text-muted-foreground">Manage your personal information and settings.</p>
    </header>
);


export default function ProfilePage() {
  const router = useRouter();
  const { user, signOut, loading } = useAuth();
  
  // A helper to get initials from name
  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const loyaltyStatus = "Gold Member"; // This can be derived from user data later

  const handleSignOut = async () => {
    try {
        await signOut();
        router.push('/login');
    } catch (error) {
        console.error("Failed to sign out", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 md:p-12">
        <ProfileHeader />
        <main className="container mx-auto flex justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 md:p-12">
        <ProfileHeader />
        <main className="container mx-auto">
            <Card className="w-full max-w-md mx-auto text-center shadow-lg border-primary/20">
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Please Sign In</CardTitle>
                    <CardDescription>You need to be signed in to view your profile.</CardDescription>
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
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 md:p-12">
      <ProfileHeader />
      <main className="container mx-auto">
        <Card className="max-w-2xl mx-auto shadow-lg border border-primary/20">
          <CardHeader className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <Avatar className="h-24 w-24 border-4 border-primary">
              <AvatarImage src={user.photoURL || `https://placehold.co/100x100/FFC72C/FFFFFF.png?text=${getInitials(user.displayName)}`} alt={user.displayName || 'User'} data-ai-hint="person portrait" />
              <AvatarFallback className="text-3xl">{getInitials(user.displayName)}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <CardTitle className="font-headline text-3xl">{user.displayName || 'Valued Shopper'}</CardTitle>
              <CardDescription className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {user.email}
              </CardDescription>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                 <Award className="h-4 w-4 text-yellow-500" />
                 <span className="font-semibold text-yellow-600">{loyaltyStatus}</span>
              </div>
            </div>
            <div className="flex gap-2">
                <ThemeToggle />
                <Button variant="outline" size="icon" className="shrink-0" disabled>
                <Edit className="h-5 w-5" />
                <span className="sr-only">Edit Profile</span>
                </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2"><User className="h-4 w-4" /> Full Name</Label>
              <Input id="name" defaultValue={user.displayName || ''} readOnly className="font-medium bg-secondary/50"/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2"><Mail className="h-4 w-4" /> Email Address</Label>
              <Input id="email" type="email" defaultValue={user.email || ''} readOnly className="font-medium bg-secondary/50" />
            </div>
            <div className="border-t border-border pt-6 flex justify-end">
                <Button variant="destructive" className="font-headline" onClick={handleSignOut}>
                    <LogOut className="mr-2" />
                    Sign Out
                </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
