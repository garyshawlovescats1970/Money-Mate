import type { Metadata, Viewport } from "next";
import { Sora, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";
import SWRegister from "@/components/SWRegister";

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-sora",
});

const splineMono = Spline_Sans_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-spline-mono",
});

export const metadata: Metadata = {
  title: "MoneyMate",
  description:
    "Money app that talks like a mate who works in finance. Budget, cut your bills, learn to invest.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MoneyMate",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0D14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB" className={`${sora.variable} ${splineMono.variable}`}>
      <body>
        {children}
        <SWRegister />
      </body>
    </html>
  );
}
