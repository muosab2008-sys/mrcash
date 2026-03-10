"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "./firebase/config";
import type { User } from "./types";

interface AuthContextType {
  user: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    name: string,
    avatar: string
  ) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Fetch user data from Firestore
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as User;
          setUserData(data);

          // Check if user is admin
          const settingsDoc = await getDoc(doc(db, "settings", "global"));
          if (settingsDoc.exists()) {
            const settings = settingsDoc.data();
            setIsAdmin(
              settings.adminEmails?.includes(firebaseUser.email) || false
            );
          }
        }
      } else {
        setUserData(null);
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    avatar: string
  ) => {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Create user document in Firestore
    const newUser: User = {
      id: credential.user.uid,
      email,
      name,
      avatar,
      country: "US",
      createdAt: Timestamp.now(),
      totalEarnings: 0,
      availableBalance: 0,
      completedOffers: 0,
      referredUsers: 0,
      referralCode: generateReferralCode(),
      isPrivate: false,
      notificationsEnabled: true,
    };

    await setDoc(doc(db, "users", credential.user.uid), newUser);
    setUserData(newUser);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(auth, provider);

    // Check if user document exists
    const userDoc = await getDoc(doc(db, "users", credential.user.uid));
    if (!userDoc.exists()) {
      // Create new user document
      const newUser: User = {
        id: credential.user.uid,
        email: credential.user.email || "",
        name: credential.user.displayName || "User",
        avatar: "avatar-1",
        country: "US",
        createdAt: Timestamp.now(),
        totalEarnings: 0,
        availableBalance: 0,
        completedOffers: 0,
        referredUsers: 0,
        referralCode: generateReferralCode(),
        isPrivate: false,
        notificationsEnabled: true,
      };

      await setDoc(doc(db, "users", credential.user.uid), newUser);
      setUserData(newUser);
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setUserData(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
