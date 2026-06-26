import { redirect } from "next/navigation";

import { AuthPage } from "@/components/Auth";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = {
  title: "Create account",
  description: "Create your Broad Academy student learning account.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const next = safeNextPath((await searchParams).next);
  return <AuthPage mode="signup" nextPath={next} />;
}

function safeNextPath(value: string | string[] | undefined) {
  const path = Array.isArray(value) ? value[0] : value;
  return path?.startsWith("/") && !path.startsWith("//") ? path : "/dashboard";
}
