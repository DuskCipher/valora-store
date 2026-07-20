"use client";

import React from "react";
import styles from "../../page.module.css";

export default function MembuatTokoPage() {
  return (
    <div>
      <h1 className={styles.pageTitle}>Membuat Toko</h1>
      <p className={styles.pageSubtitle}>Panduan langkah demi langkah untuk mulai berjualan di Valora Store.</p>
      
      <div className={styles.textContent}>
        <p>
          Ingin mulai menjual karya digital atau produk fisik Anda? Membuka toko di Valora Store sangatlah mudah dan gratis. 
          Ikuti langkah-langkah di bawah ini untuk mengaktifkan profil penjual Anda.
        </p>

        <h2>Langkah 1: Lengkapi Profil Anda</h2>
        <p>
          Sebelum dapat membuka toko, pastikan Anda telah mendaftar sebagai pengguna Valora Store. 
          Setelah login, masuk ke menu <strong>Dashboard</strong> lalu pilih <strong>Pengaturan Akun</strong>. 
          Lengkapi data diri dasar Anda.
        </p>

        <h2>Langkah 2: Buat Profil Toko</h2>
        <ol>
          <li>Di menu utama atau dashboard, klik bagian <strong>Shop Area</strong> atau navigasi ke pengaturan <strong>Toko Saya</strong>.</li>
          <li>Anda akan diminta untuk mengisi <strong>Nama Toko</strong>. Pilihlah nama yang unik dan mudah diingat.</li>
          <li>Tuliskan <strong>Deskripsi Toko</strong> secara singkat namun informatif agar pembeli mengetahui jenis produk yang Anda jual.</li>
          <li>Unggah <strong>Logo Toko</strong> (resolusi disarankan 1:1) dan <strong>Banner Toko</strong> agar tampilan toko Anda lebih profesional.</li>
        </ol>

        <h2>Langkah 3: Konfigurasi Pembayaran</h2>
        <p>
          Untuk menerima penghasilan dari penjualan, Anda perlu mengatur metode penarikan dana di menu 
          <strong>Saldo & Penarikan</strong>. Pastikan Anda memasukkan nomor rekening atau e-wallet yang valid 
          atas nama Anda sendiri.
        </p>

        <h2>Selamat, Toko Anda Telah Aktif!</h2>
        <p>
          Setelah semua informasi dasar tersimpan, toko Anda sudah aktif dan siap untuk diisi dengan produk-produk 
          terbaik Anda. Silakan lanjut ke panduan <em>Cara Upload Produk</em> untuk mulai berjualan.
        </p>
      </div>
    </div>
  );
}
