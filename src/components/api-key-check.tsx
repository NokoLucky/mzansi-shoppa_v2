
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

const ApiKeyCheck = ({ children }: { children: React.ReactNode }) => {
    // In a real app, you might want a more robust check, but this is fine for development.
    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'undefined') {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-background">
            <Card className="w-full max-w-lg mx-auto shadow-lg border-destructive/50">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <AlertTriangle className="h-12 w-12 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl font-headline text-destructive">
                        Configuration Error
                    </CardTitle>
                    <CardDescription>
                        Your Firebase API Key is missing or invalid.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                    <p>
                        The application cannot connect to Firebase because the API key is not configured correctly. This is a required step to enable user authentication and data storage.
                    </p>
                    <p>
                        <strong>To fix this:</strong>
                    </p>
                    <ol className="list-decimal list-inside space-y-2 bg-secondary p-4 rounded-md">
                        <li>
                            Go to your Firebase project settings.
                        </li>
                        <li>
                            Under the "General" tab, find your project's "Web API Key".
                        </li>
                        <li>
                            Open the <code className="bg-muted px-1 py-0.5 rounded-sm font-semibold">.env</code> file in the file explorer on the left.
                        </li>
                        <li>
                            Add your Firebase project credentials to the <code className="bg-muted px-1 py-0.5 rounded-sm font-semibold">.env</code> file. The names must be an exact match (e.g., <code className="bg-muted px-1 py-0.5 rounded-sm font-semibold">NEXT_PUBLIC_FIREBASE_API_KEY</code>).
                        </li>
                    </ol>
                    <p>
                        After adding the keys, please restart the application for the changes to take effect.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default ApiKeyCheck;
