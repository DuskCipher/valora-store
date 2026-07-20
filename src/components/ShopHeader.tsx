"use client";

import React from "react";
import Link from "next/link";
import { Menu, Search, MessageSquare, ShoppingCart, Bell, Store } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import { ProfileDropdown } from "./ProfileDropdown";
import { CartDrawer } from "./CartDrawer";
import { NotificationDropdown } from "./NotificationDropdown";
import styles from "./ShopHeader.module.css";

interface ShopHeaderProps {
  onToggleSidebar: () => void;
  hideCart?: boolean;
}

export const ShopHeader: React.FC<ShopHeaderProps> = ({ onToggleSidebar, hideCart }) => {
  const { user, logout } = useAuth();
  const { totalCartItems } = useStore();
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [isCartOpen, setIsCartOpen] = React.useState(false);
  const [isNotifOpen, setIsNotifOpen] = React.useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <button className={styles.menuToggle} onClick={onToggleSidebar} aria-label="Toggle Sidebar">
          <Menu size={24} />
        </button>
      </div>

      <div className={styles.rightSection}>
        <Link href="/products" className={styles.exploreBtn}>
          Jelajahi Produk
        </Link>

        <div style={{ position: "relative" }}>
          <button 
            className={styles.iconBtn} 
            aria-label="Notifications"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
          >
            <Bell size={20} />
          </button>
          <NotificationDropdown 
            isOpen={isNotifOpen} 
            onClose={() => setIsNotifOpen(false)} 
          />
        </div>

        <button className={styles.iconBtn} aria-label="Messages">
          <MessageSquare size={20} />
          <span className={`${styles.badge} ${styles.badgeDanger}`}>3</span>
        </button>

        <Link href="/shop/dashboard" className={styles.iconBtn} aria-label="Toko Saya" title="Toko Saya">
          <Store size={20} />
        </Link>

        <div className={styles.profileContainer}>
          <button 
            className={styles.profileBtn} 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            aria-label="Profile Menu"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <span className={styles.avatar}>{user?.avatarFallback || "U"}</span>
            )}
          </button>
          
          <ProfileDropdown
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            onLogout={logout}
          />
        </div>
      </div>

      {!hideCart && <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />}
    </header>
  );
};
