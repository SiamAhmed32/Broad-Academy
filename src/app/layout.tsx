import type { Metadata, Viewport } from "next";
import SiteOfferPopupLoader from "@/components/Campaigns/SiteOfferPopupLoader";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://broadacademy.com",
  ),
  title: {
    default: "Broad Academy",
    template: "%s | Broad Academy",
  },
  description: "Learn Today, Lead Tomorrow, Grow to Infinity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <SiteOfferPopupLoader />
      </body>
    </html>
  );
}
