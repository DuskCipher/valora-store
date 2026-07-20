"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

interface AuthContextType {
  isLoggedIn: boolean;
  user: {
    name: string;
    email: string;
    avatar: string;
    avatarFallback: string;
  } | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  login: () => void;
  logout: () => void;
  isLoading: boolean;
  hasStore: boolean | null;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasStore, setHasStore] = useState<boolean | null>(null);
  const [userProfile, setUserProfile] = useState<{ full_name?: string; avatar_url?: string } | null>(null);

  const checkUserStore = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', userId)
        .single();
      
      if (data && data.id) {
        setHasStore(true);
      } else {
        setHasStore(false);
      }
    } catch (e) {
      setHasStore(false);
    }
  };

  useEffect(() => {
    // Get the current session on mount
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        await checkUserStore(session.user.id);
        // Fetch profile
        const { data: profileData } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', session.user.id).single();
        setUserProfile(profileData);
      } else {
        setHasStore(null);
        setUserProfile(null);
      }
      setIsLoading(false);
    };

    getSession();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setSupabaseUser(session?.user ?? null);
        if (session?.user) {
          await checkUserStore(session.user.id);
          const { data: profileData } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', session.user.id).single();
          setUserProfile(profileData);
        } else {
          setHasStore(null);
          setUserProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const isLoggedIn = !!session;

  const user = supabaseUser
    ? {
        name: userProfile?.full_name || supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email?.split("@")[0] || "User",
        email: supabaseUser.email || "",
        avatar: userProfile?.avatar_url || "",
        avatarFallback: (userProfile?.full_name || supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email || "U")
          .substring(0, 2)
          .toUpperCase(),
      }
    : null;

  const login = () => {
    // This is now handled by Supabase auth state listener automatically
    // We keep this function for backward compatibility with AuthModal's onLogin callback
  };

  const refreshProfile = async () => {
    if (supabaseUser) {
      const { data: profileData } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', supabaseUser.id).single();
      setUserProfile(profileData);
      await checkUserStore(supabaseUser.id);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setSupabaseUser(null);
    setHasStore(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, supabaseUser, session, login, logout, isLoading, hasStore, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

