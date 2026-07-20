"use client";

import React, { useState, useEffect } from "react";
import styles from "../layout.module.css";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export default function RekeningBankPage() {
  const router = useRouter();
  const { supabaseUser } = useAuth();

  const [storeId, setStoreId] = useState<string | null>(null);
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchRekening = async () => {
      if (!supabaseUser) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('id, bank_details')
          .eq('owner_id', supabaseUser.id)
          .single();

        if (error) {
          console.error("Error fetching store:", error);
        } else if (data) {
          setStoreId(data.id);
          if (data.bank_details) {
            setBankName(data.bank_details.bank_name || "");
            setAccountName(data.bank_details.account_name || "");
            setAccountNumber(data.bank_details.account_number || "");
          }
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRekening();
  }, [supabaseUser]);

  const handleSave = async () => {
    if (!storeId) return;
    if (!bankName || !accountName || !accountNumber) {
      alert("Harap lengkapi semua data rekening!");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('stores')
        .update({
          bank_details: {
            bank_name: bankName,
            account_name: accountName,
            account_number: accountNumber
          },
          status: 'pending' // Set status to pending waiting for admin approval
        })
        .eq('id', storeId);

      if (error) {
        console.error("Error updating rekening:", error);
        alert("Gagal menyimpan rekening.");
      } else {
        alert("Pendaftaran Toko Selesai! Menunggu persetujuan Admin.");
        router.push("/shop/dashboard");
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: "24px" }}>Memuat data rekening...</div>;
  }

  return (
    <>
      <div className={styles.formCard}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Nama Bank</label>
          <select className={styles.formSelect} value={bankName} onChange={(e) => setBankName(e.target.value)}>
            <option value="">Select...</option>
            <option value="BCA">BCA</option>
            <option value="BRI">BRI</option>
            <option value="BNI">BNI</option>
            <option value="Mandiri">Mandiri</option>
            <option value="BSI">BSI</option>
            <option value="Bank Jago">Bank Jago</option>
            <option value="SeaBank">SeaBank</option>
            <option value="QRIS">QRIS</option>
            <option value="DANA">DANA</option>
            <option value="GoPay">GoPay</option>
            <option value="OVO">OVO</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Nama Pemilik Rekening</label>
          <input type="text" className={styles.formInput} value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Contoh: Budi Santoso" />
        </div>

        <div className={styles.formGroup} style={{ marginBottom: 0 }}>
          <label className={styles.formLabel}>Nomor Rekening</label>
          <input type="text" className={styles.formInput} value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Contoh: 1234567890" />
        </div>
      </div>

      <div className={styles.submitWrapper}>
        <button className={styles.submitBtn} onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Menyimpan..." : "Simpan & Ajukan Toko"}
        </button>
      </div>

      {/* Footer from screenshot */}
      <div style={{ marginTop: "64px", display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "#94a3b8" }}>
        <span>© Copyright 2026 PT VALORA NUSANTARA TECHWORK 2.1.</span>
        <span>Dengan menggunakan layanan kami, Anda menyetujui Syarat Layanan dan Kebijakan Privasi.</span>
      </div>
    </>
  );
}
