import { redirect } from "next/navigation";

import { AuthPage } from "@/components/Auth";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = {
  title: "Log in",
  description: "Securely access your Broad Academy student account.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();
  if (user?.role === "ADMIN") redirect("/admin");
  if (user) redirect("/dashboard");

  const next = safeNextPath((await searchParams).next);
  return <AuthPage mode="login" nextPath={next} />;
}

function safeNextPath(value: string | string[] | undefined) {
  const path = Array.isArray(value) ? value[0] : value;
  return path?.startsWith("/") && !path.startsWith("//") ? path : "/dashboard";
}
