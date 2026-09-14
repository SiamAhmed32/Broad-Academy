import { redirect } from "next/navigation";

import { AuthPage } from "@/components/Auth";
import { getCurrentUser } from "@/lib/auth/session";
import { safeNextPath } from "@/lib/auth/paths";

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

  const params = await searchParams;
  const next = safeNextPath(params.next);
  const oauthError = Array.isArray(params.error) ? params.error[0] : params.error;
  return <AuthPage mode="signup" nextPath={next} oauthError={oauthError} />;
}
