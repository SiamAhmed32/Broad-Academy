"use client";

import { navLinks } from "@/components/data/navData";
import { BrandLogo } from "@/components/Brand";
import { Container } from "@/components/reusables";
import PrimaryButton from "@/components/reusables/PrimaryButton";
import Link from "next/link";
import { NavNotificationBell } from "./NavNotificationBell";
import { UserNavMenu } from "./UserNavMenu";
import type { NavSession } from "@/lib/nav/types";

const Navbar = ({ navSession }: { navSession: NavSession | null }) => {
  return (
    <nav className="hidden md:block">
      <Container>
        <div className="flex items-center justify-between py-3">
          <BrandLogo inverse />
          <ul className="flex">
            {navLinks.map((link) => (
              <Link
                href={link.href}
                key={link.title}
                className="cursor-pointer rounded-lg px-2 py-2 text-soft hover:bg-soft/10 lg:px-4"
              >
                {link.title}
              </Link>
            ))}
          </ul>
          <div className="flex items-center gap-2 lg:gap-3">
            {navSession ? (
              <>
                <UserNavMenu session={navSession} />
                <NavNotificationBell navSession={navSession} placement="desktop" />
              </>
            ) : (
              <>
                <PrimaryButton href="/login" className="hover:bg-btnBg">
                  Log In
                </PrimaryButton>
                <PrimaryButton href="/register" className="bg-btnBg text-soft hover:bg-btnBg/80">
                  Get Started
                </PrimaryButton>
              </>
            )}
          </div>
        </div>
      </Container>
    </nav>
  );
};

export default Navbar;
