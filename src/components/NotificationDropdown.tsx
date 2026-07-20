import React, { useState } from "react";
import { Bell } from "lucide-react";
import styles from "./NotificationDropdown.module.css";

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<"User" | "Shop">("User");

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.dropdown}>
        {/* Tabs */}
        <div className={styles.tabsContainer}>
          <button
            className={`${styles.tabBtn} ${activeTab === "User" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("User")}
          >
            User
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "Shop" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("Shop")}
          >
            Shop
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Bell size={40} color="#cbd5e1" />
            </div>
            <p className={styles.emptyText}>Tidak ada notifikasi</p>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.footerBtnLeft} onClick={onClose}>
            Lihat lebih banyak
          </button>
          <button className={styles.footerBtnRight} onClick={onClose}>
            Tandai dibaca semua
          </button>
        </div>
      </div>
    </>
  );
};
