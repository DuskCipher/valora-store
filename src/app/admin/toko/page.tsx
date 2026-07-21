"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Eye, Trash2, X } from "lucide-react";

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
  is_verified?: boolean;
  created_at: string;
  profiles: { full_name: string; email: string };
}

export default function AdminTokoPage() {
  const router = useRouter();
  const { isLoggedIn, supabaseUser } = useAuth();
  
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleToggleVerified = async (s: Store) => {
    const newStatus = !s.is_verified;
    if (!confirm(`Apakah Anda yakin ingin ${newStatus ? 'memberikan' : 'mencabut'} Centang Biru untuk toko ini?`)) return;

    try {
      await supabase
        .from("stores")
        .update({ is_verified: newStatus })
        .eq("id", s.id);
        
      fetchStores();
    } catch (e: any) {
      alert("Gagal memperbarui status verifikasi: " + e.message);
    }
  };

  const handleDeleteStore = async (id: string) => {
    if (!confirm("PERINGATAN: Menghapus toko akan menghapus semua data terkait secara permanen! Lanjutkan?")) return;

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from("stores")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      alert("Toko berhasil dihapus!");
      fetchStores();
    } catch (e: any) {
      alert("Gagal menghapus toko: " + e.message);
      setIsLoading(false);
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(s.status === 'pending' || !s.status) && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => handleApprove(s)} style={{ padding: "6px 12px", background: "var(--primary)", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>ACC</button>
                          <button onClick={() => handleReject(s.id)} style={{ padding: "6px 12px", background: "var(--danger)", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>Tolak</button>
                        </div>
                      )}
                      {s.status === 'approved' && (
                        <button 
                          onClick={() => handleToggleVerified(s)} 
                          style={{ 
                            padding: "6px 12px", 
                            background: s.is_verified ? "var(--bg-input)" : "#3b82f6", 
                            color: s.is_verified ? "var(--text-main)" : "white", 
                            border: s.is_verified ? "1px solid var(--border-color)" : "none", 
                            borderRadius: 4, 
                            cursor: "pointer", 
                            fontSize: 12, 
                            fontWeight: "bold",
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          {s.is_verified ? "Batal Centang Biru" : "Beri Centang Biru"}
                        </button>
                      )}
                      
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button 
                          onClick={() => {
                            setSelectedStore(s);
                            setIsModalOpen(true);
                          }} 
                          style={{ flex: 1, padding: "6px 12px", background: "var(--bg-main)", color: "var(--text-main)", border: "1px solid var(--border-color)", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: "bold", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                        >
                          <Eye size={14} /> Detail
                        </button>
                        
                        <button 
                          onClick={() => handleDeleteStore(s.id)} 
                          style={{ padding: "6px 12px", background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: "bold", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                          title="Hapus Toko"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
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

      {isModalOpen && selectedStore && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-xl)', position: 'relative' }}>
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={24} />
            </button>
            
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
              <h2 style={{ fontSize: 20, fontWeight: 'bold', color: 'var(--text-main)', marginBottom: 16 }}>Detail Pendaftaran Toko</h2>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                {selectedStore.logo_url ? (
                  <img src={selectedStore.logo_url} alt="Logo" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)' }} />
                ) : (
                  <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: '#e2e8f0' }} />
                )}
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 'bold', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {selectedStore.name}
                    {selectedStore.is_verified && <span style={{ color: '#3b82f6', fontSize: 14 }}>✓ Verified</span>}
                  </h3>
                  <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 4 }}>Pemilik: {selectedStore.profiles?.full_name} ({selectedStore.profiles?.email})</div>
                  <span style={{ 
                    padding: "4px 8px", 
                    borderRadius: 4, 
                    backgroundColor: selectedStore.status === 'approved' ? '#d1fae5' : selectedStore.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                    color: selectedStore.status === 'approved' ? '#065f46' : selectedStore.status === 'rejected' ? '#991b1b' : '#b45309',
                    fontWeight: "bold",
                    fontSize: 12,
                    display: 'inline-block'
                  }}>
                    Status: {(selectedStore.status || 'pending').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 'bold', color: 'var(--text-main)', marginBottom: 8 }}>Deskripsi Toko</h4>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5, background: 'var(--bg-main)', padding: 12, borderRadius: 8 }}>
                  {selectedStore.description || '-'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 'bold', color: 'var(--text-main)', marginBottom: 8 }}>Lokasi & Alamat</h4>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)', background: 'var(--bg-main)', padding: 12, borderRadius: 8 }}>
                    <div><strong>Provinsi:</strong> {selectedStore.province || '-'}</div>
                    <div><strong>Kota/Kab:</strong> {selectedStore.city || '-'}</div>
                    <div style={{ marginTop: 8 }}><strong>Alamat Lengkap:</strong><br />{selectedStore.address || '-'}</div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 'bold', color: 'var(--text-main)', marginBottom: 8 }}>Rekening Penarikan Dana</h4>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)', background: 'var(--bg-main)', padding: 12, borderRadius: 8 }}>
                    {selectedStore.bank_details ? (
                      <>
                        <div style={{ fontWeight: "600", color: "var(--primary)", fontSize: 16, marginBottom: 4 }}>{selectedStore.bank_details.bank_name}</div>
                        <div><strong>No. Rekening:</strong> {selectedStore.bank_details.account_number}</div>
                        <div><strong>Atas Nama:</strong> {selectedStore.bank_details.account_name}</div>
                      </>
                    ) : "-"}
                  </div>
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Mendaftar pada: {new Date(selectedStore.created_at).toLocaleString('id-ID')}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
