"use client";

import React, { useState, useEffect } from "react";
import styles from "../layout.module.css";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export default function AlamatPage() {
  const router = useRouter();
  const { supabaseUser } = useAuth();
  
  const [storeId, setStoreId] = useState<string | null>(null);
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Indonesia");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchAddress = async () => {
      if (!supabaseUser) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('id, city, province, postal_code, address')
          .eq('owner_id', supabaseUser.id)
          .single();

        if (error) {
          console.error("Error fetching store:", error);
        } else if (data) {
          setStoreId(data.id);
          setCity(data.city || "");
          setProvince(data.province || "");
          setPostalCode(data.postal_code || "");
          setAddress(data.address || "");
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAddress();
  }, [supabaseUser]);

  const handleSave = async () => {
    if (!storeId) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('stores')
        .update({
          city,
          province,
          postal_code: postalCode,
          address,
          status: 'pending'
        })
        .eq('id', storeId);

      if (error) {
        console.error("Error updating address:", error);
        alert("Gagal menyimpan alamat.");
      } else {
        alert("Alamat berhasil disimpan!");
        router.push("/shop/pengaturan/rekening");
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: "24px" }}>Memuat data alamat...</div>;
  }

  return (
    <>
      <div className={styles.formCard}>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Kota</label>
            <input type="text" className={styles.formInput} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Contoh: Purwokerto" />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Negara</label>
            <select className={styles.formSelect} value={country} onChange={(e) => setCountry(e.target.value)}>
              <option value="Indonesia">Indonesia</option>
            </select>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Provinsi</label>
            <input type="text" className={styles.formInput} value={province} onChange={(e) => setProvince(e.target.value)} placeholder="Contoh: Jawa Tengah" />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Kode Pos</label>
            <input type="text" className={styles.formInput} value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="Contoh: 53123" />
          </div>
        </div>

        <div className={styles.formGroup} style={{ marginBottom: 0 }}>
          <label className={styles.formLabel}>Alamat</label>
          <textarea className={styles.formTextarea} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Alamat lengkap jalan, RT/RW, dll." />
        </div>
      </div>

      <div className={styles.submitWrapper}>
        <button className={styles.submitBtn} onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>
    </>
  );
}
