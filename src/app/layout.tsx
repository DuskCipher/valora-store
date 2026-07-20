import type { Metadata } from "next";
import { StoreProvider } from "@/context/StoreContext";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ProductPreviewModal } from "@/components/ProductPreviewModal";
import "./globals.css";

export const metadata: Metadata = {
  title: "Valora Store - Toko Digital Indonesia & Source Code Terlengkap",
  description: "Cari source code, template website, bot Whatsapp gateway, PPOB, script AGC, dan tabungan sekolah instan, aman, dan bergaransi update gratis.",
  keywords: ["source code", "whatsapp gateway", "bot whatsapp", "script agc", "ppob", "digital store"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <StoreProvider>
              {children}
              <ProductPreviewModal />
            </StoreProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
