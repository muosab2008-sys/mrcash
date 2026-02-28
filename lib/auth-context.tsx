"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  type User,
} from "./firebase";

interface AuthContextType {
  user: User | null;
  balance: number;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  balance: 0,
  loading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Create user doc if it doesn't exist
        const userRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
          await setDoc(userRef, {
            displayName: firebaseUser.displayName || "User",
            email: firebaseUser.email || "",
            photoURL: firebaseUser.photoURL || "",
            balance: 0,
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        setUser(null);
        setBalance(0);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Real-time balance listener
  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const newBalance = data.balance || 0;
        // Check if balance increased for notification
        if (newBalance > balance && balance > 0) {
          window.dispatchEvent(
            new CustomEvent("balance-increased", {
              detail: { amount: newBalance - balance },
            })
          );
        }
        setBalance(newBalance);
      }
    });
    return () => unsubscribe();
  }, [user, balance]);

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{ user, balance, loading, signInWithGoogle, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
