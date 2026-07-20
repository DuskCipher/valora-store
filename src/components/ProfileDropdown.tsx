"use client";

import React from "react";
import Link from "next/link";
import { User, ShoppingBag, Heart, CreditCard, LogOut } from "lucide-react";
import styles from "./ProfileDropdown.module.css";

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ isOpen, onClose, onLogout }) => {
  if (!isOpen) return null;

  const menuItems = [
    { icon: <User size={18} />, label: "Dashboard / Profile", href: "/dashboard" },
    { icon: <ShoppingBag size={18} />, label: "Purchase History", href: "/pembelian" },
    { icon: <Heart size={18} />, label: "Wishlist", href: "/wishlist" },
    { icon: <CreditCard size={18} />, label: "Riwayat Pembayaran", href: "/payment-history" },
  ];

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.dropdown}>
        {menuItems.map((item, idx) => (
          <Link key={idx} href={item.href} className={styles.menuItem} onClick={onClose}>
            {item.icon}
            {item.label}
          </Link>
        ))}
        <div className={styles.divider} />
        <button
          className={`${styles.menuItem} ${styles.logoutItem}`}
          onClick={() => {
            onLogout();
            onClose();
          }}
        >
          <LogOut size={18} />
          Keluar
        </button>
      </div>
    </>
  );
};
