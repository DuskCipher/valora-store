"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

interface Store {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  logo_url: string;
  city: string;
  province: string;
  address: string;
  bank_details: any;
  status: string;
  created_at: string;
  profiles: { full_name: string; email: string };
}

export default function AdminTokoPage() {
  const router = useRouter();
  const { isLoggedIn, supabaseUser } = useAuth();
  
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const isAuth = localStorage.getItem("zaystore_admin_auth");
    if (isAuth !== "true") {
      router.push("/admin/login");
    } else {
      setIsAdmin(true);
      fetchStores();
    }
  }, [router]);

  const fetchStores = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase Error:", error);
        alert("Gagal mengambil data toko: " + error.message);
      } else if (data) {
        // Fetch profiles separately
        const userIds = [...new Set(data.map(s => s.owner_id))];
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

        const storesWithProfiles = data.map(s => ({
          ...s,
          profiles: profilesMap[s.owner_id] || { full_name: "User", email: "" }
        }));
        
        setStores(storesWithProfiles);
      }
    } catch (e: any) {
      console.error("Catch Error:", e);
      alert("Error: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (s: Store) => {
    if (!confirm("Setujui pendaftaran toko ini?")) return;

    try {
      await supabase
        .from("stores")
        .update({ status: "approved" })
        .eq("id", s.id);

      alert("Toko disetujui!");
      fetchStores();
    } catch (e: any) {
      alert("Gagal menyetujui: " + e.message);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Tolak pendaftaran toko ini?")) return;
    
    try {
      await supabase
        .from("stores")
        .update({ status: "rejected" })
        .eq("id", id);
      fetchStores();
    } catch (e: any) {
      alert("Gagal menolak: " + e.message);
    }
  };

  if (isLoading) return <div style={{ padding: 40 }}>Loading...</div>;
  if (isAdmin === false) return <div style={{ padding: 40 }}>Akses Ditolak</div>;

  return (
    <div style={{ padding: "24px" }}>
      <h1 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 24, color: "var(--text-main)" }}>Kelola Pendaftaran Toko</h1>
      
      <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-color)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--bg-main)" }}>
                <th style={{ padding: 16, borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontSize: 13, fontWeight: "600" }}>Pemilik</th>
                <th style={{ padding: 16, borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontSize: 13, fontWeight: "600" }}>Info Toko</th>
                <th style={{ padding: 16, borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontSize: 13, fontWeight: "600" }}>Alamat Lengkap</th>
                <th style={{ padding: 16, borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontSize: 13, fontWeight: "600" }}>Rekening Penarikan</th>
                <th style={{ padding: 16, borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontSize: 13, fontWeight: "600" }}>Status</th>
                <th style={{ padding: 16, borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontSize: 13, fontWeight: "600" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {stores.map(s => (
                <tr key={s.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td style={{ padding: 16 }}>
                    <div style={{ fontWeight: "600", fontSize: 14 }}>{s.profiles?.full_name || 'User'}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{s.profiles?.email}</div>
                  </td>
                  <td style={{ padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {s.logo_url ? (
                        <img src={s.logo_url} alt="Logo" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#e2e8f0' }} />
                      )}
                      <div>
                        <div style={{ fontWeight: "600", fontSize: 14 }}>{s.name}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.description}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: 16, fontSize: 13, color: "var(--text-muted)", maxWidth: 200 }}>
                    {s.address ? (
                      <>
                        <div>{s.address}</div>
                        <div style={{ fontWeight: "500", marginTop: 4 }}>{s.city}, {s.province}</div>
                      </>
                    ) : "-"}
                  </td>
                  <td style={{ padding: 16 }}>
                    {s.bank_details ? (
                      <>
                        <div style={{ fontWeight: "600", color: "var(--primary)" }}>{s.bank_details.bank_name}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.bank_details.account_number}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>a/n {s.bank_details.account_name}</div>
                      </>
                    ) : "-"}
                  </td>
                  <td style={{ padding: 16 }}>
                    <span style={{ 
                      padding: "4px 8px", 
                      borderRadius: 4, 
                      backgroundColor: s.status === 'approved' ? '#d1fae5' : s.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                      color: s.status === 'approved' ? '#065f46' : s.status === 'rejected' ? '#991b1b' : '#b45309',
                      fontWeight: "bold",
                      fontSize: 12
                    }}>
                      {(s.status || 'pending').toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: 16 }}>
                    {(s.status === 'pending' || !s.status) && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleApprove(s)} style={{ padding: "6px 12px", background: "var(--primary)", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>ACC</button>
                        <button onClick={() => handleReject(s.id)} style={{ padding: "6px 12px", background: "var(--danger)", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>Tolak</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {stores.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>
                    Belum ada data pendaftaran toko
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
