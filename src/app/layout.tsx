import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import MobileBottomNav from "@/components/Layout/MobileBottomNav";
import { getCurrentUser } from "@/lib/auth/session";
import { getNavSession } from "@/lib/nav/session";
import { getSiteUrl } from "@/lib/site/url";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-noto-bengali",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // NOTE: deliberately NOT viewportFit: "cover". Enabling it would make
  // env(safe-area-inset-*) resolve to real values (they are all 0 today), but
  // it also extends the layout viewport under the iOS home indicator — which
  // would drop every existing `fixed bottom-0` element into that strip: the
  // mobile CTA bars in CourseDetailPage and ExamLobbyClient, ExamTakeClient's
  // footer, and the bottom-sheet modals. Turning it on means adding bottom
  // insets to those first.
};

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Broad Academy",
    template: "%s | Broad Academy",
  },
  description: "Learn Today, Lead Tomorrow, Grow to Infinity.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // getCurrentUser/getNavSession are React cache()'d, so pages that also go
  // through Layout.tsx (which fetches the same session) do not re-query.
  const user = await getCurrentUser();
  const navSession = user ? await getNavSession(user) : null;

  return (
    <html
      lang="en"
      className={`h-full antialiased ${inter.variable} ${notoSansBengali.variable}`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <MobileBottomNav
          canViewNotifications={navSession?.canViewNotifications ?? false}
          signedIn={Boolean(user)}
          initialUnreadCount={navSession?.unreadCount ?? 0}
        />
        <Analytics />
      </body>
    </html>
  );
}
