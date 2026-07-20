"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Plus, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import styles from "./page.module.css";
import sharedStyles from "../payment-history/page.module.css";

export default function DepositPage() {
  const router = useRouter();
  const { supabaseUser } = useAuth();

  const [activeTab, setActiveTab] = useState("Deposit");
  const tabs = ["Deposit", "Riwayat Deposit"];
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    if (supabaseUser) {
      fetchData();
    }
  }, [supabaseUser]);

  const fetchData = async () => {
    setIsLoading(true);
    // Fetch balance
    const { data: profile } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", supabaseUser?.id)
      .single();
    if (profile) setBalance(profile.balance || 0);

    // Fetch history
    const { data: txs } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", supabaseUser?.id)
      .eq("type", "topup")
      .order("created_at", { ascending: false });
    
    if (txs) setHistory(txs);
    setIsLoading(false);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price).replace(/\s/g, "");

  const totalMasuk = history.filter(t => t.status === 'approved').reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className={sharedStyles.container}>
      <header className={sharedStyles.header}>
        <h1 className={sharedStyles.title}>Deposit</h1>
        <p className={sharedStyles.subtitle}>Kelola saldo deposit Anda</p>
      </header>

      {/* Balance Card */}
      <div className={styles.balanceCard}>
        <div className={styles.balanceInfo}>
          <div className={styles.balanceIcon}>
            <Wallet size={24} color="white" />
          </div>
          <div>
            <p className={styles.balanceLabel}>Saldo Anda</p>
            <h2 className={styles.balanceAmount}>{formatPrice(balance)}</h2>
          </div>
        </div>
        <div className={styles.balanceActions}>
          <button className={styles.depositBtn} onClick={() => router.push("/topup")}>
            <Plus size={16} /> Top Up
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
            <ArrowDownLeft size={18} />
          </div>
          <div>
            <p className={styles.statLabel}>Total Masuk (Sukses)</p>
            <p className={styles.statValue}>{formatPrice(totalMasuk)}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconRed}`}>
            <ArrowUpRight size={18} />
          </div>
          <div>
            <p className={styles.statLabel}>Total Keluar (Ditolak)</p>
            <p className={styles.statValue}>{formatPrice(history.filter(t => t.status === 'rejected').reduce((acc, t) => acc + t.amount, 0))}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
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
        {activeTab === "Riwayat Deposit" || activeTab === "Deposit" ? (
          history.length > 0 ? (
            <div style={{ background: "var(--bg-card)", borderRadius: 8, border: "1px solid var(--border-color)", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--bg-main)" }}>
                    <th style={{ padding: 16, borderBottom: "1px solid var(--border-color)", fontSize: 13, color: "var(--text-muted)" }}>Tanggal</th>
                    <th style={{ padding: 16, borderBottom: "1px solid var(--border-color)", fontSize: 13, color: "var(--text-muted)" }}>Nominal</th>
                    <th style={{ padding: 16, borderBottom: "1px solid var(--border-color)", fontSize: 13, color: "var(--text-muted)" }}>Metode</th>
                    <th style={{ padding: 16, borderBottom: "1px solid var(--border-color)", fontSize: 13, color: "var(--text-muted)" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(t => (
                    <tr key={t.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: 16, fontSize: 14 }}>{new Date(t.created_at).toLocaleString('id-ID')}</td>
                      <td style={{ padding: 16, fontWeight: "600", color: "var(--primary)" }}>+ {formatPrice(t.amount)}</td>
                      <td style={{ padding: 16, fontSize: 14 }}>{t.payment_method || "Bank Transfer"}</td>
                      <td style={{ padding: 16 }}>
                        <span style={{ 
                          padding: "4px 8px", 
                          borderRadius: 4, 
                          backgroundColor: t.status === 'approved' ? '#d1fae5' : t.status === 'rejected' ? '#fee2e2' : '#f3f4f6',
                          color: t.status === 'approved' ? '#065f46' : t.status === 'rejected' ? '#991b1b' : '#374151',
                          fontWeight: "bold",
                          fontSize: 12
                        }}>
                          {t.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState 
              title="Anda tidak memiliki Data" 
              description="Yeah, Anda belum memiliki riwayat deposit"
            />
          )
        ) : null}
      </div>
    </div>
  );
}
