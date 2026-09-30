import type { Metadata, Viewport } from "next";
import { Poppins, Inter } from "next/font/google";
import "../styles/globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-poppins",
  display: "swap"
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Next Stop: WellSphere Wellness | Pasaporte digital",
  description:
    "Pasaporte digital de bienestar de WellSphere LATAM. Registra tus 5 sellos y sigue tu recorrido de bienestar.",
  robots: {
    index: false,
    follow: false
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#B14EFF"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${poppins.variable} ${inter.variable}`}>
        <div className="wsp-app">{children}</div>
      </body>
    </html>
  );
}
