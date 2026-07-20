"use client";

import React from "react";
import styles from "../../page.module.css";

export default function CaraUploadProdukPage() {
  return (
    <div>
      <h1 className={styles.pageTitle}>Cara Upload Produk</h1>
      <p className={styles.pageSubtitle}>Panduan mempublikasikan produk pertama Anda ke Valora Store.</p>
      
      <div className={styles.textContent}>
        <p>
          Setelah toko Anda siap, saatnya mulai mengisi etalase! Menambahkan produk di Valora Store sangat fleksibel, 
          baik Anda menjual produk fisik, digital, maupun jasa. Ikuti langkah-langkah mudah berikut ini.
        </p>

        <h2>1. Akses Halaman Tambah Produk</h2>
        <p>
          Dari halaman Dashboard atau Shop Area Anda, cari tombol atau menu <strong>Tambah Produk</strong>. 
          Anda akan dibawa ke form pengisian detail produk.
        </p>

        <h2>2. Unggah Gambar & Info Dasar</h2>
        <ul>
          <li><strong>Gambar Produk:</strong> Anda bisa mengunggah maksimal 4 gambar. Gambar pertama akan menjadi thumbnail. Pastikan ukurannya di bawah 2MB.</li>
          <li><strong>Nama & Deskripsi:</strong> Tuliskan nama yang menarik dan deskripsi yang jelas. Anda juga bisa menggunakan tombol <em>AI Generate</em> untuk membantu menyusun deskripsi.</li>
          <li><strong>FAQ:</strong> Tambahkan pertanyaan yang sering diajukan pembeli untuk memudahkan mereka memahami produk.</li>
        </ul>

        <h2>3. Tentukan Tipe dan Harga</h2>
        <ol>
          <li>Pilih <strong>Tipe Produk</strong> (Digital, Fisik, atau Jasa) dan kategorinya.</li>
          <li>Di bagian <strong>Pengiriman & Harga</strong>, pilih apakah Anda ingin menjualnya secara <strong>Berbayar</strong> atau <strong>Gratis</strong>.</li>
          <li>Tentukan jumlah Stok. Jika tipe pengirimannya bukan instan, Anda juga harus mengisi perkiraan waktu pengiriman (misal: 2 hari kerja).</li>
        </ol>

        <h2>4. Variasi dan File Digital</h2>
        <p>
          Jika produk Anda memiliki tipe atau versi berbeda (misal: Basic, Pro, Ultimate), Anda bisa menambahkannya di bagian <strong>Variasi Produk</strong>. 
          Jika produk tersebut adalah produk digital, pastikan Anda menautkan <strong>Link File</strong> yang benar (misalnya link Google Drive).
        </p>

        <h2>5. Publish Produk</h2>
        <p>
          Setelah semua form wajib terisi, Anda bisa memilih status produk menjadi <strong>Draft</strong> jika belum selesai diedit, 
          atau <strong>Published</strong> agar langsung tampil di beranda toko. Klik <strong>Publish Produk</strong> untuk menyimpan.
        </p>
      </div>
    </div>
  );
}
