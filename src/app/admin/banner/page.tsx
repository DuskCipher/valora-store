"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, Upload, Edit, X, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Badge {
  text: string;
  type: "orange" | "green";
}

interface Banner {
  id?: string;
  type: "carousel" | "side_banner";
  badges?: Badge[];
  bullet_points?: string[];
  subtitle?: string;
  image_url?: string;
  link_url?: string;
  title?: string;
  description?: string;
  badge_text?: string;
  button_text?: string;
  order_index?: number;
  is_hidden?: boolean;
}

export default function AdminBannerPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State for editing/adding
  const [activeTab, setActiveTab] = useState<"carousel" | "side_banner">("carousel");
  
  // Carousel Form
  const [isEditingCarousel, setIsEditingCarousel] = useState(false);
  const [currentCarouselId, setCurrentCarouselId] = useState<string | null>(null);
  const [carouselSubtitle, setCarouselSubtitle] = useState("");
  const [carouselImageFile, setCarouselImageFile] = useState<File | null>(null);
  const [carouselImageUrl, setCarouselImageUrl] = useState("");
  const [carouselOrder, setCarouselOrder] = useState(0);
  const [carouselBadges, setCarouselBadges] = useState<Badge[]>([]);
  const [carouselBullets, setCarouselBullets] = useState<string[]>([]);

  // Temp badge inputs
  const [newBadgeText, setNewBadgeText] = useState("");
  const [newBadgeType, setNewBadgeType] = useState<"orange" | "green">("green");
  
  // Temp bullet input
  const [newBulletText, setNewBulletText] = useState("");

  // Side Banner Form
  const [sideBannerId, setSideBannerId] = useState<string | null>(null);
  const [sideBadgeText, setSideBadgeText] = useState("HOT PROMO");
  const [sideTitle, setSideTitle] = useState("Diskon Spesial 50%");
  const [sideDesc, setSideDesc] = useState("");
  const [sideBtnText, setSideBtnText] = useState("Beli Sekarang");
  const [sideLinkUrl, setSideLinkUrl] = useState("#");
  const [isSavingSide, setIsSavingSide] = useState(false);

  // Visibility states
  const [carouselHidden, setCarouselHidden] = useState(false);
  const [sideBannerHidden, setSideBannerHidden] = useState(false);

  useEffect(() => {
    const isAuth = localStorage.getItem("zaystore_admin_auth");
    if (isAuth !== "true") {
      router.push("/admin/login");
    } else {
      setIsAdmin(true);
      fetchBanners();
    }
  }, [router]);

  const fetchBanners = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) {
        console.error("Error fetching banners:", error);
      } else if (data) {
        setBanners(data);

        // Load carousel visibility from localStorage
        const carouselHiddenStored = localStorage.getItem("zaystore_carousel_hidden");
        setCarouselHidden(carouselHiddenStored === "true");

        // Load side banner if exists
        const side = data.find((b) => b.type === "side_banner");
        if (side) {
          setSideBannerId(side.id || null);
          setSideBadgeText(side.badge_text || "HOT PROMO");
          setSideTitle(side.title || "");
          setSideDesc(side.description || "");
          setSideBtnText(side.button_text || "Beli Sekarang");
          setSideLinkUrl(side.link_url || "#");
          setSideBannerHidden(side.is_hidden || false);
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `banners/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    // Upload to existing store-logos bucket to avoid creating new bucket errors
    const { data, error } = await supabase.storage
      .from("store-logos")
      .upload(fileName, file, { upsert: true });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from("store-logos")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const handleSaveCarousel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carouselSubtitle) {
      alert("Subtitle / Nama Banner harus diisi!");
      return;
    }

    try {
      setIsLoading(true);
      let imageUrl = carouselImageUrl;

      if (carouselImageFile) {
        imageUrl = await handleUploadImage(carouselImageFile);
      }

      const payload: Banner = {
        type: "carousel",
        subtitle: carouselSubtitle,
        image_url: imageUrl,
        order_index: Number(carouselOrder),
        badges: carouselBadges,
        bullet_points: carouselBullets
      };

      if (currentCarouselId) {
        // Update
        const { error } = await supabase
          .from("banners")
          .update(payload)
          .eq("id", currentCarouselId);
        
        if (error) throw error;
        alert("Banner carousel berhasil diperbarui!");
      } else {
        // Insert
        const { error } = await supabase
          .from("banners")
          .insert([payload]);

        if (error) throw error;
        alert("Banner carousel baru berhasil ditambahkan!");
      }

      resetCarouselForm();
      fetchBanners();
    } catch (err: any) {
      console.error("Save carousel error:", err);
      alert("Gagal menyimpan banner: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetCarouselForm = () => {
    setIsEditingCarousel(false);
    setCurrentCarouselId(null);
    setCarouselSubtitle("");
    setCarouselImageFile(null);
    setCarouselImageUrl("");
    setCarouselOrder(0);
    setCarouselBadges([]);
    setCarouselBullets([]);
  };

  const handleEditCarousel = (b: Banner) => {
    setIsEditingCarousel(true);
    setCurrentCarouselId(b.id || null);
    setCarouselSubtitle(b.subtitle || "");
    setCarouselImageUrl(b.image_url || "");
    setCarouselOrder(b.order_index || 0);
    setCarouselBadges(b.badges || []);
    setCarouselBullets(b.bullet_points || []);
    setCarouselImageFile(null);
  };

  const handleDeleteCarousel = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus banner carousel ini?")) return;

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from("banners")
        .delete()
        .eq("id", id);

      if (error) throw error;
      alert("Banner carousel berhasil dihapus!");
      fetchBanners();
    } catch (err: any) {
      alert("Gagal menghapus: " + err.message);
      setIsLoading(false);
    }
  };

  const handleSaveSideBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSide(true);
    try {
      const payload: Banner = {
        type: "side_banner",
        badge_text: sideBadgeText,
        title: sideTitle,
        description: sideDesc,
        button_text: sideBtnText,
        link_url: sideLinkUrl,
        is_hidden: sideBannerHidden
      };

      if (sideBannerId) {
        const { error } = await supabase
          .from("banners")
          .update(payload)
          .eq("id", sideBannerId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("banners")
          .insert([payload]);

        if (error) throw error;
      }

      alert("Promo Banner Samping berhasil disimpan!");
      fetchBanners();
    } catch (err: any) {
      console.error(err);
      alert("Gagal menyimpan: " + err.message);
    } finally {
      setIsSavingSide(false);
    }
  };

  // Toggle carousel visibility
  const handleToggleCarousel = async () => {
    const newState = !carouselHidden;
    setCarouselHidden(newState);
    localStorage.setItem("zaystore_carousel_hidden", String(newState));

    // Update all carousel banners' is_hidden field
    try {
      const { error } = await supabase
        .from("banners")
        .update({ is_hidden: newState })
        .eq("type", "carousel");

      if (error) throw error;
      alert(newState ? "Carousel banner disembunyikan!" : "Carousel banner ditampilkan!");
      fetchBanners();
    } catch (err: any) {
      console.error(err);
      alert("Gagal mengubah visibilitas: " + err.message);
    }
  };

  // Toggle side banner visibility
  const handleToggleSideBanner = async () => {
    const newState = !sideBannerHidden;
    setSideBannerHidden(newState);

    try {
      if (sideBannerId) {
        const { error } = await supabase
          .from("banners")
          .update({ is_hidden: newState })
          .eq("id", sideBannerId);

        if (error) throw error;
      }
      alert(newState ? "Promo Banner Samping disembunyikan!" : "Promo Banner Samping ditampilkan!");
      fetchBanners();
    } catch (err: any) {
      console.error(err);
      alert("Gagal mengubah visibilitas: " + err.message);
    }
  };

  // Badge helpers
  const addBadge = () => {
    if (!newBadgeText.trim()) return;
    setCarouselBadges([...carouselBadges, { text: newBadgeText, type: newBadgeType }]);
    setNewBadgeText("");
  };

  const removeBadge = (index: number) => {
    setCarouselBadges(carouselBadges.filter((_, i) => i !== index));
  };

  // Bullet helpers
  const addBullet = () => {
    if (!newBulletText.trim()) return;
    setCarouselBullets([...carouselBullets, newBulletText]);
    setNewBulletText("");
  };

  const removeBullet = (index: number) => {
    setCarouselBullets(carouselBullets.filter((_, i) => i !== index));
  };

  if (isAdmin === false) return <div style={{ padding: 40 }}>Akses Ditolak</div>;

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 24, color: "var(--text-main)" }}>Pengaturan Banner Beranda</h1>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
        <button
          onClick={() => setActiveTab("carousel")}
          style={{
            padding: "10px 20px",
            background: activeTab === "carousel" ? "var(--primary)" : "none",
            color: activeTab === "carousel" ? "white" : "var(--text-muted)",
            border: "none",
            borderRadius: "6px",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          Carousel Slides (Kiri)
        </button>
        <button
          onClick={() => setActiveTab("side_banner")}
          style={{
            padding: "10px 20px",
            background: activeTab === "side_banner" ? "var(--primary)" : "none",
            color: activeTab === "side_banner" ? "white" : "var(--text-muted)",
            border: "none",
            borderRadius: "6px",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          Promo Banner Samping (Kanan)
        </button>
      </div>

      {isLoading && <div style={{ padding: "20px", color: "var(--text-muted)" }}>Memuat data banner...</div>}

      {/* CAROUSEL SECTION */}
      {!isLoading && activeTab === "carousel" && (
        <div style={{ display: "grid", gridTemplateColumns: isEditingCarousel ? "1fr 1fr" : "1fr", gap: "24px" }}>
          
          {/* List of Carousel Slides */}
          <div style={{ background: "var(--bg-card)", padding: "24px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "bold" }}>Daftar Slide</h2>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {/* Hide/Show Toggle */}
                <button
                  onClick={handleToggleCarousel}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    background: carouselHidden ? "#ef4444" : "#22c55e",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    fontSize: "13px"
                  }}
                >
                  {carouselHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                  {carouselHidden ? "Disembunyikan" : "Ditampilkan"}
                </button>
                {!isEditingCarousel && (
                  <button
                    onClick={() => setIsEditingCarousel(true)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 16px",
                      background: "var(--primary)",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      fontSize: "14px"
                    }}
                  >
                    <Plus size={16} /> Tambah Slide
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {banners
                .filter((b) => b.type === "carousel")
                .map((b) => (
                  <div key={b.id} style={{ display: "flex", gap: "16px", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-main)", alignItems: "center" }}>
                    {b.image_url ? (
                      <img src={b.image_url} alt="" style={{ width: "100px", height: "60px", objectFit: "cover", borderRadius: "6px" }} />
                    ) : (
                      <div style={{ width: "100px", height: "60px", background: "#e2e8f0", borderRadius: "6px" }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
                        {b.badges?.map((badge, i) => (
                          <span key={i} style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold", background: badge.type === "green" ? "#d1fae5" : "#ffe4e6", color: badge.type === "green" ? "#065f46" : "#9f1239" }}>
                            {badge.text}
                          </span>
                        ))}
                      </div>
                      <h4 style={{ fontWeight: "bold", fontSize: "14px", color: "var(--text-main)" }}>{b.subtitle}</h4>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Urutan: {b.order_index}</span>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => handleEditCarousel(b)}
                        style={{ padding: "8px", background: "none", border: "1px solid var(--border-color)", borderRadius: "6px", cursor: "pointer", color: "var(--text-muted)" }}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteCarousel(b.id!)}
                        style={{ padding: "8px", background: "none", border: "1px solid #fee2e2", borderRadius: "6px", cursor: "pointer", color: "var(--danger)" }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              
              {banners.filter((b) => b.type === "carousel").length === 0 && (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  Belum ada slide banner. Default web akan digunakan.
                </div>
              )}
            </div>
          </div>

          {/* Form Create / Edit Slide */}
          {isEditingCarousel && (
            <div style={{ background: "var(--bg-card)", padding: "24px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: "bold" }}>
                  {currentCarouselId ? "Edit Slide Carousel" : "Tambah Slide Carousel"}
                </h2>
                <button
                  onClick={resetCarouselForm}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveCarousel} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "14px", fontWeight: "600" }}>Nama Banner / Subtitle (Bawah)</label>
                  <input
                    type="text"
                    value={carouselSubtitle}
                    onChange={(e) => setCarouselSubtitle(e.target.value)}
                    placeholder="Contoh: Whatsapp Gateway v9.7.2 | Rp500.000"
                    style={{ padding: "10px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-main)" }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "14px", fontWeight: "600" }}>Gambar Mockup Banner</label>
                  {carouselImageUrl && !carouselImageFile && (
                    <div style={{ position: "relative", display: "inline-block", width: "120px", marginBottom: "8px" }}>
                      <img src={carouselImageUrl} alt="" style={{ width: "120px", height: "70px", objectFit: "cover", borderRadius: "6px" }} />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCarouselImageFile(e.target.files?.[0] || null)}
                    style={{ padding: "8px 0" }}
                  />
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    *Rekomendasi ukuran Desktop: 1200x500 px. Ukuran Mobile: 800x400 px (Rasio 2:1).
                  </span>
                  {!carouselImageFile && (
                    <input
                      type="text"
                      value={carouselImageUrl}
                      onChange={(e) => setCarouselImageUrl(e.target.value)}
                      placeholder="Atau masukkan URL Gambar langsung..."
                      style={{ padding: "10px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-main)", fontSize: "12px" }}
                    />
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "14px", fontWeight: "600" }}>Urutan Tampil (Order Index)</label>
                  <input
                    type="number"
                    value={carouselOrder}
                    onChange={(e) => setCarouselOrder(Number(e.target.value))}
                    style={{ width: "100px", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-main)" }}
                  />
                </div>

                {/* Badges UI */}
                <div style={{ border: "1px solid var(--border-color)", padding: "12px", borderRadius: "8px" }}>
                  <label style={{ fontSize: "14px", fontWeight: "600", display: "block", marginBottom: "8px" }}>Daftar Badge (Atas)</label>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
                    {carouselBadges.map((badge, idx) => (
                      <span
                        key={idx}
                        onClick={() => removeBadge(idx)}
                        style={{
                          fontSize: "11px",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontWeight: "bold",
                          background: badge.type === "green" ? "#d1fae5" : "#ffe4e6",
                          color: badge.type === "green" ? "#065f46" : "#9f1239",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                        title="Klik untuk menghapus"
                      >
                        {badge.text} <X size={10} />
                      </span>
                    ))}
                    {carouselBadges.length === 0 && <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Belum ada badge</span>}
                  </div>
                  
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      value={newBadgeText}
                      onChange={(e) => setNewBadgeText(e.target.value)}
                      placeholder="Text badge baru..."
                      style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-main)", fontSize: "13px" }}
                    />
                    <select
                      value={newBadgeType}
                      onChange={(e: any) => setNewBadgeType(e.target.value)}
                      style={{ padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-main)" }}
                    >
                      <option value="green">Hijau (Instant/Free)</option>
                      <option value="orange">Orange (Diskon/Promo)</option>
                    </select>
                    <button
                      type="button"
                      onClick={addBadge}
                      style={{ padding: "8px 12px", background: "var(--primary)", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
                    >
                      Tambah
                    </button>
                  </div>
                </div>

                {/* Bullet Points UI */}
                <div style={{ border: "1px solid var(--border-color)", padding: "12px", borderRadius: "8px" }}>
                  <label style={{ fontSize: "14px", fontWeight: "600", display: "block", marginBottom: "8px" }}>Fitur / Keunggulan (List Poin)</label>
                  <ul style={{ paddingLeft: "20px", marginBottom: "12px" }}>
                    {carouselBullets.map((bullet, idx) => (
                      <li
                        key={idx}
                        onClick={() => removeBullet(idx)}
                        style={{ fontSize: "13px", color: "var(--text-muted)", cursor: "pointer", marginBottom: "4px" }}
                        title="Klik untuk menghapus"
                      >
                        {bullet} <X size={10} style={{ display: "inline", verticalAlign: "middle" }} />
                      </li>
                    ))}
                    {carouselBullets.length === 0 && <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Belum ada poin</span>}
                  </ul>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      value={newBulletText}
                      onChange={(e) => setNewBulletText(e.target.value)}
                      placeholder="Poin keunggulan baru..."
                      style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-main)", fontSize: "13px" }}
                    />
                    <button
                      type="button"
                      onClick={addBullet}
                      style={{ padding: "8px 12px", background: "var(--primary)", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
                    >
                      Tambah
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "12px",
                    background: "var(--primary)",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "bold",
                    cursor: "pointer"
                  }}
                >
                  <Save size={18} /> Simpan Slide
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* SIDE BANNER SECTION */}
      {!isLoading && activeTab === "side_banner" && (
        <div style={{ maxWidth: "600px", background: "var(--bg-card)", padding: "24px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "bold" }}>Edit Banner Promo Samping</h2>
            <button
              onClick={handleToggleSideBanner}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                background: sideBannerHidden ? "#ef4444" : "#22c55e",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: "13px"
              }}
            >
              {sideBannerHidden ? <EyeOff size={16} /> : <Eye size={16} />}
              {sideBannerHidden ? "Disembunyikan" : "Ditampilkan"}
            </button>
          </div>
          
          <form onSubmit={handleSaveSideBanner} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "14px", fontWeight: "600" }}>Badge Text (Atas)</label>
              <input
                type="text"
                value={sideBadgeText}
                onChange={(e) => setSideBadgeText(e.target.value)}
                placeholder="Contoh: HOT PROMO"
                style={{ padding: "10px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-main)" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "14px", fontWeight: "600" }}>Judul Promo</label>
              <input
                type="text"
                value={sideTitle}
                onChange={(e) => setSideTitle(e.target.value)}
                placeholder="Contoh: Diskon Spesial 50%"
                style={{ padding: "10px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-main)" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "14px", fontWeight: "600" }}>Deskripsi Promo</label>
              <textarea
                value={sideDesc}
                onChange={(e) => setSideDesc(e.target.value)}
                placeholder="Deskripsi singkat..."
                style={{ padding: "10px", height: "80px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-main)", resize: "none" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "14px", fontWeight: "600" }}>Text Tombol Beli</label>
              <input
                type="text"
                value={sideBtnText}
                onChange={(e) => setSideBtnText(e.target.value)}
                placeholder="Contoh: Beli Sekarang"
                style={{ padding: "10px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-main)" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "14px", fontWeight: "600" }}>URL Link Beli</label>
              <input
                type="text"
                value={sideLinkUrl}
                onChange={(e) => setSideLinkUrl(e.target.value)}
                placeholder="Contoh: /product/mpwa-gateway"
                style={{ padding: "10px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-main)" }}
              />
            </div>

            <button
              type="submit"
              disabled={isSavingSide}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "12px",
                background: "var(--primary)",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontWeight: "bold",
                cursor: "pointer",
                marginTop: "10px"
              }}
            >
              <Save size={18} /> {isSavingSide ? "Menyimpan..." : "Simpan Promo Samping"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
