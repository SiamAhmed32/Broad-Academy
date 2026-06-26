import { redirect } from "next/navigation";

export const metadata = { title: "My Profile" };

export default function ProfileRoute() {
  redirect("/dashboard?tab=profile");
}
