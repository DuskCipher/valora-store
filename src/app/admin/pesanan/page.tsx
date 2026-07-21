"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  status: string;
  payment_method: string;
  details: any;
  created_at: string;
  profiles: { full_name: string; email: string };
}

export default function AdminPesananPage() {
  const router = useRouter();
  const { isLoggedIn, supabaseUser } = useAuth();
  
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const isAuth = localStorage.getItem("zaystore_admin_auth");
    if (isAuth !== "true") {
      router.push("/admin/login");
    } else {
      setIsAdmin(true);
      fetchTransactions();
    }
  }, [router]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("type", "order")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase Error:", error);
        alert("Gagal mengambil pesanan: " + error.message);
      } else if (data) {
        // Fetch profiles separately to avoid relation errors
        const userIds = [...new Set(data.map(t => t.user_id))];
        let profilesMap: Record<string, any> = {};
        
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", userIds);
            
          if (profilesData) {
            profilesData.forEach(p => {
              profilesMap[p.id] = p;
            });
          }
        }

        // Fetch stores separately to get store names
        let storeIds = new Set<string>();
        data.forEach(t => {
          t.details?.items?.forEach((item: any) => {
            if (item.product?.store_id) storeIds.add(item.product.store_id);
          });
        });
        
        let storesMap: Record<string, any> = {};
        if (storeIds.size > 0) {
          const { data: storesData } = await supabase.from("stores").select("id, name").in("id", Array.from(storeIds));
          if (storesData) {
            storesData.forEach(s => {
              storesMap[s.id] = s;
            });
          }
        }

        const transactionsWithData = data.map(t => {
          const enrichedDetails = { ...t.details };
          if (enrichedDetails.items) {
             enrichedDetails.items = enrichedDetails.items.map((item: any) => {
                if (item.product?.store_id && storesMap[item.product.store_id]) {
                   item.store_name = storesMap[item.product.store_id].name;
                }
                return item;
             });
          }
          return {
            ...t,
            details: enrichedDetails,
            profiles: profilesMap[t.user_id] || { full_name: "User", email: "-" }
          };
        });
        
        setTransactions(transactionsWithData);
      }
    } catch (e: any) {
      console.error("Catch Error:", e);
      alert("Error: " + e.message);
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

  const handleApprove = async (t: Transaction) => {
    if (!confirm("Setujui pesanan ini?")) return;

    try {
      // 1. Deduct from buyer balance if they used balance
      if (t.details?.saldo_used > 0) {
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("balance")
          .eq("id", t.user_id)
          .single();
        
        const currentBalance = userProfile?.balance || 0;
        await supabase
          .from("profiles")
          .update({ balance: currentBalance - t.details.saldo_used })
          .eq("id", t.user_id);
      }

      // 2. Payout to sellers (Add earnings to stores.balance)
      const items = t.details?.items || [];
      for (const item of items) {
        const prodId = item.product?.id || item.id;
        if (prodId) {
          const { data: product } = await supabase
            .from("products")
            .select("id, store_id, sold")
            .eq("id", prodId)
            .single();

          if (product && product.store_id) {
            const itemPrice = item.variation 
              ? (item.variation.discount_price ?? item.variation.price)
              : (item.product?.price ?? item.price ?? 0);
            
            const quantity = item.quantity || 1;
            const totalEarning = Number(itemPrice) * quantity;

            const { data: store } = await supabase
              .from("stores")
              .select("balance")
              .eq("id", product.store_id)
              .single();

            if (store) {
              const currentStoreBalance = Number(store.balance || 0);
              await supabase
                .from("stores")
                .update({ balance: currentStoreBalance + totalEarning })
                .eq("id", product.store_id);
            }

            // Update product sold count
            const currentSold = Number(product.sold || 0);
            await supabase
              .from("products")
              .update({ sold: currentSold + quantity })
              .eq("id", product.id);
          }
        }
      }

      // 3. Mark transaction as approved
      await supabase
        .from("transactions")
        .update({ status: "approved" })
        .eq("id", t.id);

      alert("Pesanan disetujui! Saldo pembeli telah didebit dan hasil penjualan telah disalurkan ke toko penjual.");
      fetchTransactions();
    } catch (e: any) {
      alert("Gagal menyetujui: " + e.message);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Tolak pesanan ini?")) return;
    
    try {
      const { data: tx } = await supabase.from("transactions").select("details, type").eq("id", id).single();

      await supabase
        .from("transactions")
        .update({ status: "rejected" })
        .eq("id", id);

      if (tx?.type === "order" && tx?.details?.items) {
        for (const item of tx.details.items) {
          const prodId = item.product?.id || item.id;
          const quantity = item.quantity || 1;
          if (prodId) {
            const { data: currentProduct } = await supabase
              .from("products")
              .select("stock, sold")
              .eq("id", prodId)
              .single();
            if (currentProduct) {
              await supabase
                .from("products")
                .update({
                  stock: (currentProduct.stock || 0) + quantity,
                  sold: Math.max(0, (currentProduct.sold || 0) - quantity)
                })
                .eq("id", prodId);
            }
          }
        }
      }

      fetchTransactions();
    } catch (e: any) {
      alert("Gagal menolak: " + e.message);
    }
  };

  if (isLoading) return <div style={{ padding: 40 }}>Loading...</div>;
  if (isAdmin === false) return <div style={{ padding: 40 }}>Akses Ditolak</div>;

  return (
    <div style={{ padding: "24px" }}>
      <h1 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 24, color: "var(--text-main)" }}>Kelola Pesanan Platform</h1>
      
      <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-color)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--bg-main)" }}>
                <th style={{ padding: 16, borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontSize: 13, fontWeight: "600" }}>Tanggal</th>
                <th style={{ padding: 16, borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontSize: 13, fontWeight: "600" }}>Pembeli</th>
                <th style={{ padding: 16, borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontSize: 13, fontWeight: "600" }}>Item</th>
                <th style={{ padding: 16, borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontSize: 13, fontWeight: "600" }}>Nominal</th>
                <th style={{ padding: 16, borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontSize: 13, fontWeight: "600" }}>Status</th>
                <th style={{ padding: 16, borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontSize: 13, fontWeight: "600" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td style={{ padding: 16, fontSize: 14 }}>
                    {new Date(t.created_at).toLocaleString('id-ID')}
                  </td>
                  <td style={{ padding: 16 }}>
                    <div style={{ fontWeight: "600", fontSize: 14 }}>{t.profiles?.full_name || 'User'}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{t.profiles?.email}</div>
                  </td>
                  <td style={{ padding: 16, fontSize: 13, color: "var(--text-muted)", maxWidth: 200 }}>
                    {t.details?.items ? (
                      t.details.items.map((item: any, idx: number) => (
                        <div key={idx} style={{ marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{item.product?.name}</span>
                          {item.store_name && <div style={{ fontSize: 11, color: "var(--primary)" }}>Toko: {item.store_name}</div>}
                        </div>
                      ))
                    ) : "-"}
                  </td>
                  <td style={{ padding: 16 }}>
                    <div style={{ fontWeight: "600", color: "var(--primary)" }}>{formatPrice(t.amount)}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.payment_method}</div>
                  </td>
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
                  <td style={{ padding: 16 }}>
                    {t.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleApprove(t)} style={{ padding: "6px 12px", background: "var(--primary)", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>ACC</button>
                        <button onClick={() => handleReject(t.id)} style={{ padding: "6px 12px", background: "var(--danger)", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>Tolak</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>
                    Belum ada data pesanan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
