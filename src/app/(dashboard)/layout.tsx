"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import styles from "./layout.module.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Setelah loading selesai, jika belum login, redirect ke halaman utama
    if (!isLoading && !isLoggedIn) {
      router.replace("/login");
    }
  }, [isLoggedIn, isLoading, router]);

  // Saat masih loading, tampilkan spinner
  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", width: "100vw", backgroundColor: "var(--bg-main)" }}>
        <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
          <p style={{ fontSize: 14 }}>Memuat...</p>
        </div>
      </div>
    );
  }

  // Jika belum login, jangan render apapun (akan redirect)
  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className={styles.layoutWrapper}>
      <Header />
      <div className={styles.mainContainer}>
        <div className={styles.contentWrapper}>
          <Sidebar />
          <main className={styles.mainContent}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
