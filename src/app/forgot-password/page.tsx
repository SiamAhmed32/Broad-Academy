import { redirect } from "next/navigation";

import ForgotPasswordPage from "@/components/Auth/ForgotPasswordPage";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = {
  title: "Reset password",
  description: "Securely reset your Broad Academy account password.",
};

export default async function ForgotPasswordRoute() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return <ForgotPasswordPage />;
}
