
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth, User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithCredential,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getFirebaseInstances } from '@/lib/firebase';
import { Capacitor } from '@capacitor/core';


interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, pass: string, fullName: string) => Promise<void>;
  signIn: (email: string, pass: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to create or update user document in Firestore
const updateUserDocument = async (db: Firestore, user: User) => {
  const userDocRef = doc(db, 'users', user.uid);
  const docSnap = await getDoc(userDocRef);
  if (!docSnap.exists()) {
    await setDoc(userDocRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: new Date().toISOString(),
      savedLists: []
    }, { merge: true });
  }
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [services, setServices] = useState<FirebaseServices | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGoogleAuthInitialized, setIsGoogleAuthInitialized] = useState(false);


  useEffect(() => {
    // Initialize Firebase on the client side
    const initFirebase = async () => {
        try {
            const instances = getFirebaseInstances();
            if (instances) {
                setServices(instances);

                if (Capacitor.isNativePlatform() && !isGoogleAuthInitialized) {
                    const googleAuthPlugin = '@codetrix-studio/capacitor-google-auth';
                    const { GoogleAuth } = await import(/* @vite-ignore */ googleAuthPlugin);

                    GoogleAuth.initialize({
                        clientId: process.env.NEXT_PUBLIC_IOS_CLIENT_ID,
                        scopes: ['profile', 'email'],
                        grantOfflineAccess: true,
                    });
                    setIsGoogleAuthInitialized(true);
                }
                
                const unsubscribe = onAuthStateChanged(instances.auth, (user) => {
                    setUser(user);
                    setLoading(false);
                });

                return () => unsubscribe();
            }
        } catch (error) {
            console.error("Firebase Init Error:", error);
            setLoading(false);
        }
    };
    initFirebase();
  }, [isGoogleAuthInitialized]);

  const signUp = async (email: string, pass: string, fullName: string) => {
    if (!services) throw new Error("Firebase not initialized");
    const { auth, db } = services;

    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const firebaseUser = userCredential.user;
    
    await updateProfile(firebaseUser, { displayName: fullName });
    
    await updateUserDocument(db, { ...firebaseUser, displayName: fullName });
    
    setUser({ ...firebaseUser, displayName: fullName });
  };

  const signIn = async (email: string, pass: string) => {
    if (!services) throw new Error("Firebase not initialized");
    await signInWithEmailAndPassword(services.auth, email, pass);
  };

  const sendPasswordReset = async (email: string) => {
    if (!services) throw new Error("Firebase not initialized");
    await sendPasswordResetEmail(services.auth, email);
  };

  const signInWithGoogle = async () => {
    if (!services) throw new Error("Firebase not initialized");
    const { auth, db } = services;

    try {
        if (Capacitor.isNativePlatform()) {
            const googleAuthPlugin = '@codetrix-studio/capacitor-google-auth';
            const { GoogleAuth } = await import(/* @vite-ignore */ googleAuthPlugin);
            const googleUser = await GoogleAuth.signIn();
            const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
            const userCredential = await signInWithCredential(auth, credential);
            await updateUserDocument(db, userCredential.user);
        } else {
            // Fallback to web-based popup
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            await updateUserDocument(db, result.user);
        }
    } catch (error: any) {
        if (error.code === 'auth/popup-closed-by-user' || error.message.includes('popup-closed-by-user')) {
            console.log("Google Sign-In cancelled by user.");
            return;
        }
        console.error("Google Sign-In Error:", error);
        throw error;
    }
  };


  const signOut = async () => {
    if (!services) throw new Error("Firebase not initialized");

    if (Capacitor.isNativePlatform() && isGoogleAuthInitialized) {
        try {
            const googleAuthPlugin = '@codetrix-studio/capacitor-google-auth';
            const { GoogleAuth } = await import(/* @vite-ignore */ googleAuthPlugin);
            await GoogleAuth.signOut();
        } catch (error) {
            console.error("Native Google sign out failed", error);
        }
    }
    
    await firebaseSignOut(services.auth);
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    sendPasswordReset,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
