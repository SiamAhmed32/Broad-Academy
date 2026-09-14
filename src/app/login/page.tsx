import { redirect } from "next/navigation";

import { AuthPage } from "@/components/Auth";
import { getCurrentUser } from "@/lib/auth/session";
import { safeNextPath } from "@/lib/auth/paths";

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

  const params = await searchParams;
  const next = safeNextPath(params.next);
  const oauthError = Array.isArray(params.error) ? params.error[0] : params.error;
  const oauthDebug = Array.isArray(params.debug) ? params.debug[0] : params.debug;
  return (
    <AuthPage
      mode="login"
      nextPath={next}
      oauthError={oauthError}
      oauthDebug={oauthDebug}
    />
  );
}
