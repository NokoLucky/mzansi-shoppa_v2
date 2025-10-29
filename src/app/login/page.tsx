'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import ApiKeyCheck from '@/components/api-key-check';
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
import { handleAuthError } from '@/lib/auth-errors';

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.712,35.619,44,29.57,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signInWithGoogle, user, sendPasswordReset } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  useEffect(() => {
    if(user) {
      router.push('/profile');
    }
  }, [user, router]);

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      await signIn(email, password);
      router.push('/profile');
    } catch (error: any) {
      console.error(error);
      const userFriendlyError = handleAuthError(error);
      toast({
        title: "Sign In Failed",
        description: userFriendlyError,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
        await signInWithGoogle();
        router.push('/profile');
    } catch (error: any) {
        console.error("Google sign in failed", error);
        const userFriendlyError = handleAuthError(error);
        toast({
            title: "Google Sign In Failed",
            description: userFriendlyError,
            variant: "destructive"
        })
    } finally {
        setIsGoogleLoading(false);
    }
  }

  const handlePasswordReset = async () => {
    if (!resetEmail) {
        toast({ 
          title: "Email Required", 
          description: "Please enter your email address to reset your password.",
          variant: "destructive" 
        });
        return;
    }
    
    setIsResetting(true);
    try {
        await sendPasswordReset(resetEmail);
        toast({
            title: "Password Reset Email Sent!",
            description: `We've sent a password reset link to ${resetEmail}. Please check your inbox and follow the instructions.`,
        });
        setResetEmail('');
        setIsResetDialogOpen(false);
    } catch (error: any) {
        console.error("Password reset error:", error);
        const userFriendlyError = handleAuthError(error);
        toast({
            title: "Reset Failed",
            description: userFriendlyError,
            variant: "destructive"
        });
    } finally {
        setIsResetting(false);
    }
  };

  const handleResetDialogOpen = (open: boolean) => {
    setIsResetDialogOpen(open);
    if (!open) {
      setResetEmail('');
    }
  };

  return (
    <ApiKeyCheck>
        <div className="relative flex min-h-screen items-center justify-center p-4">
        <Image
            src="/logos/img/login_bg3.avif"
            alt="A vibrant grocery store aisle with shelves stocked with products."
            fill
            sizes="100vw"
            className="object-cover -z-10"
            data-ai-hint="grocery aisle"
        />

        <div className="absolute inset-0 bg-black/60" />
        <Card className="relative z-10 mx-auto w-full max-w-sm shadow-lg border-primary/20 bg-background/95 backdrop-blur-sm">
            <CardHeader className="text-center">
            <CardTitle className="text-3xl font-headline text-gradient-animated pb-2">Welcome Back</CardTitle>
            <CardDescription>Sign in to your Mzansi Shoppa account</CardDescription>
            </CardHeader>
            <CardContent>
            <form onSubmit={handleSignIn}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                      id="email" 
                      type="email" 
                      placeholder="m@example.com" 
                      required 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading || isGoogleLoading}
                      />
                  </div>
                  <div className="grid gap-2">
                      <div className="flex items-center">
                      <Label htmlFor="password">Password</Label>
                        <AlertDialog open={isResetDialogOpen} onOpenChange={handleResetDialogOpen}>
                            <AlertDialogTrigger asChild>
                                <Button variant="link" type="button" className="ml-auto inline-block text-sm underline p-0 h-auto">
                                    Forgot your password?
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Reset Your Password</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Enter your email address and we'll send you a link to reset your password.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="reset-email">Email Address</Label>
                                        <Input
                                            id="reset-email"
                                            type="email"
                                            placeholder="you@example.com"
                                            value={resetEmail}
                                            onChange={(e) => setResetEmail(e.target.value)}
                                            disabled={isResetting}
                                            autoFocus
                                        />
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        You'll receive an email with a link to create a new password.
                                    </p>
                                </div>
                                <AlertDialogFooter>
                                <AlertDialogCancel disabled={isResetting}>
                                    Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={handlePasswordReset} 
                                  disabled={isResetting || !resetEmail}
                                >
                                    {isResetting ? (
                                      <>
                                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        Sending...
                                      </>
                                    ) : (
                                      'Send Reset Link'
                                    )}
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      <Input 
                      id="password" 
                      type="password" 
                      required 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading || isGoogleLoading}
                      />
                  </div>
                  <Button type="submit" className="w-full font-headline" loading={isLoading} disabled={isGoogleLoading}>
                      Sign In
                  </Button>
                </div>
            </form>
             <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                    </span>
                </div>
            </div>
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} loading={isGoogleLoading} disabled={isLoading}>
                <GoogleIcon />
                Sign in with Google
            </Button>
            <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="underline">
                Sign up
                </Link>
            </div>
            </CardContent>
        </Card>
        </div>
    </ApiKeyCheck>
  );
}