import React, { ReactNode } from "react";
import { Footer } from "./Footer";
import { MobileNav, Navbar } from "./Navbar";
import { getCurrentUser } from "@/lib/auth/session";
import { getNavSession } from "@/lib/nav/session";
import { getActiveAnnouncement } from "@/lib/layout/announcement";
import AnnouncementBar from "./AnnouncementBar";

const Layout = async ({ children }: { children: ReactNode }) => {
  const user = await getCurrentUser();
  const [navSession, activeAnnouncement] = await Promise.all([
    user ? getNavSession(user) : Promise.resolve(null),
    getActiveAnnouncement(),
  ]);

  return (
    <>
      {activeAnnouncement ? <AnnouncementBar announcement={activeAnnouncement} /> : null}
      <header className="sticky top-0 z-50 bg-navy/90 backdrop-blur-md border-b border-white/10">
        <Navbar navSession={navSession} />
        <MobileNav navSession={navSession} />
      </header>
      <main className="flex-1 overflow-x-hidden">
        {children}
      </main>
      <Footer />
    </>
  );
};

export default Layout;
