"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Plus,
  Package,
  Gift,
  ShoppingBag,
  Star,
  ArrowRightLeft,
  Download,
  Settings,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  X,
  MessageSquare
} from "lucide-react";
import { ValoraLogo } from "./ValoraLogo";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import styles from "./ShopSidebar.module.css";

const menuItems = [
  { id: "dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard", href: "/shop/dashboard" },
  { id: "tambah-produk", icon: <Plus size={18} />, label: "Tambah Produk", href: "/shop/tambah-produk" },
  { id: "produk-anda", icon: <Package size={18} />, label: "Produk Anda", href: "/shop/produk" },
  { id: "chat-pembeli", icon: <MessageSquare size={18} />, label: "Chat Pembeli", href: "/shop/chat" },
  { 
    id: "program-produk", 
    icon: <Gift size={18} />, 
    label: "Program Produk", 
    href: "/shop/program-produk", 
    subItems: [
      { label: "Diskon", href: "/shop/program-produk/diskon" },
      { label: "Other Promo", href: "/shop/program-produk/other-promo" },
    ]
  },
  { id: "penjualan", icon: <ShoppingBag size={18} />, label: "Penjualan", href: "/shop/penjualan" },
  { id: "ulasan", icon: <Star size={18} />, label: "Ulasan", href: "/shop/ulasan" },
  { id: "mutasi-saldo", icon: <ArrowRightLeft size={18} />, label: "Mutasi Saldo", href: "/shop/mutasi-saldo" },
  { id: "penarikan", icon: <Download size={18} />, label: "Penarikan", href: "/shop/penarikan" },
  { 
    id: "pengaturan", 
    icon: <Settings size={18} />, 
    label: "Pengaturan Toko", 
    href: "/shop/pengaturan", 
    subItems: [
      { label: "Informasi Dasar", href: "/shop/pengaturan/informasi" },
      { label: "Alamat", href: "/shop/pengaturan/alamat" },
      { label: "Rekening Bank Penarikan", href: "/shop/pengaturan/rekening" },
    ]
  },
];

interface ShopSidebarProps {
  isCollapsed?: boolean;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const ShopSidebar: React.FC<ShopSidebarProps> = ({ 
  isCollapsed = false,
  isMobileOpen = false,
  onMobileClose
}) => {
  const pathname = usePathname();
  const { theme } = useTheme();
  const { user, supabaseUser } = useAuth();
  
  // State for expanded menus
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    "program-produk": false,
    "pengaturan": false,
  });

  // Auto-expand menu if a sub-item is active on mount or path change
  useEffect(() => {
    setExpandedMenus(prev => {
      const next = { ...prev };
      let changed = false;
      menuItems.forEach(item => {
        if (item.subItems && item.subItems.some(sub => pathname === sub.href)) {
          if (!next[item.id]) {
            next[item.id] = true;
            changed = true;
          }
        }
      });
      return changed ? next : prev;
    });
  }, [pathname]);

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setExpandedMenus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const [storeBalance, setStoreBalance] = useState(0);

  useEffect(() => {
    const fetchStoreBalance = async () => {
      if (!user || !supabaseUser) return;
      try {
        const { data } = await supabase
          .from("stores")
          .select("balance")
          .eq("owner_id", supabaseUser.id)
          .single();
        if (data) {
          setStoreBalance(data.balance || 0);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchStoreBalance();
  }, [user, supabaseUser]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price).replace(/\s/g, "");

  const handleMenuLinkClick = () => {
    // Tutup mobile sidebar saat menu diklik
    if (onMobileClose) onMobileClose();
  };

  const effectiveIsCollapsed = isMobileOpen ? false : isCollapsed;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className={styles.mobileOverlay} onClick={onMobileClose} />
      )}

      <aside className={`${styles.sidebar} ${effectiveIsCollapsed ? styles.collapsed : ""} ${isMobileOpen ? styles.mobileOpen : ""}`}>
        {/* Mobile Close Button */}
        <button className={styles.mobileCloseBtn} onClick={onMobileClose} aria-label="Tutup Sidebar">
          <X size={20} />
        </button>

        {/* Logo Area */}
        <div className={styles.logoContainer}>
          <Link href="/" className={styles.logo}>
            <ValoraLogo size={24} isDark={theme === "dark"} />
            {!effectiveIsCollapsed && <span className={styles.logoText}>Valora Store<span className={styles.logoAccent}>_</span></span>}
          </Link>
        </div>

        {/* Profile Area */}
        <div className={styles.profileContainer}>
          <div className={styles.profileHeader}>
            <div className={styles.avatarWrapper}>
              <img src={`https://ui-avatars.com/api/?name=${user?.name || "User"}&background=random`} alt="Avatar" className={styles.avatarImg} />
              <div className={styles.verifiedBadge}>
                <CheckCircle size={10} color="white" />
              </div>
            </div>
            {!effectiveIsCollapsed && (
              <div className={styles.profileInfo}>
                <h3 className={styles.profileName}>{user?.name || "Nama Pengguna"}</h3>
                <p className={styles.profileEmail}>{user?.email || "email@contoh.com"}</p>
                <p className={styles.profileBalance}>{formatPrice(storeBalance)}</p>
              </div>
            )}
          </div>
          {!effectiveIsCollapsed && (
            <div className={styles.penaltyBadge}>
              Penalty : <span className={styles.noPenalty}>No Penalty</span>
            </div>
          )}
        </div>
        
        {!effectiveIsCollapsed && <div className={styles.divider}></div>}

        {/* Menu Area */}
        {!effectiveIsCollapsed && <p className={styles.menuLabel}>MENU</p>}
        <nav className={styles.nav}>
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.subItems && item.subItems.some(sub => pathname === sub.href));
            const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
            const isExpanded = expandedMenus[item.id];
            
            return (
              <div key={item.id} className={styles.menuGroup}>
                <Link
                  href={item.href}
                  className={`${styles.menuItem} ${isActive && !hasSubItems ? styles.active : ""}`}
                  title={effectiveIsCollapsed ? item.label : ""}
                  onClick={hasSubItems ? (e) => toggleMenu(e, item.id) : handleMenuLinkClick}
                >
                  <span className={styles.icon}>{item.icon}</span>
                  {!effectiveIsCollapsed && <span className={styles.label}>{item.label}</span>}
                  {!effectiveIsCollapsed && hasSubItems && (
                    <span className={styles.arrow}>
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                  )}
                </Link>
                
                {/* Submenu Items */}
                {!effectiveIsCollapsed && hasSubItems && isExpanded && (
                  <div className={styles.subMenuContainer}>
                    {item.subItems?.map((sub, idx) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link 
                          key={idx} 
                          href={sub.href}
                          className={`${styles.subMenuItem} ${isSubActive ? styles.subActive : ""}`}
                          onClick={handleMenuLinkClick}
                        >
                          {sub.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
