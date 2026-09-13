"use client"

import { createContext, useContext, useEffect, useRef, useState, useMemo, type ReactNode } from "react"
import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export interface UserData {
  uid: string
  email: string
  username: string
  photoURL: string | null
  points: number
  fragments: number
  level: number
  totalEarned: number
  referredBy: string | null
  referralCode: string
  isAdmin: boolean
  isBanned: boolean
  createdAt: Date
  twoFactorEnabled: boolean
  twoFactorSecret?: string
  lastLoginIp?: string | null
  country?: string | null
  countryCode?: string | null
  ipAddress?: string | null
}

interface AuthContextType {
  user: User | null
  userData: UserData | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  register: (email: string, password: string, username: string, photoURL?: string, referralCode?: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateUserProfile: (username: string) => Promise<void>
  updateUserEmail: (newEmail: string) => Promise<void>
  updateUserPassword: (newPassword: string) => Promise<void>
  updateUserAvatar: (photoURL: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const redirectUrl = () => {
  if (process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL) return process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL
  if (typeof window !== "undefined") return `${window.location.origin}/auth/callback`
  return "/auth/callback"
}

function toUserData(user: User, profile: Record<string, unknown> | null): UserData {
  const metadata = user.user_metadata ?? {}
  return {
    uid: user.id,
    email: user.email ?? "",
    username: String(profile?.username ?? metadata.username ?? user.email?.split("@")[0] ?? "User"),
    photoURL: (profile?.photo_url ?? metadata.avatar_url ?? user.user_metadata?.picture ?? null) as string | null,
    points: Number(profile?.balance ?? profile?.mc ?? profile?.points ?? 0),
    fragments: Number(profile?.fragments ?? 0),
    level: Number(profile?.level ?? 1),
    totalEarned: Number(profile?.total_earned ?? 0),
    referredBy: (profile?.referred_by ?? null) as string | null,
    referralCode: String(profile?.referral_code ?? user.id),
    isAdmin: Boolean(profile?.is_admin ?? false),
    isBanned: Boolean(profile?.is_banned ?? false),
    createdAt: new Date(String(profile?.created_at ?? user.created_at)),
    twoFactorEnabled: Boolean(profile?.two_factor_enabled ?? false),
    twoFactorSecret: profile?.two_factor_secret as string | undefined,
    lastLoginIp: (profile?.last_login_ip ?? null) as string | null,
    country: (profile?.country ?? null) as string | null,
    countryCode: (profile?.country_code ?? null) as string | null,
    ipAddress: (profile?.ip_address ?? profile?.last_login_ip ?? null) as string | null,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => (typeof window !== "undefined" ? createClient() : null), [])
  const router = useRouter()
  const requireSupabase = () => {
    if (!supabase) throw new Error("Authentication is not configured for this preview.")
    return supabase
  }
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const fetchedUserId = useRef<string | null>(null)

  useEffect(() => {
    let mounted = true
    let loadingUserId: string | null = null

    const loadProfile = async (nextUser: User | null) => {
      if (!nextUser) {
        fetchedUserId.current = null
        if (mounted) { setUser(null); setUserData(null); setLoading(false) }
        return
      }
      if (fetchedUserId.current === nextUser.id || loadingUserId === nextUser.id) return
      loadingUserId = nextUser.id
      const { data } = await requireSupabase().from("profiles").select("*").eq("id", nextUser.id).maybeSingle()
      if (!mounted) return
      fetchedUserId.current = nextUser.id
      loadingUserId = null
      const nextData = toUserData(nextUser, data)
      setUser(nextUser)
      setUserData(nextData)
      setLoading(false)
      if (nextData.isBanned) router.replace("/banned")
    }

    if (!supabase) {
      setLoading(false)
      return () => { mounted = false }
    }

    const client = supabase
    client.auth.getSession()
      .then(({ data, error }) => {
        if (error) throw error
        return loadProfile(data.session?.user ?? null)
      })
      .catch(() => loadProfile(null))

    const { data: listener } = client.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") fetchedUserId.current = null
      void loadProfile(session?.user ?? null)
    })
    return () => { mounted = false; listener.subscription.unsubscribe() }
  }, [router, supabase])

  const login = async (email: string, password: string) => {
    const { error } = await requireSupabase().auth.signInWithPassword({ email, password })
    if (error) {
      const message = error.message.toLowerCase()
      if (message.includes("confirm")) throw new Error("Please confirm your email before signing in.")
      if (error.status === 429) throw new Error("Too many attempts. Please try again later.")
      throw new Error("Invalid email or password")
    }
  }

  const loginWithGoogle = async () => {
    const { error } = await requireSupabase().auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectUrl() } })
    if (error) throw error
  }

  const register = async (email: string, password: string, username: string, photoURL?: string, referralCode?: string) => {
    const { error } = await requireSupabase().auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl(), data: { username, avatar_url: photoURL ?? null, referral_code: referralCode ?? null } },
    })
    if (error) {
      const message = error.message.toLowerCase()
      if (message.includes("already") || message.includes("registered") || message.includes("exists")) {
        throw new Error("This email is already in use. Sign in with your existing method or use a different email.")
      }
      if (message.includes("password")) throw new Error("Choose a stronger password and try again.")
      throw new Error("Unable to create your account. Please try again.")
    }
  }

  const logout = async () => { await requireSupabase().auth.signOut(); router.replace("/login") }
  const resetPassword = async (email: string) => {
    const { error } = await requireSupabase().auth.resetPasswordForEmail(email, { redirectTo: redirectUrl() })
    if (error) throw error
  }

  const updateProfile = async (updates: Record<string, unknown>) => {
    if (!user) throw new Error("No user logged in")
    const { data, error } = await requireSupabase().from("profiles").update(updates).eq("id", user.id).select("*").single()
    if (error) throw error
    setUserData(toUserData(user, data))
  }

  const updateUserProfile = (username: string) => updateProfile({ username })
  const updateUserEmail = async (email: string) => { const { error } = await requireSupabase().auth.updateUser({ email }); if (error) throw error; await updateProfile({ email }) }
  const updateUserPassword = async (password: string) => { const { error } = await requireSupabase().auth.updateUser({ password }); if (error) throw error }
  const updateUserAvatar = (photoURL: string) => updateProfile({ photo_url: photoURL })

  return <AuthContext.Provider value={{ user, userData, loading, login, loginWithGoogle, register, logout, resetPassword, updateUserProfile, updateUserEmail, updateUserPassword, updateUserAvatar }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
