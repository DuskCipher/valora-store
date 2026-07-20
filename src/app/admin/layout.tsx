"use client";

import React, { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { ShopHeader } from "@/components/ShopHeader";
import { supabase } from "@/lib/supabase";
import styles from "../(shop)/layout.module.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Run cleanup for expired 24h transactions in the background silently
    const runCleanup = async () => {
      try {
        await supabase.rpc("cancel_expired_transactions");
      } catch (err) {}
    };
    runCleanup();
  }, []);

  return (
    <div className={styles.layoutWrapper}>
      <AdminSidebar isCollapsed={isSidebarCollapsed} />
      
      <div className={styles.mainContainer}>
        <ShopHeader onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} hideCart={true} />
        <main className={styles.mainContent}>
          {children}
        </main>
      </div>
    </div>
  );
}
