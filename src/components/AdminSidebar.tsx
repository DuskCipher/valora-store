"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Wallet,
  Settings,
  CreditCard,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Image as ImageIcon
} from "lucide-react";
import { ValoraLogo } from "./ValoraLogo";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import styles from "./ShopSidebar.module.css";

const menuItems = [
  { id: "dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard", href: "/admin" },
  { id: "toko", icon: <ShoppingCart size={18} />, label: "Pendaftaran Toko", href: "/admin/toko" },
  { id: "banner", icon: <ImageIcon size={18} />, label: "Pengaturan Banner", href: "/admin/banner" },
  { id: "pesanan", icon: <ShoppingCart size={18} />, label: "Pesanan Platform", href: "/admin/pesanan" },
  { id: "keuangan", icon: <Wallet size={18} />, label: "Top Up & Keuangan", href: "/admin/keuangan" },
  { id: "rekening", icon: <CreditCard size={18} />, label: "Rekening Pembayaran", href: "/admin/rekening" },
  { id: "pengaturan", icon: <Settings size={18} />, label: "Pengaturan Admin", href: "/admin/pengaturan" },
];

interface AdminSidebarProps {
  isCollapsed?: boolean;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isCollapsed = false }) => {
  const pathname = usePathname();
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); 
    setExpandedMenus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}>
      {/* Logo Area */}
      <div className={styles.logoContainer}>
        <Link href="/" className={styles.logo}>
          <ValoraLogo size={24} isDark={theme === "dark"} />
          {!isCollapsed && <span className={styles.logoText}>Admin Pusat<span className={styles.logoAccent}>_</span></span>}
        </Link>
      </div>

      {/* Profile Area */}
      <div className={styles.profileContainer}>
        <div className={styles.profileHeader}>
          <div className={styles.avatarWrapper}>
            <img src={`https://ui-avatars.com/api/?name=${user?.name || "Admin"}&background=random`} alt="Avatar" className={styles.avatarImg} />
            <div className={styles.verifiedBadge}>
              <CheckCircle size={10} color="white" />
            </div>
          </div>
          {!isCollapsed && (
            <div className={styles.profileInfo}>
              <h3 className={styles.profileName}>{user?.name || "Super Admin"}</h3>
              <p className={styles.profileEmail}>{user?.email || "admin@valora.com"}</p>
              <p className={styles.profileBalance}>Admin Utama</p>
            </div>
          )}
        </div>
      </div>
      
      {!isCollapsed && <div className={styles.divider}></div>}

      {/* Menu Area */}
      {!isCollapsed && <p className={styles.menuLabel}>ADMIN MENU</p>}
      <nav className={styles.nav}>
        {menuItems.map((item) => {
          // Exact match for /admin, startsWith for others to highlight correctly
          const isActive = item.href === "/admin" 
            ? pathname === "/admin" 
            : pathname.startsWith(item.href);
            
          const hasSubItems = false; 
          const isExpanded = false;
          
          return (
            <div key={item.id} className={styles.menuGroup}>
              <Link
                href={item.href}
                className={`${styles.menuItem} ${isActive && !hasSubItems ? styles.active : ""}`}
                title={isCollapsed ? item.label : ""}
                onClick={hasSubItems ? (e) => toggleMenu(e, item.id) : undefined}
              >
                <span className={styles.icon}>{item.icon}</span>
                {!isCollapsed && <span className={styles.label}>{item.label}</span>}
                {!isCollapsed && hasSubItems && (
                  <span className={styles.arrow}>
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </span>
                )}
              </Link>
            </div>
          );
        })}
      </nav>
    </aside>
  );
};
