"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  ArrowDown,
  FileSearch,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  X,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Tag,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import styles from "./page.module.css";

interface Product {
  id: string;
  name: string;
  price: number;
}

interface Variation {
  id: string;
  name: string;
  price: number;
}

interface Discount {
  id: string;
  product_id: string;
  variation_id: string | null;
  discount_type: "percentage" | "fixed";
  amount: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  products?: { name: string; price: number };
  product_variations?: { name: string; price: number } | null;
}

export default function DiskonPage() {
  const { supabaseUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Data
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [variations, setVariations] = useState<Variation[]>([]);

  // Form
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedVariationId, setSelectedVariationId] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [amount, setAmount] = useState<number>(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const perPage = 10;

  // ── Load store & data ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!supabaseUser) return;

    const init = async () => {
      setIsLoading(true);

      // Get store
      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", supabaseUser.id)
        .single();

      if (!store) { setIsLoading(false); return; }
      setStoreId(store.id);

      // Get products milik toko
      const { data: prods } = await supabase
        .from("products")
        .select("id, name, price")
        .eq("store_id", store.id)
        .eq("is_active", true)
        .order("name");

      setProducts(prods || []);

      // Get discounts
      await fetchDiscounts(store.id);
      setIsLoading(false);
    };

    init();
  }, [supabaseUser]);

  const fetchDiscounts = async (sid: string) => {
    const { data } = await supabase
      .from("discounts")
      .select(`
        *,
        products (name, price),
        product_variations (name, price)
      `)
      .eq("store_id", sid)
      .order("created_at", { ascending: false });

    setDiscounts(data || []);
  };

  // ── Load variations when product selected ─────────────────────────────────
  useEffect(() => {
    if (!selectedProductId) { setVariations([]); setSelectedVariationId(""); return; }

    const fetchVariations = async () => {
      const { data } = await supabase
        .from("product_variations")
        .select("id, name, price")
        .eq("product_id", selectedProductId);
      setVariations(data || []);
      setSelectedVariationId("");
    };
    fetchVariations();
  }, [selectedProductId]);

  // ── Submit form ──────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !selectedProductId || amount <= 0) {
      alert("Produk dan jumlah diskon wajib diisi!");
      return;
    }

    if (discountType === "percentage" && amount > 100) {
      alert("Diskon persentase tidak boleh lebih dari 100%!");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("discounts").insert({
        store_id: storeId,
        product_id: selectedProductId,
        variation_id: selectedVariationId || null,
        discount_type: discountType,
        amount,
        start_date: startDate || null,
        end_date: endDate || null,
        is_active: isActive,
      });

      if (error) throw error;

      // Update harga diskon di produk / variasi
      let basePrice = 0;
      if (selectedVariationId) {
        const variation = variations.find(v => v.id === selectedVariationId);
        if (variation) basePrice = variation.price;
      } else {
        const product = products.find(p => p.id === selectedProductId);
        if (product) basePrice = product.price;
      }

      if (basePrice > 0) {
        const discountedPrice = discountType === "percentage" 
          ? basePrice - (basePrice * amount / 100) 
          : basePrice - amount;
          
        if (selectedVariationId) {
          await supabase.from("product_variations")
            .update({ 
              discount_percentage: discountType === "percentage" ? amount : null, 
              discount_price: discountedPrice 
            })
            .eq("id", selectedVariationId);
        } else {
          await supabase.from("products")
            .update({ 
              discount_percentage: discountType === "percentage" ? amount : null, 
              discount_price: discountedPrice 
            })
            .eq("id", selectedProductId);
        }
      }

      await fetchDiscounts(storeId);
      resetForm();
      setIsModalOpen(false);
    } catch (err: any) {
      alert("Gagal membuat diskon: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (discount: Discount) => {
    await supabase
      .from("discounts")
      .update({ is_active: !discount.is_active })
      .eq("id", discount.id);
    if (storeId) await fetchDiscounts(storeId);
  };

  const handleDelete = async (discount: Discount) => {
    if (!confirm("Hapus diskon ini?")) return;

    // Reset discount di produk/variasi
    if (discount.variation_id) {
      await supabase.from("product_variations")
        .update({ discount_price: null, discount_percentage: null })
        .eq("id", discount.variation_id);
    } else {
      await supabase.from("products")
        .update({ discount_price: null, discount_percentage: null })
        .eq("id", discount.product_id);
    }

    await supabase.from("discounts").delete().eq("id", discount.id);
    if (storeId) await fetchDiscounts(storeId);
  };

  const resetForm = () => {
    setSelectedProductId("");
    setSelectedVariationId("");
    setDiscountType("percentage");
    setAmount(0);
    setStartDate("");
    setEndDate("");
    setIsActive(true);
  };

  // ── Filter & Pagination ───────────────────────────────────────────────────
  const filtered = discounts.filter(d =>
    d.products?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

  const getDiscountedPrice = (d: Discount) => {
    const basePrice = d.product_variations?.price ?? d.products?.price ?? 0;
    if (d.discount_type === "percentage") {
      return basePrice - (basePrice * d.amount / 100);
    }
    return basePrice - d.amount;
  };

  const isExpired = (end: string | null) => {
    if (!end) return false;
    return new Date(end) < new Date();
  };

  return (
    <div className={styles.container}>
      {/* Header Row */}
      <div className={styles.headerRow}>
        <div className={styles.titleWrapper}>
          <div className={styles.titleIndicator}></div>
          <h1 className={styles.pageTitle}>Diskon</h1>
        </div>
        <button className={styles.createBtn} onClick={() => setIsModalOpen(true)}>
          <Plus size={16} />
          Buat Diskon
        </button>
      </div>

      {/* Search & Filter */}
      <div className={styles.toolbarRow}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Cari berdasarkan nama produk"
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className={styles.filterBtn}>
          Filter <ArrowDown size={14} />
        </button>
      </div>

      {/* Content */}
      <div className={styles.contentCard}>
        {isLoading ? (
          <div className={styles.emptyState}>
            <p style={{ color: "var(--text-muted)" }}>Memuat data...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIllustration}>
              <div className={styles.emptyIllustrationBg}>
                <FileSearch size={56} color="#cbd5e1" strokeWidth={1} />
              </div>
            </div>
            <h3 className={styles.emptyTitle}>Belum Ada Diskon</h3>
            <p className={styles.emptyDesc}>Klik &quot;Buat Diskon&quot; untuk menambahkan diskon pada produk Anda.</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nama Produk</th>
                  <th>Variasi</th>
                  <th>Harga Asli</th>
                  <th>Diskon</th>
                  <th>Harga Setelah Diskon</th>
                  <th>Periode</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((d) => {
                  const expired = isExpired(d.end_date);
                  const statusLabel = !d.is_active ? "Nonaktif" : expired ? "Kedaluwarsa" : "Aktif";
                  const statusClass = !d.is_active ? styles.statusInactive : expired ? styles.statusExpired : styles.statusActive;
                  return (
                    <tr key={d.id}>
                      <td className={styles.productName}>
                        <Tag size={14} style={{ marginRight: 6, opacity: 0.5 }} />
                        {d.products?.name || "-"}
                      </td>
                      <td>{d.product_variations?.name || <span style={{ opacity: 0.4 }}>Semua</span>}</td>
                      <td>{formatCurrency(d.product_variations?.price ?? d.products?.price ?? 0)}</td>
                      <td className={styles.discountAmount}>
                        {d.discount_type === "percentage"
                          ? `-${d.amount}%`
                          : `-${formatCurrency(d.amount)}`}
                      </td>
                      <td className={styles.discountedPrice}>{formatCurrency(getDiscountedPrice(d))}</td>
                      <td style={{ fontSize: 12 }}>
                        {d.start_date ? d.start_date : "—"} s/d {d.end_date ? d.end_date : "∞"}
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${statusClass}`}>{statusLabel}</span>
                      </td>
                      <td>
                        <div className={styles.actionBtns}>
                          <button
                            className={styles.toggleBtn}
                            onClick={() => handleToggleActive(d)}
                            title={d.is_active ? "Nonaktifkan" : "Aktifkan"}
                          >
                            {d.is_active
                              ? <ToggleRight size={20} color="#10b981" />
                              : <ToggleLeft size={20} color="#94a3b8" />}
                          </button>
                          <button
                            className={styles.deleteBtn}
                            onClick={() => handleDelete(d)}
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className={styles.pagination}>
        <button className={styles.pageBtn} onClick={() => setPage(1)} disabled={page === 1}>
          <ChevronsLeft size={14} />
        </button>
        <button className={styles.pageBtn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
          <ChevronLeft size={14} />
        </button>
        <span className={styles.pageInfo}>{page} / {totalPages}</span>
        <button className={styles.pageBtn} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
          <ChevronRight size={14} />
        </button>
        <button className={styles.pageBtn} onClick={() => setPage(totalPages)} disabled={page === totalPages}>
          <ChevronsRight size={14} />
        </button>
      </div>

      {/* Create Discount Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Buat Diskon</h2>
              <button className={styles.modalCloseBtn} onClick={() => { setIsModalOpen(false); resetForm(); }}>
                <X size={20} />
              </button>
            </div>

            <form className={styles.modalForm} onSubmit={handleCreate}>
              {/* Pilih Produk */}
              <div className={styles.modalFormGroup}>
                <label className={styles.modalLabel}>Produk <span style={{ color: "red" }}>*</span></label>
                <select
                  className={styles.modalSelect}
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  required
                >
                  <option value="">-- Pilih Produk --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatCurrency(p.price)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Pilih Variasi */}
              <div className={styles.modalFormGroup}>
                <label className={styles.modalLabel}>Variasi <span style={{ fontSize: 12, color: "var(--text-muted)" }}>(opsional)</span></label>
                <select
                  className={`${styles.modalSelect} ${variations.length === 0 ? styles.modalSelectDisabled : ""}`}
                  value={selectedVariationId}
                  onChange={(e) => setSelectedVariationId(e.target.value)}
                  disabled={variations.length === 0}
                >
                  <option value="">Semua Variasi</option>
                  {variations.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({formatCurrency(v.price)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipe Diskon */}
              <div className={styles.modalFormGroup}>
                <label className={styles.modalLabel}>Tipe Diskon <span style={{ color: "red" }}>*</span></label>
                <select
                  className={styles.modalSelect}
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as "percentage" | "fixed")}
                >
                  <option value="percentage">Persentase (%)</option>
                  <option value="fixed">Nominal Tetap (Rp)</option>
                </select>
              </div>

              {/* Jumlah */}
              <div className={styles.modalFormGroup}>
                <label className={styles.modalLabel}>
                  Jumlah Diskon {discountType === "percentage" ? "(%)" : "(Rp)"} <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="number"
                  className={styles.modalInput}
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min={1}
                  max={discountType === "percentage" ? 100 : undefined}
                  placeholder={discountType === "percentage" ? "Contoh: 20" : "Contoh: 50000"}
                  required
                />
              </div>

              {/* Tanggal Mulai */}
              <div className={styles.modalFormGroup}>
                <label className={styles.modalLabel}>Tanggal Mulai</label>
                <input
                  type="date"
                  className={styles.modalInput}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              {/* Tanggal Selesai */}
              <div className={styles.modalFormGroup}>
                <label className={styles.modalLabel}>Tanggal Selesai</label>
                <input
                  type="date"
                  className={styles.modalInput}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || undefined}
                />
              </div>

              {/* Aktif */}
              <div className={styles.modalCheckboxGroup}>
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className={styles.modalCheckbox}
                />
                <label htmlFor="isActive" className={styles.modalCheckboxLabel}>
                  Langsung Aktifkan
                </label>
              </div>

              <button type="submit" className={styles.modalSubmitBtn} disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan..." : "Buat Diskon"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
