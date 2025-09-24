import type { Metadata } from "next";
import { Poppins, Lilita_One } from "next/font/google";
import "./globals.scss";

const bodyFont = Poppins({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const displayFont = Lilita_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Siyer Kart Eşleştirme",
  description:
    "Lise öğrencileri için tasarlanan, sevimli animasyonlarla dolu 3D kart eşleştirme oyunu ve yönetim paneli.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        {children}
      </body>
    </html>
  );
}
