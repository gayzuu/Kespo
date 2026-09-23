import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Space_Grotesk } from "next/font/google";
import "./globals.css";

const display = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const body = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000",
  ),
  title: "Kespo — DJ House · Tech House · Acid",
  description:
    "Kespo, DJ et producteur du sud de la France. House, tech house, minimal, jazz house. Booking : djkespo@gmail.com",
  keywords: ["Kespo", "DJ", "House", "Tech House", "Acid", "Minimal", "Booking DJ", "Cannes", "Nice", "Montpellier"],
  openGraph: {
    title: "Kespo — DJ House · Tech House · Acid",
    description: "DJ et producteur du sud de la France. Booking & press kit.",
    type: "website",
    locale: "fr_FR",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
