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
  created_at: string;
  profiles: { full_name: string; email: string };
}

export default function AdminKeuanganPage() {
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
        .in("type", ["topup", "withdraw"])
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase Error:", error);
        alert("Gagal mengambil keuangan: " + error.message);
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

        let storeIds = new Set<string>();
        data.forEach(t => {
          if (t.details?.is_store_withdrawal && t.details?.store_id) {
             storeIds.add(t.details.store_id);
          }
        });

        let storesMap: Record<string, any> = {};
        if (storeIds.size > 0) {
           const { data: storesData } = await supabase.from("stores").select("id, name").in("id", Array.from(storeIds));
           if (storesData) {
             storesData.forEach(s => storesMap[s.id] = s);
           }
        }

        const transactionsWithProfiles = data.map(t => {
           let display_name = profilesMap[t.user_id]?.full_name || "User";
           let display_email = profilesMap[t.user_id]?.email || "-";
           
           if (t.details?.is_store_withdrawal && t.details?.store_id) {
              const s_name = storesMap[t.details.store_id]?.name;
              if (s_name) {
                 display_name = s_name;
                 display_email = "Penarikan Dana Toko";
              }
           }

           return {
              ...t,
              profiles: { full_name: display_name, email: display_email }
           };
        });
        
        setTransactions(transactionsWithProfiles);
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
    const isTopup = t.type === "topup";
    const actionText = isTopup ? "Setujui top up ini? (Saldo user akan bertambah)" : "Setujui penarikan ini? (Saldo user akan berkurang)";
    if (!confirm(actionText)) return;

    try {
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", t.user_id)
        .single();
      
      const currentBalance = userProfile?.balance || 0;

      if (!isTopup) {
        if ((t as any).details?.is_store_withdrawal) {
          // Deduct from store balance
          const storeId = (t as any).details?.store_id;
          if (!storeId) {
            alert("Terjadi kesalahan: ID Toko tidak ditemukan di detail transaksi.");
            return;
          }

          const { data: store, error: storeErr } = await supabase
            .from("stores")
            .select("balance")
            .eq("id", storeId)
            .single();

          if (storeErr) {
            alert("Gagal mengambil data toko: " + storeErr.message);
            return;
          }

          const currentStoreBalance = Number(store?.balance || 0);
          const withdrawAmount = Number(t.amount || 0);

          if (currentStoreBalance < withdrawAmount) {
            alert(`Saldo Toko (Rp${currentStoreBalance}) tidak mencukupi untuk melakukan penarikan ini (Rp${withdrawAmount})!`);
            return;
          }

          const newStoreBalance = currentStoreBalance - withdrawAmount;
          await supabase
            .from("stores")
            .update({ balance: newStoreBalance })
            .eq("id", storeId);
        } else {
          // Deduct from user profile balance
          if (currentBalance < t.amount) {
            alert("Saldo pengguna tidak mencukupi untuk melakukan penarikan ini!");
            return;
          }

          const newBalance = currentBalance - t.amount;
          await supabase
            .from("profiles")
            .update({ balance: newBalance })
            .eq("id", t.user_id);
        }
      } else {
        // Top up: Add to user profile balance
        const newBalance = currentBalance + t.amount;
        await supabase
          .from("profiles")
          .update({ balance: newBalance })
          .eq("id", t.user_id);
      }

      await supabase
        .from("transactions")
        .update({ status: "approved" })
        .eq("id", t.id);

      alert(isTopup ? "Top Up disetujui! Saldo berhasil ditambahkan." : "Penarikan disetujui! Saldo berhasil dikurangi.");
      fetchTransactions();
    } catch (e: any) {
      alert("Gagal menyetujui: " + e.message);
    }
  };

  const handleReject = async (t: Transaction) => {
    const actionText = t.type === "topup" ? "Tolak top up ini?" : "Tolak penarikan ini?";
    if (!confirm(actionText)) return;
    
    try {
      await supabase
        .from("transactions")
        .update({ status: "rejected" })
        .eq("id", t.id);
      fetchTransactions();
    } catch (e: any) {
      alert("Gagal menolak: " + e.message);
    }
  };

  if (isLoading) return <div style={{ padding: 40 }}>Loading...</div>;
  if (isAdmin === false) return <div style={{ padding: 40 }}>Akses Ditolak</div>;

  return (
    <div style={{ padding: "24px" }}>
      <h1 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 24, color: "var(--text-main)" }}>Kelola Keuangan & Top Up</h1>
      
      <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-color)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--bg-main)" }}>
                <th style={{ padding: 16, borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontSize: 13, fontWeight: "600" }}>Tanggal</th>
                <th style={{ padding: 16, borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontSize: 13, fontWeight: "600" }}>Pengguna</th>
                <th style={{ padding: 16, borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontSize: 13, fontWeight: "600" }}>Tipe</th>
                <th style={{ padding: 16, borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontSize: 13, fontWeight: "600" }}>Nominal</th>
                <th style={{ padding: 16, borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontSize: 13, fontWeight: "600" }}>Info Rek/Metode</th>
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
                  <td style={{ padding: 16 }}>
                    <span style={{ 
                      padding: "4px 8px", 
                      borderRadius: 4, 
                      backgroundColor: t.type === 'topup' ? '#e0f2fe' : '#fef3c7',
                      color: t.type === 'topup' ? '#0369a1' : '#b45309',
                      fontWeight: "bold",
                      fontSize: 12
                    }}>
                      {t.type === 'topup' ? 'TOP UP' : 'PENARIKAN'}
                    </span>
                  </td>
                  <td style={{ padding: 16 }}>
                    <div style={{ fontWeight: "600", color: t.type === 'topup' ? "#10b981" : "#ef4444" }}>
                      {t.type === 'topup' ? '+' : '-'} {formatPrice(t.amount)}
                    </div>
                  </td>
                  <td style={{ padding: 16 }}>
                    <div style={{ fontSize: 14, color: "var(--text-main)", fontWeight: "600" }}>
                      {t.payment_method}
                    </div>
                    {t.type === 'withdraw' && (
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                        <div>No. Rek: {(t as any).details?.account_number} ({(t as any).details?.account_holder})</div>
                        {(t as any).details?.fee && (
                          <div style={{ marginTop: 2, color: "var(--danger)" }}>Potongan (5%): {formatPrice((t as any).details.fee)}</div>
                        )}
                        {(t as any).details?.receive_amount && (
                          <div style={{ fontWeight: "600", color: "var(--primary)" }}>Diterima Bersih: {formatPrice((t as any).details.receive_amount)}</div>
                        )}
                      </div>
                    )}
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
                        <button onClick={() => handleReject(t)} style={{ padding: "6px 12px", background: "var(--danger)", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>Tolak</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>
                    Belum ada data top up
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
