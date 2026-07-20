"use client";

import React from "react";
import styles from "../page.module.css";

export default function AffiliatePage() {
  return (
    <div>
      <h1 className={styles.pageTitle}>Program Afiliasi</h1>
      <p className={styles.pageSubtitle}>Dapatkan penghasilan tambahan dengan mempromosikan produk dari Valora Store.</p>
      
      <div className={styles.textContent}>
        <p>
          Program Afiliasi Valora Store memungkinkan Anda untuk menghasilkan uang hanya dengan membagikan 
          tautan ke produk-produk yang dijual di platform kami. Anda akan mendapatkan komisi untuk setiap 
          pembelian yang berhasil dilakukan melalui tautan referal Anda.
        </p>

        <h2>Cara Kerja</h2>
        <ol>
          <li><strong>Daftar:</strong> Anda harus memiliki akun aktif di Valora Store untuk dapat bergabung dalam program afiliasi.</li>
          <li><strong>Bagikan Tautan:</strong> Temukan produk yang ingin Anda promosikan, ambil tautan afiliasi unik Anda, dan bagikan di media sosial, blog, atau saluran komunikasi lainnya.</li>
          <li><strong>Dapatkan Komisi:</strong> Ketika seseorang mengklik tautan Anda dan menyelesaikan pembelian, Anda akan otomatis menerima komisi sesuai persentase yang ditentukan oleh penjual.</li>
        </ol>

        <h2>Ketentuan Komisi</h2>
        <p>
          Besaran komisi dapat bervariasi bergantung pada pengaturan masing-masing toko dan produk. 
          Komisi akan ditambahkan ke saldo akun Anda setelah transaksi dinyatakan selesai tanpa ada kendala (refund/dispute). 
          Anda dapat menarik penghasilan afiliasi Anda kapan saja setelah mencapai batas minimum penarikan.
        </p>

        <h2>Kebijakan Promosi</h2>
        <ul>
          <li>Afiliator dilarang melakukan spamming tautan di platform yang tidak relevan atau tanpa izin.</li>
          <li>Dilarang menyesatkan pembeli mengenai fungsi atau harga dari produk afiliasi.</li>
          <li>Pelanggaran kebijakan dapat menyebabkan pembatalan komisi dan penonaktifan akses afiliasi.</li>
        </ul>
      </div>
    </div>
  );
}
