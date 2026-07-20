"use client";

import React, { useState, useEffect } from "react";
import { Search, ChevronDown, ArrowUpRight, ArrowDownLeft, ReceiptText } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import styles from "../../../(dashboard)/payment-history/page.module.css";

export default function ShopMutasiSaldoPage() {
  const { supabaseUser } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (supabaseUser) {
      fetchData();
    }
  }, [supabaseUser]);

  const fetchData = async () => {
    setIsLoading(true);

    try {
      // 1. Fetch store
      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", supabaseUser?.id)
        .single();

      if (!store) {
        setIsLoading(false);
        return;
      }

      // 2. Fetch store products
      const { data: products } = await supabase
        .from("products")
        .select("id")
        .eq("store_id", store.id);

      const productIds = products?.map(p => p.id) || [];

      // 3. Fetch withdrawals for this store
      const { data: withdrawTxs } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", supabaseUser?.id)
        .eq("type", "withdraw");

      const storeWithdrawals = (withdrawTxs || []).filter(t => t.details?.is_store_withdrawal === true);

      // 4. Fetch orders to calculate earnings
      const { data: orderTxs } = await supabase
        .from("transactions")
        .select("*")
        .eq("type", "order")
        .eq("status", "approved");

      const storeEarnings: any[] = [];
      if (orderTxs && productIds.length > 0) {
        orderTxs.forEach(t => {
          const items = t.details?.items || [];
          let earningFromThisOrder = 0;
          items.forEach((item: any) => {
            const prodId = item.product?.id || item.id;
            if (productIds.includes(prodId)) {
              const itemPrice = item.variation 
                ? (item.variation.discount_price ?? item.variation.price)
                : (item.product?.price ?? item.price);
              earningFromThisOrder += Number(itemPrice) * (item.quantity || 1);
            }
          });

          if (earningFromThisOrder > 0) {
            storeEarnings.push({
              ...t,
              id: t.id + "-earning", // unique id
              type: "earning",
              amount: earningFromThisOrder,
              payment_method: "Penjualan Produk",
            });
          }
        });
      }

      // Combine and sort
      const combined = [...storeWithdrawals, ...storeEarnings].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setHistory(combined);
    } catch (error) {
      console.error(error);
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
    if (type === 'earning') return <ArrowDownLeft size={16} color="#065f46" />;
    if (type === 'withdraw') return <ArrowUpRight size={16} color="#991b1b" />;
    return <ReceiptText size={16} color="#374151" />;
  };

  const getTransactionColor = (type: string, status: string) => {
    if (status !== 'approved') return "var(--text-muted)";
    if (type === 'earning') return "var(--primary)"; // green
    return "var(--danger)"; // red
  };

  const getTransactionSign = (type: string) => {
    if (type === 'earning') return "+";
    return "-";
  };

  const getMutationAmount = (t: any) => {
    return t.amount || 0;
  };

  const filteredHistory = history.filter(t => 
    t.payment_method?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container} style={{ minHeight: "auto", padding: "24px" }}>
      <header className={styles.header}>
        <h1 className={styles.title}>Mutasi Saldo Toko</h1>
        <p className={styles.subtitle}>Riwayat keluar masuk saldo pendapatan Anda</p>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Cari transaksi..." 
            className={styles.searchInput} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div style={{ marginTop: '24px' }}>
        {isLoading ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-muted)" }}>
            Memuat data...
          </div>
        ) : filteredHistory.length > 0 ? (
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
                {filteredHistory.map(t => (
                  <tr key={t.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={{ padding: 16, fontSize: 14 }}>{new Date(t.created_at).toLocaleString('id-ID')}</td>
                    <td style={{ padding: 16, fontSize: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'capitalize' }}>
                        {getTransactionIcon(t.type)}
                        {t.type}
                      </div>
                    </td>
                    <td style={{ padding: 16 }}>
                      <div style={{ fontWeight: "600", color: getTransactionColor(t.type, t.status) }}>
                        {getTransactionSign(t.type)} {formatPrice(getMutationAmount(t))}
                      </div>
                      {t.type === 'withdraw' && t.details?.receive_amount && (
                        <div style={{ fontSize: 12, fontWeight: "600", color: "var(--primary)", marginTop: 4 }}>
                          Diterima: {formatPrice(t.details.receive_amount)}
                        </div>
                      )}
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
