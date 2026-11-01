"use client";

import { BrandLogo } from "@/components/Brand";
import { Container } from "@/components/reusables";
import PrimaryButton from "@/components/reusables/PrimaryButton";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavNotificationBell } from "./NavNotificationBell";
import { UserNavMenu } from "./UserNavMenu";
import type { NavSession } from "@/lib/nav/types";
import { cn } from "@/lib/utils";

/** Primary desktop nav — kept short to match the site's header design. */
const primaryNavLinks = [
  { title: "Home", href: "/" },
  { title: "Courses", href: "/courses" },
  { title: "Exams", href: "/exams" },
  { title: "Counselling", href: "/counselling" },
  { title: "Our Team", href: "/instructors" },
  { title: "About Us", href: "/about" },
];

function isLinkActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  const cleanPath = pathname.replace(/\/+$/, "") || "/";
  const cleanHref = href.replace(/\/+$/, "") || "/";
  if (cleanHref === "/") {
    return cleanPath === "/";
  }
  return cleanPath === cleanHref || cleanPath.startsWith(`${cleanHref}/`);
}

const Navbar = ({ navSession }: { navSession: NavSession | null }) => {
  const pathname = usePathname();

  return (
    <nav className="hidden lg:block">
      <Container>
        <div className="flex items-center justify-between py-3">
          <BrandLogo className="shrink-0" />
          <ul className="flex shrink-0 items-center gap-1">
            {primaryNavLinks.map((link) => {
              const active = isLinkActive(pathname, link.href);

              return (
                <li key={link.title}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "cursor-pointer rounded-lg px-2.5 py-2 transition whitespace-nowrap xl:px-4",
                      active
                        ? "bg-btnBg/10 font-semibold text-btnBg hover:bg-btnBg/15"
                        : "font-medium text-navy/75 hover:bg-navy/5 hover:text-navy"
                    )}
                  >
                    {link.title}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="flex shrink-0 items-center gap-2 xl:gap-3">
            {navSession ? (
              <div className="flex items-center gap-1">
                <NavNotificationBell navSession={navSession} placement="desktop" />
                <span className="mx-0.5 h-5 w-px bg-navy/10" aria-hidden />
                <UserNavMenu session={navSession} variant="light" />
              </div>
            ) : (
              <>
                <PrimaryButton href="/login" className="whitespace-nowrap border border-navy/15 bg-white px-3.5 py-2 text-navy hover:border-btnBg/40 hover:bg-btnBg/10 hover:text-btnBg xl:px-5">
                  Log In
                </PrimaryButton>
                <PrimaryButton href="/register" className="whitespace-nowrap bg-btnBg px-3.5 py-2 text-soft hover:bg-btnBg/80 xl:px-5">
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
