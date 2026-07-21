"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Check, X, Upload, QrCode } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

interface PaymentAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  qr_image_url: string | null;
  is_active: boolean;
}

const BANK_OPTIONS = ["BCA", "BRI", "BNI", "Mandiri", "BSI", "Bank Jago", "SeaBank", "QRIS", "DANA", "GoPay", "OVO"];

const PAYMENT_LOGOS: Record<string, string> = {
  "BCA": "https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg",
  "BRI": "https://upload.wikimedia.org/wikipedia/commons/6/68/BANK_BRI_logo.svg",
  "BNI": "https://upload.wikimedia.org/wikipedia/id/5/55/BNI_logo.svg",
  "Mandiri": "https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg",
  "BSI": "https://upload.wikimedia.org/wikipedia/commons/8/8e/BSI_logo.svg",
  "Bank Jago": "https://upload.wikimedia.org/wikipedia/commons/6/68/Bank_Jago_logo.svg",
  "SeaBank": "https://upload.wikimedia.org/wikipedia/commons/7/77/Seabank_logo.png",
  "QRIS": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg",
  "DANA": "https://upload.wikimedia.org/wikipedia/commons/7/72/Dana_logo.svg",
  "GoPay": "https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg",
  "OVO": "https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo_ovo_purple.svg"
};

const emptyForm = { bank_name: "BCA", account_number: "", account_holder: "", qr_image_url: "" };

