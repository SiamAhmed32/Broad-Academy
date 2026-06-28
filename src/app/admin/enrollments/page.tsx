import { redirect } from "next/navigation";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; request?: string }>;
}) {
  const params = await searchParams;
  const tab =
    params.tab === "requests" || params.tab === "enrolled" ? params.tab : "requests";
  const query = new URLSearchParams({ tab });
  if (params.request) query.set("request", params.request);
  redirect(`/admin/students?${query.toString()}`);
}
