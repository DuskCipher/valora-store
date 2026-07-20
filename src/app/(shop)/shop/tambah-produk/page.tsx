"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  Info,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { RichTextEditor } from "@/components/RichTextEditor";
import { TagInput } from "@/components/TagInput";
import styles from "./page.module.css";

interface Variation {
  name: string;
  price: number;
  stock: number;
}

export default function TambahProdukPage() {
  const { user, supabaseUser } = useAuth();
  
  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [faqContent, setFaqContent] = useState("");
  const [priceType, setPriceType] = useState<"paid" | "free">("paid");
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(10);
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [instantDelivery, setInstantDelivery] = useState(false);
  const [variations, setVariations] = useState<Variation[]>([]);

  // Additional form state
  const [productType, setProductType] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [deliveryTime, setDeliveryTime] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [allowDownload, setAllowDownload] = useState(false);
  const [allowBargain, setAllowBargain] = useState(false);
  const [status, setStatus] = useState("published");

  // File URL state (link-based, not upload)
  const [fileUrl, setFileUrl] = useState("");
  const [variationFileUrls, setVariationFileUrls] = useState<string[]>([]);


  const addVariation = () => {
    if (variations.length < 3) {
      setVariations([...variations, { name: "", price: 0, stock: 10 }]);
    }
  };

  const removeVariation = (index: number) => {
    setVariations(variations.filter((_, i) => i !== index));
  };

  // Image Upload State & Handlers
  const [productImages, setProductImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    
    // Filter valid files
    const validFiles = fileArray.filter((file) => {
      if (!allowedTypes.includes(file.type)) {
        alert(`Format file ${file.name} tidak didukung.`);
        return false;
      }
      if (file.size > 2 * 1024 * 1024) {
        alert(`Ukuran file ${file.name} terlalu besar (Maks 2MB).`);
        return false;
      }
      return true;
    });

    if (productImages.length + validFiles.length > 4) {
      alert("Maksimal 4 gambar diperbolehkan.");
      return;
    }

    const newFiles = [...productImages, ...validFiles].slice(0, 4);
    setProductImages(newFiles);

    // Generate previews
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews(newPreviews);
  };

  const removeImage = (index: number) => {
    const newFiles = [...productImages];
    newFiles.splice(index, 1);
    setProductImages(newFiles);

    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
    
    if (fileInputRef.current) fileInputRef.current.value = "";
  };


  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Add new product</h1>

      {/* Section 1: Gambar Produk */}
      <div className={styles.section}>
        <div className={styles.sectionLeft}>
          <h2 className={styles.sectionTitle}>Gambar Produk</h2>
          <p className={styles.sectionDesc}>
            Unggah gambar produk Anda di sini, maksimal 4 gambar.
            <br />
            Ukuran gambar tidak boleh lebih dari 2 MB
          </p>
        </div>
        <div className={styles.sectionRight}>
          <input
            type="file"
            multiple
            accept="image/png,image/jpeg,image/jpg,image/webp"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files) handleFileSelect(e.target.files);
            }}
          />

          <div
            className={styles.uploadArea}
            onClick={() => {
              if (productImages.length < 4) fileInputRef.current?.click();
            }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (productImages.length < 4 && e.dataTransfer.files) {
                handleFileSelect(e.dataTransfer.files);
              }
            }}
            style={{
              cursor: productImages.length < 4 ? "pointer" : "not-allowed",
              borderColor: isDragging ? "var(--primary, #10b981)" : undefined,
              backgroundColor: isDragging ? "rgba(16, 185, 129, 0.05)" : undefined,
              opacity: productImages.length >= 4 ? 0.5 : 1
            }}
          >
            <div className={styles.uploadIcon}>
              <Upload size={24} />
            </div>
            <p className={styles.uploadText}>
              <span className={styles.uploadTextLink}>Klik untuk upload</span> atau drag & drop
            </p>
            <span className={styles.uploadFormats}>PNG, JPG, JPEG, WEBP (Maks 2MB, hingga 4 gambar)</span>
          </div>

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div style={{ display: "flex", gap: "12px", marginTop: "16px", flexWrap: "wrap" }}>
              {imagePreviews.map((preview, index) => (
                <div key={index} style={{ position: "relative", width: 100, height: 100 }}>
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8, border: "1px solid #e2e8f0" }}
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); removeImage(index); }}
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
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Informasi Dasar */}
      <div className={styles.section}>
        <div className={styles.sectionLeft}>
          <h2 className={styles.sectionTitle}>Informasi Dasar</h2>
          <p className={styles.sectionDesc}>
            Masukkan juga FAQ yang mungkin dimiliki pelanggan tentang produk Anda.
          </p>
        </div>
        <div className={styles.sectionRight}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Nama<span className={styles.required}>*</span>
            </label>
            <input 
              type="text" 
              className={styles.formInput} 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <div className={styles.labelRow}>
              <label className={styles.formLabel} style={{ marginBottom: 0 }}>
                Deskripsi Produk <span className={styles.required}>*</span>
              </label>
              <button className={styles.aiGenBtn}>Generate Description With AI</button>
            </div>
            <RichTextEditor
              placeholder="Tulis deskripsi produk..."
              onChange={(html) => setDescription(html)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              FAQ Produk <span className={styles.required}>*</span>
            </label>
            <RichTextEditor
              placeholder="Tulis FAQ produk..."
              onChange={(html) => setFaqContent(html)}
            />
          </div>
        </div>
      </div>

      {/* Section 3: Tipe, Kategori, dan Tag */}
      <div className={styles.section}>
        <div className={styles.sectionLeft}>
          <h2 className={styles.sectionTitle}>Tipe, Kategori, dan Tag</h2>
          <p className={styles.sectionDesc}>
            Tentukan tipe, kategori, dan tag untuk produk Anda. Informasi ini
            membantu mengkategorikan produk Anda dan memudahkan pelanggan untuk menemukannya.
          </p>
        </div>
        <div className={styles.sectionRight}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Tipe Produk <span className={styles.required}>*</span>
            </label>
            <select className={styles.formSelect} value={productType} onChange={(e) => setProductType(e.target.value)}>
              <option value="">Pilih Tipe Produk</option>
              <option value="digital">Digital</option>
              <option value="fisik">Fisik</option>
              <option value="jasa">Jasa</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Kategori Produk<span className={styles.required}>*</span>
            </label>
            <select className={styles.formSelect} value={categoryId || ""} onChange={(e) => setCategoryId(e.target.value || null)}>
              <option value="">Pilih Kategori Produk</option>
              <option value="Semua">Semua</option>
              <option value="Website">Website</option>
              <option value="Ebook">Ebook</option>
              <option value="Graphic Design">Graphic Design</option>
              <option value="Akun Digital">Akun Digital</option>
              <option value="Web Design & Templates">Web Design & Templates</option>
              <option value="Source Code">Source Code</option>
            </select>
            <p className={styles.formHint}>Please select product type first</p>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Tag <span className={styles.required}>*</span>
            </label>
            <TagInput 
              tags={tags}
              onChange={setTags}
              placeholder="Tambahkan tag..."
            />
          </div>
        </div>
      </div>

      {/* Section 4: Pengiriman dan Harga Produk */}
      <div className={styles.section}>
        <div className={styles.sectionLeft}>
          <h2 className={styles.sectionTitle}>Pengiriman dan Harga Produk</h2>
          <p className={styles.sectionDesc}>
            Tambahkan opsi pengiriman dan detail harga untuk produk digital Anda.
            Ini termasuk apakah produk dikirim secara instan, perkiraan waktu
            pengiriman jika tidak instan, dan harga serta stok produk.
            <br /><br />
            Jika produk Anda adalah Jasa dan Anda membutuhkan waktu untuk
            menyelesaikannya, Anda dapat mengatur pengiriman tidak instan, dan
            mengatur perkiraan waktu pengiriman.
          </p>
        </div>
        <div className={styles.sectionRight}>
          <div className={styles.checkboxGroup}>
            <input
              type="checkbox"
              id="instantDelivery"
              checked={instantDelivery}
              onChange={(e) => setInstantDelivery(e.target.checked)}
              className={styles.checkbox}
            />
            <label htmlFor="instantDelivery" className={styles.checkboxLabel}>
              Pengiriman Instan
            </label>
          </div>

          {!instantDelivery && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Perkiraan Waktu Pengiriman</label>
              <input
                type="text"
                className={styles.formInput}
                placeholder="Perkiraan pengiriman produk"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
              />
            </div>
          )}

          <div className={styles.formGroup} style={{ marginBottom: "20px" }}>
            <label className={styles.formLabel}>Tipe Harga</label>
            <div style={{ display: "flex", gap: "24px", marginTop: "8px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#64748b", cursor: "pointer" }}>
                <input type="radio" name="priceType" value="paid" checked={priceType === "paid"} onChange={() => setPriceType("paid")} style={{ accentColor: "#10b981", width: "16px", height: "16px" }} />
                Berbayar
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#64748b", cursor: "pointer" }}>
                <input type="radio" name="priceType" value="free" checked={priceType === "free"} onChange={() => { setPriceType("free"); setPrice(0); }} style={{ accentColor: "#10b981", width: "16px", height: "16px" }} />
                Gratis
              </label>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Harga</label>
              <input 
                type="number" 
                className={styles.formInput} 
                value={priceType === "free" ? 0 : price}
                onChange={(e) => setPrice(Number(e.target.value))}
                disabled={priceType === "free"}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Stok<span className={styles.required}>*</span>
              </label>
              <input 
                type="number" 
                className={styles.formInput} 
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: Variasi Produk */}
      <div className={styles.section}>
        <div className={styles.sectionLeft}>
          <h2 className={styles.sectionTitle}>Variasi Produk</h2>
          <p className={styles.sectionDesc}>
            Tambahkan variasi untuk produk digital Anda. Misalnya, jika Anda
            menjual perangkat lunak, setiap versi atau paket bisa menjadi
            variasi yang berbeda dengan harga masing-masing. Anda dapat
            menambahkan hingga 3 variasi untuk sebuah produk.
          </p>
        </div>
        <div className={styles.sectionRight}>
          {variations.length > 0 && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Nama Variasi Default <span className={styles.infoIcon}>i</span>
              </label>
              <input
                type="text"
                className={styles.formInput}
                defaultValue="Default"
                style={{ maxWidth: 200 }}
              />
            </div>
          )}

          {variations.map((variation, index) => (
            <div key={index}>
              <div className={styles.variationRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Nama Variasi<span className={styles.required}>*</span>
                  </label>
                  <input 
                    type="text" 
                    className={styles.formInput} 
                    value={variation.name} 
                    onChange={(e) => {
                      const newVars = [...variations];
                      newVars[index].name = e.target.value;
                      setVariations(newVars);
                    }} 
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Harga<span className={styles.required}>*</span>
                  </label>
                  <input 
                    type="number" 
                    className={styles.formInput} 
                    value={priceType === "free" ? 0 : variation.price} 
                    onChange={(e) => {
                      const newVars = [...variations];
                      newVars[index].price = Number(e.target.value);
                      setVariations(newVars);
                    }} 
                    disabled={priceType === "free"}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Stok<span className={styles.required}>*</span>
                  </label>
                  <input 
                    type="number" 
                    className={styles.formInput} 
                    value={variation.stock} 
                    onChange={(e) => {
                      const newVars = [...variations];
                      newVars[index].stock = Number(e.target.value);
                      setVariations(newVars);
                    }} 
                  />
                </div>
              </div>
              <button
                className={styles.deleteLink}
                onClick={() => removeVariation(index)}
              >
                Hapus variasi ini
              </button>
            </div>
          ))}

          {variations.length < 3 && (
            <button className={styles.addVariationBtn} onClick={addVariation}>
              Tambah Variasi
            </button>
          )}
        </div>
      </div>

      {/* Section 6: Layanan Tambahan (Produk Non Instan) */}
      <div className={styles.section}>
        <div className={styles.sectionLeft}>
          <h2 className={styles.sectionTitle}>Layanan Tambahan (Produk Non Instan)</h2>
          <p className={styles.sectionDesc}>
            Tambahkan add-ons untuk produk Anda, misalnya, jika Anda menjual
            layanan, Anda dapat menambahkan add-ons seperti jam tambahan,
            revisi ekstra, atau fitur premium.
          </p>
        </div>
        <div className={styles.sectionRight}>
          <button className={styles.addVariationBtn}>
            Tambah Layanan Tambahan
          </button>
        </div>
      </div>

      {/* Section 7: File Produk */}
      <div className={styles.section}>
        <div className={styles.sectionLeft}>
          <h2 className={styles.sectionTitle}>File Produk</h2>
          <p className={styles.sectionDesc}>
            Masukkan link file untuk produk digital Anda. Jika produk memiliki
            beberapa variasi, masukkan satu link per variasi. Link harus bisa
            diakses oleh pembeli setelah transaksi berhasil.
          </p>
        </div>
        <div className={styles.sectionRight}>
          {variations.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
              {variations.map((v, i) => (
                <div key={i} className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Link File — {v.name || `Variasi ${i + 1}`}
                  </label>
                  <input
                    type="url"
                    className={styles.formInput}
                    placeholder="https://drive.google.com/..."
                    value={variationFileUrls[i] || ""}
                    onChange={(e) => {
                      const updated = [...variationFileUrls];
                      updated[i] = e.target.value;
                      setVariationFileUrls(updated);
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Link File Produk</label>
              <input
                type="url"
                className={styles.formInput}
                placeholder="https://drive.google.com/..."
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>


      {/* Section 8: Informasi Tambahan */}
      <div className={styles.section}>
        <div className={styles.sectionLeft}>
          <h2 className={styles.sectionTitle}>Informasi Tambahan</h2>
          <p className={styles.sectionDesc}>
            URL Pratinjau diperlukan untuk produk instan. Jika Anda memerlukan beberapa
            informasi dari pembeli sebelum membeli produk, Anda dapat mengisi informasi
            tambahan di sini, saat pengguna membeli, dia perlu mengisi informasi tersebut
          </p>
        </div>
        <div className={styles.sectionRight}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>URL Pratinjau</label>
            <input type="text" className={styles.formInput} placeholder="Https://..." value={previewUrl} onChange={(e) => setPreviewUrl(e.target.value)} />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Informasi Tambahan</label>
            <textarea className={styles.formInput} style={{ minHeight: "120px" }} value={additionalInfo} onChange={(e) => setAdditionalInfo(e.target.value)} />
          </div>

          <div className={styles.checkboxGroup} style={{ marginBottom: "12px" }}>
            <input type="checkbox" id="allowDownload" className={styles.checkbox} checked={allowDownload} onChange={(e) => setAllowDownload(e.target.checked)} />
            <label htmlFor="allowDownload" className={styles.checkboxLabel} style={{ fontWeight: 400, color: "#64748b" }}>
              Izinkan pembeli untuk mengunduh file baru jika Anda memperbarui produk (hanya untuk produk instan)
            </label>
          </div>

          <div className={styles.checkboxGroup} style={{ marginBottom: "24px" }}>
            <input type="checkbox" id="allowBargain" className={styles.checkbox} checked={allowBargain} onChange={(e) => setAllowBargain(e.target.checked)} />
            <label htmlFor="allowBargain" className={styles.checkboxLabel} style={{ fontWeight: 400, color: "#64748b" }}>
              Izinkan pembeli untuk menawar harga
            </label>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Status</label>
            <div style={{ display: "flex", gap: "24px", marginTop: "8px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#64748b", cursor: "pointer" }}>
                <input type="radio" name="status" value="published" checked={status === "published"} onChange={() => setStatus("published")} style={{ accentColor: "#10b981", width: "16px", height: "16px" }} />
                Diterbitkan
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#64748b", cursor: "pointer" }}>
                <input type="radio" name="status" value="draft" checked={status === "draft"} onChange={() => setStatus("draft")} style={{ accentColor: "#10b981", width: "16px", height: "16px" }} />
                Draf
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className={styles.submitSection}>
        <button className={styles.saveDraftBtn} disabled={isSubmitting}>Simpan Draft</button>
        <button 
          className={styles.publishBtn} 
          onClick={async () => {
            if (!supabaseUser) {
              alert("Silakan login terlebih dahulu!");
              return;
            }
            if (!name) {
              alert("Nama produk wajib diisi!");
              return;
            }
            setIsSubmitting(true);
            try {
              // 1. Cek apakah user sudah punya toko
              let { data: store, error: storeError } = await supabase
                .from('stores')
                .select('id')
                .eq('owner_id', supabaseUser.id)
                .single();
                
              let storeId = store?.id;
              
              if (!storeId || storeError) {
                alert("Anda belum memiliki profil toko. Silakan buat toko terlebih dahulu di Pengaturan Toko.");
                window.location.href = "/shop/pengaturan/informasi";
                return;
              }
              
              // 2. Insert produk
              const { data: newProduct, error: insertError } = await supabase
                .from('products')
                .insert([{
                  store_id: storeId,
                  name: name,
                  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 6),
                  description: description || "Deskripsi produk",
                  faq: faqContent,
                  price: priceType === "free" ? 0 : price,
                  stock: stock,
                  is_active: status === "published",
                  status: status,
                  tags: tags,
                  product_type: productType,
                  category_id: categoryId,
                  is_instant: instantDelivery,
                  delivery_time: instantDelivery ? null : deliveryTime,
                  preview_url: previewUrl,
                  additional_info_req: additionalInfo,
                  allow_download_update: allowDownload,
                  allow_bargain: allowBargain,
                  file_url: variations.length === 0 ? fileUrl : null,
                }])
                .select()
                .single();
                
              if (insertError) throw insertError;
              
              // 2.5 Insert variations dengan file_url
              if (variations.length > 0 && newProduct) {
                const variationsToInsert = variations.map((v, i) => ({
                  product_id: newProduct.id,
                  name: v.name,
                  price: priceType === "free" ? 0 : v.price,
                  stock: v.stock,
                  file_url: variationFileUrls[i] || null,
                }));
                const { error: varError } = await supabase
                  .from('product_variations')
                  .insert(variationsToInsert);
                  
                if (varError) {
                  console.error("Gagal simpan variasi:", varError);
                  alert("Produk tersimpan, tetapi gagal menyimpan variasi.");
                }
              }
              
              // 3. Upload images (opsional, jika bucket 'product-images' sudah ada)
              if (productImages.length > 0 && newProduct) {
                try {
                  const uploadPromises = productImages.map(async (file, index) => {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${storeId}/${newProduct.id}/${index}-${Date.now()}.${fileExt}`;
                    
                    const { error: uploadError } = await supabase.storage
                      .from('product-images')
                      .upload(fileName, file, {
                        contentType: file.type
                      });
                      
                    if (uploadError) {
                      console.error("Gagal upload gambar:", uploadError);
                      return null;
                    }
                    
                    const { data: publicUrlData } = supabase.storage
                      .from('product-images')
                      .getPublicUrl(fileName);
                      
                    return publicUrlData.publicUrl;
                  });
                  const uploadedUrls = await Promise.all(uploadPromises);
                  const validUrls = uploadedUrls.filter(url => url !== null);
                  
                  if (validUrls.length > 0) {
                    await supabase
                      .from('products')
                      .update({ 
                        image_url: validUrls[0],
                        image_urls: validUrls
                      })
                      .eq('id', newProduct.id);
                  }
                } catch (imgErr) {
                  console.error("Error uploading images:", imgErr);
                }
              }
              
              alert("Produk berhasil dipublish!");
              setName("");
              setDescription("");
              setFaqContent("");
              setPrice(0);
              setStock(10);
              setProductImages([]);
              setImagePreviews([]);
            } catch (err: any) {
              console.error(err);
              alert("Gagal mempublish produk: " + err.message);
            } finally {
              setIsSubmitting(false);
            }
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Memproses..." : "Publish Produk"}
        </button>
      </div>
    </div>
  );
}
