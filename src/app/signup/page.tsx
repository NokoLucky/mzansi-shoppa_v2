'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import ApiKeyCheck from '@/components/api-key-check';
import { handleAuthError } from '@/lib/auth-errors';

export default function SignupPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Basic client-side validation
    if (!fullName.trim()) {
      toast({
        title: "Full Name Required",
        description: "Please enter your full name.",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password should be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await signUp(email, password, fullName);
      toast({
        title: "Account Created Successfully!",
        description: "Welcome to Mzansi Shoppa! You are now being redirected.",
      });
      router.push('/profile');
    } catch (error: any) {
        console.error("Signup error:", error);
        const userFriendlyError = handleAuthError(error);
        toast({
            title: "Sign Up Failed",
            description: userFriendlyError,
            variant: "destructive"
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <ApiKeyCheck>
        <div className="relative flex min-h-screen items-center justify-center p-4">
        <Image
            src="/logos/img/login_bg.avif"
            alt="A vibrant grocery store aisle with shelves stocked with products."
            fill
            sizes="100vw"
            className="object-cover -z-10"
            data-ai-hint="grocery aisle"
        />
        <div className="absolute inset-0 bg-black/60" />
        <Card className="relative z-10 mx-auto w-full max-w-sm shadow-lg border-primary/20 bg-background/95 backdrop-blur-sm">
            <CardHeader className="text-center">
            <CardTitle className="text-3xl font-headline text-gradient-animated pb-2">Create an Account</CardTitle>
            <CardDescription>Join Mzansi Shoppa and start saving today</CardDescription>
            </CardHeader>
            <CardContent>
            <form onSubmit={handleSignUp}>
                <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="full-name">Full Name</Label>
                    <Input 
                    id="full-name" 
                    placeholder="John Doe" 
                    required 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isLoading}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                    id="email" 
                    type="email" 
                    placeholder="m@example.com" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                      minLength={6}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Password must be at least 6 characters long
                    </p>
                </div>
                <Button type="submit" className="w-full font-headline" loading={isLoading}>
                    Create an Account
                </Button>
                </div>
            </form>
            <div className="mt-4 text-center text-sm">
                Already have an account?{' '}
                <Link href="/login" className="underline">
                Sign in
                </Link>
            </div>
            </CardContent>
        </Card>
        </div>
    </ApiKeyCheck>
  );
}