export default function AdminRekeningPage() {
  const router = useRouter();
  const { isLoggedIn, supabaseUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [isUploadingQr, setIsUploadingQr] = useState(false);

  useEffect(() => {
    const isAuth = localStorage.getItem("zaystore_admin_auth");
    if (isAuth !== "true") {
      router.push("/admin/login");
    } else {
      setIsAdmin(true);
      fetchAccounts();
    }
  }, [router]);

  const fetchAccounts = async () => {
    setIsLoading(true);
    const { data } = await supabase.from("payment_accounts").select("*").order("created_at");
    setAccounts(data || []);
    setIsLoading(false);
  };

  const handleQrUpload = async (file: File) => {
    setIsUploadingQr(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `qr-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("qrcodes").upload(fileName, file, { upsert: true });
      if (error) throw error;

      const { data } = supabase.storage.from("qrcodes").getPublicUrl(fileName);
      const url = data.publicUrl;
      setForm(f => ({ ...f, qr_image_url: url }));
      setQrPreview(url);
    } catch (e: any) {
      alert("Gagal upload QR: " + e.message);
    } finally {
      setIsUploadingQr(false);
    }
  };

  const handleSave = async () => {
    if (!form.account_holder.trim()) {
      alert("Nama pemilik/merchant wajib diisi!");
      return;
    }
    if (form.bank_name !== "QRIS" && !form.account_number.trim()) {
      alert("Nomor rekening wajib diisi!");
      return;
    }
    setIsSaving(true);
    try {
      const payload: any = {
        bank_name: form.bank_name,
        account_number: form.account_number,
        account_holder: form.account_holder,
        qr_image_url: form.qr_image_url || null,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        await supabase.from("payment_accounts").update(payload).eq("id", editingId);
      } else {
        await supabase.from("payment_accounts").insert({ ...payload, is_active: true });
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      setQrPreview(null);
      fetchAccounts();
    } catch (e: any) {
      alert("Gagal menyimpan: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (acc: PaymentAccount) => {
    setForm({ bank_name: acc.bank_name, account_number: acc.account_number, account_holder: acc.account_holder, qr_image_url: acc.qr_image_url || "" });
    setQrPreview(acc.qr_image_url || null);
    setEditingId(acc.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus rekening ini?")) return;
    await supabase.from("payment_accounts").delete().eq("id", id);
    fetchAccounts();
  };

  const handleToggleActive = async (acc: PaymentAccount) => {
    await supabase.from("payment_accounts").update({ is_active: !acc.is_active }).eq("id", acc.id);
    fetchAccounts();
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setQrPreview(null);
  };

  const isQris = form.bank_name === "QRIS";

  if (isLoading) return <div style={{ padding: 40 }}>Loading...</div>;
  if (isAdmin === false) return <div style={{ padding: 40 }}>Akses Ditolak</div>;

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: "bold", color: "var(--text-main)", marginBottom: 4 }}>Rekening Pembayaran</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
            Kelola nomor rekening & QR yang tampil di halaman checkout pembeli.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); setQrPreview(null); }}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "var(--primary)", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold", fontSize: 14, whiteSpace: "nowrap" }}
          >
            <Plus size={16} /> Tambah Rekening
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--primary)", borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: "bold", marginBottom: 20, color: "var(--text-main)" }}>
            {editingId ? "Edit Rekening" : "Tambah Rekening Baru"}
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: isQris ? "1fr 1fr" : "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
            {/* Bank Name */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: "600", marginBottom: 6, color: "var(--text-muted)" }}>Nama Bank / Metode</label>
              <select
                value={form.bank_name}
                onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-main)", fontSize: 14 }}
              >
                {BANK_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {/* Nomor rekening (hide for QRIS) */}
            {!isQris && (
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: "600", marginBottom: 6, color: "var(--text-muted)" }}>Nomor Rekening / ID</label>
                <input
                  type="text"
                  value={form.account_number}
                  onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))}
                  placeholder="Contoh: 1234567890"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-main)", fontSize: 14, boxSizing: "border-box" }}
                />
              </div>
            )}

            {/* Account holder */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: "600", marginBottom: 6, color: "var(--text-muted)" }}>
                {isQris ? "Nama Merchant / Toko" : "Nama Pemilik Rekening"}
              </label>
              <input
                type="text"
                value={form.account_holder}
                onChange={e => setForm(f => ({ ...f, account_holder: e.target.value }))}
                placeholder={isQris ? "Contoh: Zay Store" : "Contoh: Zay Store Official"}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-main)", fontSize: 14, boxSizing: "border-box" }}
              />
            </div>
          </div>

          {/* QR Image Upload (only for QRIS) */}
          {isQris && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: "600", marginBottom: 10, color: "var(--text-muted)" }}>
                <QrCode size={14} style={{ display: "inline", marginRight: 6 }} />
                Upload Gambar QR Code
              </label>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                {/* Upload area */}
                <label
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 20, border: "2px dashed var(--border-color)", borderRadius: 10, cursor: "pointer", minWidth: 140, transition: "border-color 0.2s" }}
                  onMouseOver={e => (e.currentTarget.style.borderColor = "var(--primary)")}
                  onMouseOut={e => (e.currentTarget.style.borderColor = "var(--border-color)")}
                >
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    ref={fileInputRef}
                    onChange={e => e.target.files?.[0] && handleQrUpload(e.target.files[0])}
                  />
                  <Upload size={24} color="var(--text-muted)" />
                  <span style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
                    {isUploadingQr ? "Mengupload..." : "Klik untuk upload\ngambar QR"}
                  </span>
                </label>

                {/* QR Preview */}
                {qrPreview ? (
                  <div style={{ position: "relative" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrPreview} alt="QR Preview" style={{ width: 140, height: 140, objectFit: "contain", border: "1px solid var(--border-color)", borderRadius: 8, background: "white" }} />
                    <button
                      onClick={() => { setQrPreview(null); setForm(f => ({ ...f, qr_image_url: "" })); }}
                      style={{ position: "absolute", top: -8, right: -8, background: "var(--danger)", color: "white", border: "none", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <X size={12} />
                    </button>
                    <p style={{ fontSize: 11, color: "var(--primary)", marginTop: 4, textAlign: "center" }}>✓ QR siap digunakan</p>
                  </div>
                ) : (
                  <div style={{ width: 140, height: 140, border: "1px solid var(--border-color)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-input)" }}>
                    <span style={{ fontSize: 12, color: "var(--text-light)", textAlign: "center", padding: 8 }}>QR belum diupload</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={handleSave} disabled={isSaving} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "var(--primary)", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold", fontSize: 14 }}>
              <Check size={16} /> {isSaving ? "Menyimpan..." : "Simpan"}
            </button>
            <button onClick={handleCancel} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "var(--bg-input)", color: "var(--text-muted)", border: "1px solid var(--border-color)", borderRadius: 8, cursor: "pointer", fontWeight: "bold", fontSize: 14 }}>
              <X size={16} /> Batal
            </button>
          </div>
        </div>
      )}

      {/* Accounts Table */}
      <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-color)", overflow: "hidden" }}>
        {accounts.length === 0 && !isLoading ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
            <p style={{ fontSize: 16, marginBottom: 8 }}>Belum ada rekening pembayaran</p>
            <p style={{ fontSize: 13 }}>Klik &quot;Tambah Rekening&quot; untuk mulai mengelola rekening tujuan pembayaran.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--bg-main)" }}>
                <th style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontSize: 13, fontWeight: "600" }}>Bank / Metode</th>
                <th style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontSize: 13, fontWeight: "600" }}>Nomor Rekening / QR</th>
                <th style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontSize: 13, fontWeight: "600" }}>Nama Pemilik</th>
                <th style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontSize: 13, fontWeight: "600" }}>Status</th>
                <th style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontSize: 13, fontWeight: "600" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(acc => (
                <tr key={acc.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {PAYMENT_LOGOS[acc.bank_name] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={PAYMENT_LOGOS[acc.bank_name]} alt={acc.bank_name} style={{ height: 24, objectFit: "contain" }} />
                      )}
                      <span style={{ fontWeight: "700", fontSize: 15, color: "var(--text-main)" }}>{acc.bank_name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    {acc.bank_name === "QRIS" && acc.qr_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={acc.qr_image_url} alt="QR Code" style={{ width: 64, height: 64, objectFit: "contain", border: "1px solid var(--border-color)", borderRadius: 4, background: "white" }} />
                    ) : acc.bank_name === "QRIS" ? (
                      <span style={{ color: "var(--danger)", fontSize: 13 }}>QR belum diupload</span>
                    ) : (
                      <span style={{ fontFamily: "monospace", fontSize: 15, fontWeight: "600", color: "var(--primary)", letterSpacing: "0.05em" }}>{acc.account_number}</span>
                    )}
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 14, color: "var(--text-main)" }}>{acc.account_holder}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <button onClick={() => handleToggleActive(acc)} style={{ padding: "4px 12px", borderRadius: 20, border: "none", cursor: "pointer", background: acc.is_active ? "#d1fae5" : "#f3f4f6", color: acc.is_active ? "#065f46" : "#6b7280", fontWeight: "700", fontSize: 12 }}>
                      {acc.is_active ? "Aktif" : "Nonaktif"}
                    </button>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => handleEdit(acc)} style={{ padding: "6px 12px", background: "#dbeafe", color: "#1e40af", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: "bold" }}>
                        <Pencil size={12} /> Edit
                      </button>
                      <button onClick={() => handleDelete(acc.id)} style={{ padding: "6px 12px", background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: "bold" }}>
                        <Trash2 size={12} /> Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
