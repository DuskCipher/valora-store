"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShopSidebar } from "@/components/ShopSidebar";
import { ShopHeader } from "@/components/ShopHeader";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Clock } from "lucide-react";
import styles from "./layout.module.css";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { supabaseUser } = useAuth();
  
  const [storeStatus, setStoreStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!supabaseUser) {
        setIsLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('status')
          .eq('owner_id', supabaseUser.id)
          .single();
          
        if (data) {
          setStoreStatus(data.status || 'pending');
        } else {
          setStoreStatus(null);
        }
      } catch (err) {
        console.error("Error fetching store status:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStatus();
  }, [supabaseUser, pathname]); // Re-fetch on path change to ensure security

  // Redirect ke home jika belum login (setelah loading selesai)
  useEffect(() => {
    if (!isLoading && !supabaseUser) {
      router.replace("/login");
    }
  }, [isLoading, supabaseUser, router]);

  const isPengaturanPath = pathname.startsWith("/shop/pengaturan");
  
  // Show loading
  if (isLoading && !isPengaturanPath) {
    return (
      <div className={styles.layoutWrapper}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw' }}>
          <p>Memuat toko...</p>
        </div>
      </div>
    );
  }

  // If store is pending/rejected and user is not in pengaturan, block access
  const isBlocked = (storeStatus === 'pending' || storeStatus === 'rejected') && !isPengaturanPath;

  return (
    <div className={styles.layoutWrapper}>
      <ShopSidebar 
        isCollapsed={isSidebarCollapsed} 
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />
      
      <div className={styles.mainContainer}>
        <ShopHeader 
          onToggleSidebar={() => {
            // Desktop: collapse/expand; Mobile: open drawer
            setIsSidebarCollapsed(!isSidebarCollapsed);
            setIsMobileSidebarOpen(true);
          }} 
        />
        <main className={styles.mainContent}>
          {storeStatus === 'pending' && (
            <div style={{ backgroundColor: '#fffbeb', color: '#b45309', padding: '12px 24px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #fef3c7', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Clock size={20} />
              <span style={{ fontSize: '14px', fontWeight: 500 }}>Perubahan data toko Anda sedang ditinjau oleh Admin. Fitur toko tetap dapat digunakan.</span>
            </div>
          )}
          {storeStatus === 'rejected' && (
            <div style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '12px 24px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #fee2e2', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Clock size={20} />
              <span style={{ fontSize: '14px', fontWeight: 500 }}>Pendaftaran/Update toko Anda ditolak oleh Admin. Silakan periksa kembali data di Pengaturan Toko.</span>
            </div>
          )}
          
          {children}
        </main>
      </div>
    </div>
  );
}
