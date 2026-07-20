export interface Seller {
  name: string;
  avatar: string;
  rating: number;
}

export interface Variation {
  id: string;
  name: string;
  price: number;
  discount_price?: number;
  discount_percentage?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating: number;
  sold: number;
  downloads: number;
  views: number;
  images: string[];
  video?: string;
  seller: Seller;
  badges: string[];
  tags: string[];
  features: string[];
  inStock: number;
  lastUpdated: string;
  demoUrl?: string;
  downloadUrl?: string;
  slug?: string;
  category: string;
  variations?: Variation[];
}

export const mockProducts: Product[] = [
  {
    id: "google-sheet-bot-whatsapp",
    name: "Google Sheet Bot Whatsapp v5.0.6 || Support MPWA v9.0.0",
    description: "Google Sheet Bot Whatsapp v5.0.6 || Support MPWA v9.0.0 dengan Integrasi Gemini & OpenAI (ChatGPT). Memungkinkan Anda menghubungkan spreadsheet langsung ke WhatsApp Anda untuk melakukan analisis teks otomatis, menjawab FAQ customer, hingga mengelola data penjualan secara real-time.",
    price: 105000,
    originalPrice: 110000,
    rating: 0.0,
    sold: 14,
    downloads: 6,
    views: 3300,
    images: [
      "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80"
    ],
    seller: {
      name: "smartapps",
      avatar: "SA",
      rating: 0
    },
    badges: ["INSTANT", "UP TO 5% OFF"],
    tags: ["mpwa", "whatsapp", "bot", "google sheet"],
    features: [
      "Integrasi Gemini & OpenAI (ChatGPT)",
      "Autoreply chat dengan data Google Sheet",
      "Sistem blast pesan terjadwal",
      "Kirim file media secara otomatis",
      "Instalasi mudah & panduan lengkap"
    ],
    inStock: 87,
    lastUpdated: "Apr 1, 2026",
    demoUrl: "https://wa.me/62811527645955",
    category: "Source Code"
  },
  {
    id: "reacthub-whatsapp-gateway",
    name: "ReactHub Whatsapp Gateway - Multi Device",
    description: "Gateway WhatsApp modern dengan arsitektur multi-device. Stabil, otomatis melakukan koneksi ulang jika terputus, dilengkapi dashboard modern dan API endpoint lengkap untuk integrasi ke sistem aplikasi Anda.",
    price: 20000,
    originalPrice: 10000000,
    rating: 5.0,
    sold: 1,
    downloads: 1,
    views: 840,
    images: [
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80"
    ],
    seller: {
      name: "Mpedia Shop",
      avatar: "MS",
      rating: 5.0
    },
    badges: ["7 DAYS"],
    tags: ["whatsapp", "gateway", "api", "multi-device"],
    features: [
      "Multi-device pairing via QR Code",
      "Auto reconnect otomatis",
      "REST API Lengkap (Send Text, Media, Button, Template)",
      "Webhook Notification"
    ],
    inStock: 99,
    lastUpdated: "Mar 10, 2026",
    category: "Source Code"
  },
  {
    id: "live-chat-omnichannel",
    name: "Live chat & Omnichannel customer service | Support AI CS",
    description: "Kelola semua pesan customer service dari berbagai channel (WhatsApp, Telegram, Web Chat) dalam satu dashboard omnichannel yang terpusat. Terintegrasi dengan AI Customer Service untuk menjawab otomatis di luar jam kerja.",
    price: 120000,
    originalPrice: 2000000,
    rating: 4.8,
    sold: 2,
    downloads: 2,
    views: 1200,
    images: [
      "https://images.unsplash.com/photo-1531747118685-ca8fa6e08806?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&auto=format&fit=crop&q=80"
    ],
    seller: {
      name: "Mpedia Shop",
      avatar: "MS",
      rating: 4.8
    },
    badges: ["1 DAYS"],
    tags: ["live chat", "omnichannel", "ai", "customer service"],
    features: [
      "Single inbox untuk semua channel",
      "Assign agen CS secara otomatis/manual",
      "Terintegrasi AI Agent (OpenAI)",
      "Analytics response time & kepuasan pelanggan"
    ],
    inStock: 50,
    lastUpdated: "Feb 28, 2026",
    category: "SaaS App"
  },
  {
    id: "simple-blog-website",
    name: "A Simple Blog Website - Next.js & MDX",
    description: "Template website blog sederhana yang dibangun menggunakan Next.js App Router dan Markdown (MDX). Sangat cepat, SEO friendly, responsive, dan mudah dideploy di Vercel atau Netlify.",
    price: 0,
    rating: 5.0,
    sold: 1,
    downloads: 12,
    views: 450,
    images: [
      "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=600&auto=format&fit=crop&q=80"
    ],
    seller: {
      name: "Mpedia Shop",
      avatar: "MS",
      rating: 5.0
    },
    badges: ["INSTANT"],
    tags: ["nextjs", "mdx", "blog", "freebie"],
    features: [
      "Next.js App Router & Tailwind CSS",
      "Support tulisan berbasis MDX",
      "SEO & Sitemap generate otomatis",
      "Pilihan dark mode dan light mode"
    ],
    inStock: 999,
    lastUpdated: "Jan 15, 2026",
    demoUrl: "https://simple-blog-demo.vercel.app",
    category: "Website Templates"
  },
  {
    id: "agc-download-lagu-no-api",
    name: "Script AGC Download Lagu Tanpa API Youtube",
    description: "Script pencari dan download lagu otomatis (AGC) tanpa memerlukan API Key dari YouTube yang boros kuota. Sangat ringan, cepat, dan siap mendatangkan traffic melimpah dari search engine.",
    price: 150000,
    rating: 4.5,
    sold: 2,
    downloads: 2,
    views: 980,
    images: [
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80"
    ],
    seller: {
      name: "matilangkah",
      avatar: "ML",
      rating: 4.5
    },
    badges: ["INSTANT"],
    tags: ["agc", "download lagu", "script", "seo"],
    features: [
      "Tanpa token API YouTube (Bebas limit)",
      "Pencarian lagu instan & convert mp3 cepat",
      "SEO friendly dengan schema metadata",
      "Pemasangan iklan Adsense / Alternatif mudah"
    ],
    inStock: 250,
    lastUpdated: "May 2, 2026",
    category: "Scripts"
  },
  {
    id: "ppob-spa-source-code",
    name: "PPOB SPA Source Code - Mpedia",
    description: "Source code lengkap aplikasi penjualan pulsa, paket data, voucher game, token PLN, dan tagihan PPOB bulanan dengan tampilan Single Page Application (SPA) yang sangat cepat dan interaktif.",
    price: 1000000,
    originalPrice: 1500000,
    rating: 4.9,
    sold: 12,
    downloads: 12,
    views: 5200,
    images: [
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&auto=format&fit=crop&q=80"
    ],
    seller: {
      name: "Mpedia Shop",
      avatar: "MS",
      rating: 4.9
    },
    badges: ["INSTANT", "UP TO 33% OFF"],
    tags: ["ppob", "pulsa", "react", "spa", "laravel"],
    features: [
      "Modern SPA UI (React/Vue/Svelte)",
      "Integrasi multi-gateway payment (Midtrans, Tripay)",
      "Sistem Auto-deposit dan saldo user",
      "Keamanan transaksi PIN & double request check"
    ],
    inStock: 120,
    lastUpdated: "Jun 12, 2026",
    category: "Source Code"
  },
  {
    id: "tabungan-sekolah-new",
    name: "Tabungan Sekolah New || Source Code",
    description: "Sistem informasi pengelolaan tabungan siswa di sekolah berbasis web. Sangat berguna untuk koperasi sekolah, SD, SMP, SMA guna mencatat transaksi setoran, penarikan, dan laporan saldo siswa.",
    price: 500000,
    rating: 0.0,
    sold: 0,
    downloads: 0,
    views: 180,
    images: [
      "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&auto=format&fit=crop&q=80"
    ],
    seller: {
      name: "candy",
      avatar: "CD",
      rating: 0
    },
    badges: ["INSTANT"],
    tags: ["sekolah", "tabungan", "php", "mysql"],
    features: [
      "Dashboard statistik saldo masuk & keluar",
      "Cetak kartu tabungan siswa dengan barcode",
      "Laporan harian, bulanan, tahunan (Excel/PDF)",
      "Multi-user level (Admin, Petugas, Siswa)"
    ],
    inStock: 40,
    lastUpdated: "Apr 20, 2026",
    category: "Web Application"
  },
  {
    id: "websip-arsip-digital-qr",
    name: "Websip - Aplikasi Arsip Digital Fitur Scan QR Berbasis Web",
    description: "Sistem pengarsipan dokumen digital perusahaan / instansi secara teratur dengan fitur QR Code untuk kemudahan pencarian dokumen fisik. Aman, terstruktur, dan multi-user.",
    price: 180000,
    rating: 0.0,
    sold: 0,
    downloads: 0,
    views: 290,
    images: [
      "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&auto=format&fit=crop&q=80"
    ],
    seller: {
      name: "nime",
      avatar: "NM",
      rating: 0
    },
    badges: ["INSTANT"],
    tags: ["arsip", "scan qr", "document control", "office"],
    features: [
      "Penyimpanan berkas digital aman (PDF, Image, Doc)",
      "Generate otomatis QR Code per berkas/rak",
      "Fitur scan QR camera smartphone untuk info arsip",
      "Sistem log aktivitas akses dokumen"
    ],
    inStock: 15,
    lastUpdated: "May 10, 2026",
    category: "Web Application"
  }
];
