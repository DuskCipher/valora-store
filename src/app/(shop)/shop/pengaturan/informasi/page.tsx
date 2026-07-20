"use client";

import React, { useState, useEffect, useRef } from "react";
import { Upload, X } from "lucide-react";
import styles from "../layout.module.css";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export default function InformasiDasarPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [shopName, setShopName] = useState("");
  const [description, setDescription] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const shop = await authService.checkUserShop(user.id);
          if (shop) {
            setShopName(shop.name || "");
            setDescription(shop.description || "");
            if (shop.logo_url) {
              setLogoPreview(shop.logo_url);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsFetching(false);
      }
    };
    fetchShop();
  }, []);

  const handleFileSelect = (file: File) => {
    // Validasi tipe file
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Format file tidak didukung. Gunakan PNG, JPG, JPEG, atau WEBP.");
      return;
    }
    // Validasi ukuran (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran file terlalu besar. Maksimal 2MB.");
      return;
    }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    // Form Validation
    if (!shopName.trim()) {
      alert("Peringatan: Nama toko wajib diisi!");
      return;
    }
    if (!description.trim()) {
      alert("Peringatan: Deskripsi toko wajib diisi!");
      return;
    }
    if (!logoFile && !logoPreview) {
      alert("Peringatan: Logo toko wajib diunggah!");
      return;
    }

    try {
      setIsLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("Not authenticated");

      let logoUrl: string | undefined;

      // Upload logo jika ada file baru
      if (logoFile) {
        const fileExt = logoFile.name.split(".").pop();
        const fileName = `${authUser.id}/logo.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("store-logos")
          .upload(fileName, logoFile, { 
            upsert: true,
            contentType: logoFile.type
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          alert("Gagal upload logo. Error dari Supabase: " + (uploadError.message || JSON.stringify(uploadError)));
        } else {
          const { data: urlData } = supabase.storage
            .from("store-logos")
            .getPublicUrl(fileName);
          logoUrl = urlData.publicUrl;
        }
      }

      // Simpan data ke tabel stores di database
      await authService.upsertShopData({
        name: shopName,
        description: description,
        ...(logoUrl && { logo_url: logoUrl }),
        status: 'pending'
      });

      alert("Toko berhasil disimpan! Update sedang menunggu persetujuan Admin.");
      router.push("/shop/pengaturan/alamat");
    } catch (error) {
      console.error("Gagal menyimpan data:", error);
      alert("Gagal menyimpan data. Pastikan Anda sudah login dan script SQL sudah dijalankan di Supabase.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className={styles.section}>
        <div className={styles.sectionLeft}>
          <h2 className={styles.sectionTitle}>Informasi Dasar</h2>
          <p className={styles.sectionDesc}>
            Give your a shop name, description. You can only change shop name once a month.
          </p>
        </div>
        <div className={styles.sectionRight}>
          {isFetching ? (
            <p>Memuat data...</p>
          ) : (
            <>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nama Toko</label>
                <input 
                  type="text" 
                  className={styles.formInput} 
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="Masukkan nama toko..."
                />
              </div>
              <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                <label className={styles.formLabel}>Deskripsi toko</label>
                <textarea 
                  className={styles.formTextarea} 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ceritakan tentang tokomu..."
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLeft}>
          <h2 className={styles.sectionTitle}>Logo Toko</h2>
          <p className={styles.sectionDesc}>
            Upload your shop logo here. Dimensions of the logo should be 200x200 pixels.
          </p>
        </div>
        <div className={styles.sectionRight}>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleInputChange}
            style={{ display: "none" }}
          />

          {/* Upload area - clickable and drag-droppable */}
          <div
            className={styles.uploadArea}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              cursor: "pointer",
              borderColor: isDragging ? "var(--primary, #10b981)" : undefined,
              backgroundColor: isDragging ? "rgba(16, 185, 129, 0.05)" : undefined,
            }}
          >
            <div className={styles.uploadIcon}>
              <Upload size={24} />
            </div>
            <p className={styles.uploadText}>
              <span className={styles.uploadTextLink}>Klik untuk upload</span> atau drag & drop
            </p>
            <span className={styles.uploadFormats}>PNG, JPG, JPEG, WEBP (Maks. 2MB)</span>
          </div>
          
          {/* Logo preview */}
          {logoPreview && (
            <div style={{ position: "relative", display: "inline-block", marginTop: "12px" }}>
              <img 
                src={logoPreview} 
                alt="Logo Preview" 
                className={styles.imagePreview}
                style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 8 }}
              />
              <button
                onClick={removeLogo}
                style={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "2px solid white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.submitWrapper}>
        <button className={styles.submitBtn} onClick={handleSave} disabled={isLoading || isFetching}>
          {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>
    </>
  );
}

