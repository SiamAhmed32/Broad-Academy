import React, { ReactNode } from "react";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";
import { getCurrentUser } from "@/lib/auth/session";
import { getNavSession } from "@/lib/nav/session";

const Layout = async ({ children }: { children: ReactNode }) => {
  const user = await getCurrentUser();
  const navSession = user ? await getNavSession(user) : null;

  return (
    <>
      {/*
        Mobile no longer gets a top header: MobileBottomNav (mounted globally
        in the root layout) already carries Home, Dashboard, More, and either
        Exams or Notifications, so the hamburger menu and notification bell
        that used to live here would just be a second, weaker copy of it.
      */}
      <header className="sticky top-0 z-50 hidden border-b border-navy/8 bg-white/95 backdrop-blur-md shadow-[0_1px_0_rgba(22,51,81,0.04)] md:block">
        <Navbar navSession={navSession} />
      </header>
      <main className="flex-1 overflow-x-hidden">
        {children}
      </main>
      <Footer navSession={navSession} />
    </>
  );
};

export default Layout;
