"use client";

import React, { useState, useEffect } from "react";
import { Search, ChevronDown, ArrowUpRight, ArrowDownLeft, ReceiptText } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import styles from "../payment-history/page.module.css";

export default function MutasiSaldoPage() {
  const { supabaseUser } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (supabaseUser) {
      fetchData();
    }
  }, [supabaseUser]);

  const fetchData = async () => {
    setIsLoading(true);
    const { data: txs } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", supabaseUser?.id)
      .order("created_at", { ascending: false });
    
    if (txs) {
      // Hanya tampilkan transaksi yang benar-benar mengubah saldo
      const mutations = txs.filter(t => t.type !== 'order' || (t.details?.saldo_used && t.details.saldo_used > 0));
      setHistory(mutations);
    }
    setIsLoading(false);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price).replace(/\s/g, "");

  const getTransactionIcon = (type: string) => {
    if (type === 'topup') return <ArrowDownLeft size={16} color="#065f46" />;
    if (type === 'withdraw') return <ArrowUpRight size={16} color="#991b1b" />;
    return <ReceiptText size={16} color="#374151" />;
  };

  const getTransactionColor = (type: string, status: string) => {
    if (status !== 'approved') return "var(--text-muted)";
    if (type === 'topup') return "var(--primary)"; // green
    return "var(--danger)"; // red
  };

  const getTransactionSign = (type: string) => {
    if (type === 'topup') return "+";
    return "-";
  };

  const getMutationAmount = (t: any) => {
    if (t.type === 'order') return t.details?.saldo_used || 0;
    return t.amount;
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Mutasi Saldo</h1>
        <p className={styles.subtitle}>Riwayat keluar masuk saldo Anda</p>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input type="text" placeholder="Cari transaksi" className={styles.searchInput} />
        </div>
        <button className={styles.filterBtn}>
          Filter <ChevronDown size={16} />
        </button>
      </div>

      <div style={{ marginTop: '24px' }}>
        {isLoading ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-muted)" }}>
            Memuat data...
          </div>
        ) : history.length > 0 ? (
          <div style={{ background: "var(--bg-card)", borderRadius: 8, border: "1px solid var(--border-color)", overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: "700px", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--bg-main)" }}>
                  <th style={{ padding: 16, borderBottom: "1px solid var(--border-color)", fontSize: 13, color: "var(--text-muted)" }}>Tanggal</th>
                  <th style={{ padding: 16, borderBottom: "1px solid var(--border-color)", fontSize: 13, color: "var(--text-muted)" }}>Tipe</th>
                  <th style={{ padding: 16, borderBottom: "1px solid var(--border-color)", fontSize: 13, color: "var(--text-muted)" }}>Nominal</th>
                  <th style={{ padding: 16, borderBottom: "1px solid var(--border-color)", fontSize: 13, color: "var(--text-muted)" }}>Metode</th>
                  <th style={{ padding: 16, borderBottom: "1px solid var(--border-color)", fontSize: 13, color: "var(--text-muted)" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map(t => (
                  <tr key={t.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={{ padding: 16, fontSize: 14 }}>{new Date(t.created_at).toLocaleString('id-ID')}</td>
                    <td style={{ padding: 16, fontSize: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'capitalize' }}>
                        {getTransactionIcon(t.type)}
                        {t.type}
                      </div>
                    </td>
                    <td style={{ padding: 16, fontWeight: "600", color: getTransactionColor(t.type, t.status) }}>
                      {getTransactionSign(t.type)} {formatPrice(getMutationAmount(t))}
                    </td>
                    <td style={{ padding: 16, fontSize: 14 }}>{t.payment_method || "-"}</td>
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
            description="Yeah, Anda belum memiliki Data mutasi saldo"
          />
        )}
      </div>
    </div>
  );
}
