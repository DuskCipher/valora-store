"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./layout.module.css";

export default function PengaturanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    { name: "Informasi Dasar", href: "/shop/pengaturan/informasi" },
    { name: "Alamat", href: "/shop/pengaturan/alamat" },
    { name: "Rekening Bank Penarikan", href: "/shop/pengaturan/rekening" },
  ];

  // In screenshot 1, there are no tabs, but the sidebar says Pengaturan Toko -> Informasi Dasar.
  // In screenshot 2 and 3, the title is "Alamat" or "Rekening Bank Penarikan" and there are tabs.
  // Let's deduce the page title from the current path.
  let pageTitle = "Pengaturan Toko";
  if (pathname.includes("/alamat")) pageTitle = "Alamat";
  if (pathname.includes("/rekening")) pageTitle = "Rekening Bank Penarikan";
  if (pathname.includes("/informasi")) pageTitle = "Informasi Dasar"; // but no tabs in screenshot 1?
  
  // Actually I will just show tabs on all pages for consistency, as per screenshots 2 and 3.
  // Or hide tabs on Informasi? Let's just show them if it's not the exact root.
  
  return (
    <div className={styles.layoutContainer}>
      <h1 className={styles.pageTitle}>{pageTitle}</h1>

      <div className={styles.tabsContainer}>
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`${styles.tabLink} ${
                pathname === tab.href ? styles.tabLinkActive : ""
              }`}
            >
              {tab.name}
            </Link>
          ))}
        </div>

      <div className={styles.contentArea}>
        {children}
      </div>
    </div>
  );
}
