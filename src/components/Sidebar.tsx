"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  CreditCard, 
  ShoppingBag, 
  Heart, 
  Wallet, 
  ArrowRightLeft, 
  Users, 
  Download, 
  User, 
  Lock,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import styles from "./Sidebar.module.css";

const menuItems = [
  { icon: <Home size={20} />, label: "Dashboard", href: "/dashboard" },
  { icon: <CreditCard size={20} />, label: "Riwayat Pembayaran", href: "/payment-history" },
  { icon: <ShoppingBag size={20} />, label: "Pembelian", href: "/pembelian" },
  { icon: <Heart size={20} />, label: "Wishlist", href: "/wishlist" },
  { icon: <Wallet size={20} />, label: "Deposit", href: "/deposit" },
  { icon: <ArrowRightLeft size={20} />, label: "Mutasi Saldo", href: "/mutasi-saldo" },
  { icon: <Users size={20} />, label: "Afiliasi", href: "/afiliasi" },
  { icon: <Download size={20} />, label: "Penarikan", href: "/penarikan" },
  { icon: <User size={20} />, label: "Profile", href: "/profile-settings" },
  { icon: <Lock size={20} />, label: "Security", href: "/security" },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const activeItem = menuItems.find(item => pathname.startsWith(item.href)) || menuItems[0];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.mobileDropdownToggle} onClick={() => setIsOpen(!isOpen)}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className={styles.icon}>{activeItem.icon}</span>
          <span className={styles.label} style={{ fontWeight: 600 }}>{activeItem.label}</span>
        </div>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>

      <nav className={`${styles.nav} ${isOpen ? styles.navOpen : ""}`}>
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`${styles.menuItem} ${isActive ? styles.active : ""}`}
              onClick={() => setIsOpen(false)}
            >
              <span className={styles.icon}>{item.icon}</span>
              <span className={styles.label}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
