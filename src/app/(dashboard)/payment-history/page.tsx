"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ChevronDown, Clock, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import styles from "./page.module.css";

interface Transaction {
  id: string;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  type: string;
}

export default function PaymentHistoryPage() {
  const { supabaseUser, isLoggedIn } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isLoggedIn && supabaseUser) {
      fetchTransactions();
    } else if (isLoggedIn === false) {
      setIsLoading(false);
    }
  }, [isLoggedIn, supabaseUser]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("id, amount, status, payment_method, created_at, type")
        .eq("user_id", supabaseUser!.id)
        .in("type", ["topup", "order"])
        .order("created_at", { ascending: false });

      if (!error && data) {
        setTransactions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price).replace(/\s/g, "");

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "approved": return { label: "Dikonfirmasi", color: "#065f46", bg: "#d1fae5", icon: <CheckCircle size={14} /> };
      case "rejected": return { label: "Ditolak", color: "#991b1b", bg: "#fee2e2", icon: <XCircle size={14} /> };
      default: return { label: "Menunggu", color: "#92400e", bg: "#fef3c7", icon: <Clock size={14} /> };
    }
  };

  const filteredData = transactions.filter(tx => tx.id.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Riwayat Pesanan <span className={styles.count}>({transactions.length})</span></h1>
        <p className={styles.subtitle}>Di sini Anda dapat melihat semua riwayat pesanan dan pembayaran Anda</p>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Cari Reference ID..." 
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.invoiceList}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Memuat data...</div>
        ) : filteredData.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Tidak ada riwayat pesanan.</div>
        ) : (
          filteredData.map((tx) => {
            const statusInfo = getStatusInfo(tx.status);
            const shortId = tx.id.slice(0, 12);
            
            return (
              <div key={tx.id} className={styles.invoiceRow}>
                <div className={styles.invoiceLeft}>
                  <div className={styles.methodBox}>
                    <p style={{ fontSize: 12, fontWeight: "600", color: "var(--text-muted)", marginBottom: 4 }}>Metode</p>
                    <p style={{ fontSize: 14, fontWeight: "700", color: "var(--text-main)" }}>{tx.payment_method}</p>
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Tanggal: {formatDate(tx.created_at)}</span>
                    <span style={{ fontSize: 15, fontWeight: "700", fontFamily: "monospace", color: "var(--text-main)" }}>#{shortId}</span>
                  </div>
                </div>

                <div className={styles.invoiceRight}>
                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                      {tx.type === "topup" ? "Total Top Up" : "Total Belanja"}
                    </span>
                    <span style={{ fontSize: 16, fontWeight: "700", color: "var(--primary)" }}>{formatPrice(tx.amount)}</span>
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, minWidth: 160 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: "700", padding: "6px 12px", borderRadius: 20, background: statusInfo.bg, color: statusInfo.color }}>
                      {statusInfo.icon}
                      {statusInfo.label}
                    </span>
                    <Link href={`/payment/${tx.id}`} style={{ fontSize: 13, fontWeight: "600", color: "var(--primary)", border: "1px solid var(--primary)", padding: "6px 14px", borderRadius: 6, textDecoration: "none" }}>
                      Detail Tagihan
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
