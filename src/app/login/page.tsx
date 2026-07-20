"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function LoginPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading, login } = useAuth();

  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      router.replace("/");
    }
  }, [isLoggedIn, isLoading, router]);

  if (isLoading || isLoggedIn) return null;

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />
      <div style={{ flex: 1, backgroundColor: "var(--bg-main)", position: "relative" }}>
        <AuthModal 
          isOpen={true} 
          onClose={() => router.push("/")} 
          onLogin={() => {
            login();
            router.push("/");
          }} 
        />
      </div>
      <Footer />
    </main>
  );
}
