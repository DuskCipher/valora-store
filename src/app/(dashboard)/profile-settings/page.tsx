"use client";

import React, { useState, useEffect, useRef } from "react";
import { User, Mail, Phone, MapPin, Save, Camera } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import styles from "./page.module.css";
import sharedStyles from "../payment-history/page.module.css";

export default function ProfileSettingsPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    bio: ""
  });
  const { refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (profile) {
            setFormData({
              name: profile.full_name || user.user_metadata?.full_name || user.user_metadata?.name || "",
              email: profile.email || user.email || "",
              phone: profile.phone_number || user.user_metadata?.phone_number || user.user_metadata?.phone || "",
              address: profile.address || "",
              bio: profile.bio || ""
            });
            setAvatarUrl(profile.avatar_url || null);
          } else {
            // Jika row profil belum ada di database, gunakan data dari akun Auth (saat pendaftaran)
            setFormData({
              name: user.user_metadata?.full_name || user.user_metadata?.name || "",
              email: user.email || "",
              phone: user.user_metadata?.phone_number || user.user_metadata?.phone || "",
              address: "",
              bio: ""
            });
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Hanya file gambar yang diperbolehkan.");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran file maksimal 2MB.");
      return;
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop();
      const filePath = `avatars/${user.id}/avatar.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw new Error("STORAGE_ERROR: " + uploadError.message);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl + `?t=${Date.now()}`;

      // Update profile with avatar URL
      // Check if profile exists first
      const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", user.id).single();
      
      let updateError;
      if (existingProfile) {
        const { error } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
        updateError = error;
      } else {
        const { error } = await supabase.from("profiles").insert({ id: user.id, avatar_url: publicUrl });
        updateError = error;
      }

      if (updateError) {
        console.error("Profile update error:", updateError);
        throw new Error("PROFILE_ERROR: " + updateError.message);
      }

      setAvatarUrl(publicUrl);
      await refreshProfile();
      alert("Foto profil berhasil diperbarui!");
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      alert("Gagal mengunggah foto: " + (error.message || "Terjadi kesalahan"));
    } finally {
      setIsUploading(false);
      // Reset input so user can re-upload the same file
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: formData.name,
          phone_number: formData.phone,
          address: formData.address,
          bio: formData.bio,
        });

      if (error) throw error;
      // Sinkronkan data ke seluruh aplikasi (sidebar, header, dll)
      await refreshProfile();
      alert("Profil berhasil diperbarui!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Gagal memperbarui profil.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className={sharedStyles.container}><p>Memuat data profil...</p></div>;
  }

  const displayAvatar = avatarUrl
    ? avatarUrl
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || "User")}&background=random&size=150`;

  return (
    <div className={sharedStyles.container}>
      <header className={sharedStyles.header}>
        <h1 className={sharedStyles.title}>Profile</h1>
        <p className={sharedStyles.subtitle}>Kelola informasi profil Anda</p>
      </header>

      {/* Profile Card */}
      <div className={styles.profileCard}>
        <div className={styles.avatarSection}>
          <div className={styles.avatarLarge} style={{ position: "relative", cursor: "pointer" }} onClick={() => fileInputRef.current?.click()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={displayAvatar} alt="Avatar" className={styles.avatarImg} />
            <div className={styles.cameraIcon}>
              <Camera size={14} color="white" />
            </div>
            {isUploading && (
              <div style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                background: "rgba(0,0,0,0.5)", display: "flex",
                alignItems: "center", justifyContent: "center",
                color: "white", fontSize: 12, fontWeight: "bold",
              }}>
                Uploading...
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleAvatarUpload}
          />
          <div className={styles.avatarInfo}>
            <h3 className={styles.avatarName}>{formData.name || "User"}</h3>
            <p className={styles.avatarEmail}>{formData.email}</p>
            <button
              className={styles.changeAvatarBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? "Mengunggah..." : "Ganti Foto"}
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className={styles.formCard}>
        <h3 className={styles.formTitle}>Informasi Pribadi</h3>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              <User size={14} /> Nama Lengkap
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className={styles.formInput}
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              <Mail size={14} /> Email
            </label>
            <input
              type="email"
              value={formData.email}
              disabled
              className={styles.formInput}
              style={{ backgroundColor: "var(--bg-input)", cursor: "not-allowed", opacity: 0.7 }}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              <Phone size={14} /> Nomor Telepon
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className={styles.formInput}
              placeholder="Masukkan nomor telepon"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              <MapPin size={14} /> Alamat
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className={styles.formInput}
              placeholder="Masukkan alamat"
            />
          </div>
        </div>

        <div className={styles.formGroupFull}>
          <label className={styles.formLabel}>Bio</label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({...formData, bio: e.target.value})}
            className={styles.formTextarea}
            placeholder="Ceritakan sedikit tentang Anda..."
            rows={3}
          />
        </div>

        <div className={styles.formActions}>
          <button className={styles.saveBtn} onClick={handleSave} disabled={isSaving}>
            <Save size={16} /> {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </div>
    </div>
  );
}
