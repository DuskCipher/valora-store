"use client";

import React from "react";
import Link from "next/link";
import { Facebook, Instagram, Twitter, Mail, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { ValoraLogo } from "./ValoraLogo";
import styles from "./Footer.module.css";

// Custom dark mode icon matching user's reference image (red L-shape)
const DarkModeIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 4 H88 Q96 4 96 12 V48 Q96 56 88 56 H62 Q52 56 52 66 V88 Q52 96 44 96 H12 Q4 96 4 88 V12 Q4 4 12 4 Z"
      fill="#D42B2B"
      rx="8"
    />
  </svg>
);

export const Footer: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Brand Section */}
        <div className={styles.brandSection}>
          <div className={styles.logoContainer}>
            <ValoraLogo size={40} isDark={theme === "dark"} />
            <div className={styles.logoText} style={{ marginLeft: '12px' }}>
              Valora Store<span className={styles.logoAccent}>_</span>
            </div>
          </div>
          <p className={styles.description}>
            Valora Store adalah platform pasar digital yang menghubungkan pembeli dan penjual. Kami menyediakan platform bagi penjual untuk menjual produk mereka dan pembeli untuk menemukan produk yang mereka butuhkan.
          </p>
          <div className={styles.socialLinks}>
            <Link href="#" className={styles.socialIcon} aria-label="Facebook">
              <Facebook size={20} />
            </Link>
            <Link href="#" className={styles.socialIcon} aria-label="Instagram">
              <Instagram size={20} />
            </Link>
            <Link href="#" className={styles.socialIcon} aria-label="Twitter">
              <Twitter size={20} />
            </Link>
          </div>
        </div>

        {/* Links Section */}
        <div className={styles.linksSection}>
          <div className={styles.linkGroup}>
            <h3 className={styles.linkTitle}>Indeks</h3>
            <div className={styles.linkList}>
              <Link href="#" className={styles.linkItem}>Home</Link>
              <Link href="#" className={styles.linkItem}>Products</Link>
              <Link href="#" className={styles.linkItem}>Shop area</Link>
              <Link href="#" className={styles.linkItem}>Ppob</Link>
              <Link href="#" className={styles.linkItem}>Top Shop</Link>
            </div>
          </div>
          <div className={styles.linkGroup}>
            <h3 className={styles.linkTitle}>Tambahan</h3>
            <div className={styles.linkList}>
              <Link href="/contact-us" className={styles.linkItem}>Contact Us</Link>
              <Link href="/help/privacy" className={styles.linkItem}>Privacy</Link>
              <Link href="/help/terms" className={styles.linkItem}>Terms</Link>
              <Link href="#" className={styles.linkItem}>Blog</Link>
              <Link href="/help/affiliate" className={styles.linkItem}>Affiliate</Link>
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className={styles.newsletterSection}>
          <h3 className={styles.newsletterTitle}>Newsletter</h3>
          <p className={styles.newsletterDesc}>
            Get the latest news and updates from us by subscribing to our newsletter.
          </p>
          <form className={styles.subscribeForm} onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="Email Address" 
              className={styles.subscribeInput} 
              required
            />
            <button type="submit" className={styles.subscribeBtn}>
              <Mail size={16} /> Langganan
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className={styles.bottomBar}>
        <div className={styles.copyright}>
          <span>© Copyright 2026 PT VALORA NUSANTARA TECHWORK 2.1.</span>
          <span>Dengan menggunakan layanan kami, Anda menyetujui Syarat Layanan dan Kebijakan Privasi.</span>
        </div>
        <button className={styles.themeToggle} onClick={toggleTheme} aria-label="Toggle dark mode">
          {theme === "light" ? (
            <DarkModeIcon size={22} />
          ) : (
            <Sun size={20} color="#fbbf24" />
          )}
        </button>
      </div>
    </footer>
  );
};
