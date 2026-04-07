import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MetroPulse Baku – Station Demand Intelligence",
    template: "%s | MetroPulse Baku",
  },
  description:
    "Real-time station demand forecasting and crowd intelligence for Baku Metro. Find the best time to travel and the best exit for your destination.",
  keywords: [
    "Baku Metro",
    "metro demand",
    "station crowding",
    "transit analytics",
    "Bakı metro",
  ],
  openGraph: {
    title: "MetroPulse Baku",
    description: "Station demand intelligence for Baku Metro",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    title: "MetroPulse Baku",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0D14",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={manrope.variable}>
      <body className="min-h-screen bg-surface-900 pb-24 text-foreground antialiased md:pb-0">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
