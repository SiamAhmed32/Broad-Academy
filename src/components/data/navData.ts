import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  HeartHandshake,
  Home,
  Info,
  Mail,
} from "lucide-react";

export type NavLinkItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
};

export type NavLinkGroup = {
  label: string;
  links: NavLinkItem[];
};

export const navLinks = [
  { title: "Home", href: "/" },
  { title: "Courses", href: "/courses" },
  { title: "Exams", href: "/exams" },
  { title: "Counselling", href: "/counselling" },
  { title: "Instructors", href: "/instructors" },
  { title: "About", href: "/about" },
  { title: "Contact", href: "/contact" },
];

/** Grouped mobile navigation — fewer items per glance, clearer hierarchy. */
export const mobileNavGroups: NavLinkGroup[] = [
  {
    label: "Learn",
    links: [
      { title: "Home", href: "/", icon: Home, description: "Back to homepage" },
      {
        title: "Courses",
        href: "/courses",
        icon: BookOpen,
        description: "Browse all programs",
      },
      {
        title: "Exams",
        href: "/exams",
        icon: ClipboardList,
        description: "Competitions & tests",
      },
    ],
  },
  {
    label: "Discover",
    links: [
      {
        title: "Counselling",
        href: "/counselling",
        icon: HeartHandshake,
        description: "Book a session",
      },
      {
        title: "Instructors",
        href: "/instructors",
        icon: GraduationCap,
        description: "Meet our mentors",
      },
      { title: "About", href: "/about", icon: Info, description: "Our story" },
      {
        title: "Contact",
        href: "/contact",
        icon: Mail,
        description: "Get in touch",
      },
    ],
  },
];

export const navActions = [
  { title: "Login", href: "/login" },
  { title: "Get Started", href: "/register" },
];
