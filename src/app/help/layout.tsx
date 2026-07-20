"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import styles from "./layout.module.css";

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />
      <div className={styles.container}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Toko</h3>
            <div className={styles.linkList}>
              <Link
                href="/help/toko/membuat-toko"
                className={`${styles.link} ${pathname === "/help/toko/membuat-toko" ? styles.activeLink : ""}`}
              >
                Membuat Toko
              </Link>
              <Link
                href="/help/toko/cara-upload-produk"
                className={`${styles.link} ${pathname === "/help/toko/cara-upload-produk" ? styles.activeLink : ""}`}
              >
                Cara Upload Produk
              </Link>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>General</h3>
            <div className={styles.linkList}>
              <Link
                href="/help/privacy"
                className={`${styles.link} ${pathname === "/help/privacy" ? styles.activeLink : ""}`}
              >
                Privacy Policy
              </Link>
              <Link
                href="/help/terms"
                className={`${styles.link} ${pathname === "/help/terms" ? styles.activeLink : ""}`}
              >
                Syarat Layanan
              </Link>
              <Link
                href="/help/affiliate"
                className={`${styles.link} ${pathname === "/help/affiliate" ? styles.activeLink : ""}`}
              >
                Affiliasi
              </Link>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className={styles.content}>
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}
