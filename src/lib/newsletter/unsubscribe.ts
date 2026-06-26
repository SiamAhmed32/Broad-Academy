import { hashValue } from "@/lib/auth/security";

export function buildUnsubscribeToken(subscriberId: string, email: string) {
  return hashValue(`unsub:${subscriberId}:${email}`);
}
