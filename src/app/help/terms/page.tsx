"use client";

import React from "react";
import styles from "../page.module.css";

export default function TermsOfServicePage() {
  return (
    <div>
      <h1 className={styles.pageTitle}>Syarat Layanan</h1>
      <p className={styles.pageSubtitle}>Ketentuan penggunaan produk dan layanan Valora Store.</p>
      
      <div className={styles.textContent}>
        <p>
          Selamat datang di Valora Store. Dengan mengakses dan menggunakan layanan yang disediakan oleh platform kami, 
          Anda setuju untuk terikat oleh Syarat Layanan ini. Harap baca dengan cermat karena dokumen ini mengatur 
          hubungan hukum antara Anda (baik sebagai penjual maupun pembeli) dan Valora Store.
        </p>

        <h2>1. Akun Pengguna</h2>
        <p>
          Untuk mengakses beberapa fitur platform, Anda mungkin diminta untuk membuat akun. Anda bertanggung jawab penuh 
          atas menjaga kerahasiaan informasi akun Anda dan segala aktivitas yang terjadi di bawah akun tersebut. 
          Anda setuju untuk segera memberi tahu kami tentang penggunaan akun Anda secara tidak sah.
        </p>

        <h2>2. Kewajiban Penjual</h2>
        <ul>
          <li>Menyediakan informasi yang akurat dan lengkap mengenai produk digital atau fisik yang dijual.</li>
          <li>Memastikan memiliki hak kepemilikan atau lisensi yang sah untuk menjual produk tersebut.</li>
          <li>Menyelesaikan pesanan dan memberikan pelayanan pelanggan sesuai standar yang ditetapkan.</li>
        </ul>

        <h2>3. Hak Cipta dan Kekayaan Intelektual</h2>
        <p>
          Segala konten yang tersedia di Valora Store, termasuk namun tidak terbatas pada teks, grafik, logo, gambar, 
          dan perangkat lunak, adalah milik Valora Store atau dilindungi oleh hak kekayaan intelektual milik pengunggah/penjual asli. 
          Pelanggaran terhadap hak cipta ini dapat mengakibatkan penangguhan akun dan tindakan hukum.
        </p>

        <h2>4. Pembatasan Tanggung Jawab</h2>
        <p>
          Valora Store berfungsi sebagai perantara antara penjual dan pembeli. Kami tidak menjamin kualitas, keamanan, 
          atau legalitas barang yang diiklankan, kebenaran atau keakuratan daftar pengguna, maupun kemampuan penjual 
          untuk menjual barang dan pembeli untuk membayar barang tersebut.
        </p>

        <h2>5. Perubahan Syarat Layanan</h2>
        <p>
          Kami berhak untuk memperbarui atau mengubah Syarat Layanan ini kapan saja. Perubahan akan berlaku segera 
          setelah dipublikasikan di halaman ini. Dengan terus menggunakan platform setelah perubahan dilakukan, 
          Anda dianggap menyetujui syarat-syarat yang baru.
        </p>
      </div>
    </div>
  );
}
