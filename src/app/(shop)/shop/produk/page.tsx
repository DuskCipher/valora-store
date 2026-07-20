"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ChevronDown, FileSearch, Trash2, Edit } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import styles from "./page.module.css";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  is_active: boolean;
  status: string;
  sold: number;
  views: number;
  rating: number;
  discount_price?: number;
  discount_percentage?: number;
}

export default function ProdukAndaPage() {
  const { user, supabaseUser } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      if (!supabaseUser) return;
      
      try {
        setIsLoading(true);
        // 1. Dapatkan store_id milik user
        const { data: store, error: storeError } = await supabase
          .from('stores')
          .select('id')
          .eq('owner_id', supabaseUser.id)
          .single();
          
        if (storeError || !store) {
          console.error("Gagal mengambil data toko:", storeError);
          setIsLoading(false);
          return;
        }

        // 2. Ambil produk dari store_id tersebut
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', store.id)
          .order('created_at', { ascending: false });

        if (productsError) {
          console.error("Gagal mengambil data produk:", productsError);
        } else if (productsData) {
          // 3. Ambil data penjualan asli dari tabel transactions
          const productIds = productsData.map(p => p.id);
          let salesMap: Record<string, { count: number, total: number }> = {};
          
          if (productIds.length > 0) {
            const { data: txs } = await supabase
              .from("transactions")
              .select("status, details")
              .eq("type", "order")
              .eq("status", "approved");
              
            if (txs) {
              txs.forEach((t: any) => {
                const items = t.details?.items || [];
                items.forEach((item: any) => {
                  const pid = item.product?.id || item.id;
                  if (productIds.includes(pid)) {
                    if (!salesMap[pid]) salesMap[pid] = { count: 0, total: 0 };
                    const qty = item.quantity || 1;
                    const price = item.variation 
                      ? (item.variation.discount_price ?? item.variation.price)
                      : (item.product?.discount_price ?? item.product?.price ?? item.price ?? 0);
                    
                    salesMap[pid].count += qty;
                    salesMap[pid].total += Number(price) * qty;
                  }
                });
              });
            }
          }

          const updatedProducts = productsData.map(p => ({
            ...p,
            sold: salesMap[p.id]?.count || p.sold || 0, // Prioritaskan data real transaksi
            real_total_nominal: salesMap[p.id]?.total || 0 // Simpan total nominal riil
          }));

          setProducts(updatedProducts);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setIsLoading(false);
      }
        };
    
        fetchProducts();
      }, [supabaseUser]);
    
      const handleDelete = async (productId: string) => {
        if (!confirm("Apakah Anda yakin ingin menghapus produk ini?")) return;
        
        try {
          const { error } = await supabase.from('products').delete().eq('id', productId);
          if (error) throw error;
          
          setProducts(products.filter(p => p.id !== productId));
          alert("Produk berhasil dihapus");
        } catch (err: any) {
          console.error("Gagal menghapus produk:", err);
          alert("Terjadi kesalahan saat menghapus produk");
        }
      };
    
      return (
    <div className={styles.container}>
      {/* Header Section */}
      <div className={styles.headerContainer}>
        <div className={styles.titleWrapper}>
          <div className={styles.titleBorder}></div>
          <h1 className={styles.pageTitle}>Your Products</h1>
        </div>

        <div className={styles.searchContainer}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            className={styles.searchInput} 
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button className={styles.filterBtn}>
          Filter <ChevronDown size={16} />
        </button>
      </div>

      {/* Table Section */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Produk</th>
              <th>Price & Variants</th>
              <th>Stok</th>
              <th>Penjualan</th>
              <th>Dilihat</th>
              <th>Rating</th>
              <th>Status</th>
              <th>Active Program</th>
              <th>Total Nominal</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* If there are products, map them here. Since screenshot shows empty state, we prioritize it when products.length === 0 */}
            {products.length > 0 ? (
              products.map((product, index) => (
                <tr key={product.id}>
                  <td>{index + 1}</td>
                  <td>{product.name}</td>
                  <td>
                    {product.discount_price ? (
                      <div>
                        <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '12px', display: 'block' }}>
                          Rp {product.price.toLocaleString("id-ID")}
                        </span>
                        <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                          Rp {Number(product.discount_price).toLocaleString("id-ID")}
                        </span>
                      </div>
                    ) : (
                      `Rp ${product.price.toLocaleString("id-ID")}`
                    )}
                  </td>
                  <td>{product.stock || 0}</td>
                  <td>{product.sold || 0}</td>
                  <td>{product.views > 0 ? (product.views >= 1000 ? `${(product.views / 1000).toFixed(1)}K` : product.views) : 0}</td>
                  <td>{(product.rating || 0).toFixed(1)}</td>
                  <td>{product.status || (product.is_active ? "published" : "draft")}</td>
                  <td>
                    {product.discount_percentage ? (
                      <span style={{ background: '#fee2e2', color: '#ef4444', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                        Diskon {product.discount_percentage}%
                      </span>
                    ) : "-"}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                    Rp {((product as any).real_total_nominal || 0).toLocaleString("id-ID")}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link href={`/shop/edit-produk/${product.id}`} style={{ color: 'var(--primary)', cursor: 'pointer' }}>
                        <Edit size={18} />
                      </Link>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}
                        title="Hapus Produk"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : null}
          </tbody>
        </table>

        {/* Empty State */}
        {!isLoading && products.length === 0 && (
          <div className={styles.emptyState}>
            <svg width="120" height="100" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="25" y="15" width="70" height="65" rx="4" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2"/>
              <line x1="40" y1="35" x2="60" y2="35" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round"/>
              <line x1="40" y1="45" x2="55" y2="45" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round"/>
              <line x1="40" y1="55" x2="65" y2="55" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="75" cy="65" r="18" fill="#ffffff" stroke="#94a3b8" strokeWidth="2"/>
              <path d="M75 55V60" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="75" cy="67" r="1.5" fill="#94a3b8"/>
              <line x1="88" y1="78" x2="100" y2="90" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round"/>
              <path d="M20 75C20 72.2386 22.2386 70 25 70H95C97.7614 70 100 72.2386 100 75V80H20V75Z" fill="#e2e8f0"/>
            </svg>
            <h3 className={styles.emptyStateTitle}>No products found</h3>
            <p className={styles.emptyStateDesc}>Sorry, we couldn&apos;t find any products</p>
          </div>
        )}
      </div>
    </div>
  );
}
