"use client";

import React, { useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import styles from "./page.module.css";
import sharedStyles from "../payment-history/page.module.css";

export default function AfiliasiPage() {
  const [activeTab, setActiveTab] = useState("Afiliasi");
  const tabs = ["Afiliasi", "S&K", "Cara Kerja"];

  return (
    <div className={sharedStyles.container}>
      <header className={sharedStyles.header}>
        <h1 className={sharedStyles.title}>Afiliasi</h1>
        <p className={sharedStyles.subtitle}>Dapatkan uang dengan merujuk orang ke situs kami</p>
      </header>

      <div className={styles.tabsContainer}>
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`${styles.tabBtn} ${activeTab === tab ? styles.activeTab : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className={styles.tabContent}>
        {activeTab === "Afiliasi" && (
          <div style={{ marginTop: '24px' }}>
            <EmptyState 
              title="Anda tidak memiliki Data" 
              description="Yeah, Anda belum memiliki Data afiliasi"
            />
          </div>
        )}
        
        {activeTab === "S&K" && (
          <div className={styles.textDocument}>
            <h3>Syarat & Ketentuan Afiliasi</h3>
            <p>Belum ada informasi syarat & ketentuan.</p>
          </div>
        )}
        
        {activeTab === "Cara Kerja" && (
          <div className={styles.textDocument}>
            <h3>Cara Kerja Sistem Afiliasi</h3>
            <p>Bagikan link referral Anda dan dapatkan komisi dari setiap transaksi.</p>
          </div>
        )}
      </div>
    </div>
  );
}
