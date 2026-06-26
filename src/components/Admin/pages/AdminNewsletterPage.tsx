"use client";

import { motion } from "framer-motion";
import { Loader2, Mail, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  AdminButton,
  AdminCard,
  AdminLoading,
  AdminPageHeader,
} from "@/components/Admin";
import { adminFetch } from "@/lib/admin/client";

type Subscriber = {
  id: string;
  email: string;
  status: "ACTIVE" | "UNSUBSCRIBED";
  source: string;
  createdAt: string;
};

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [counts, setCounts] = useState({ active: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminFetch<{
      subscribers: Subscriber[];
      counts: { active: number; total: number };
    }>("/api/admin/newsletter?limit=50");
    if (res.success && res.data) {
      setSubscribers(res.data.subscribers);
      setCounts(res.data.counts);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleStatus(subscriber: Subscriber) {
    setActingId(subscriber.id);
    await adminFetch("/api/admin/newsletter", {
      method: "PATCH",
      body: JSON.stringify({
        id: subscriber.id,
        status: subscriber.status === "ACTIVE" ? "UNSUBSCRIBED" : "ACTIVE",
      }),
    });
    await load();
    setActingId(null);
  }

  return (
    <div>
      <AdminPageHeader
        title="Newsletter subscribers"
        description="Manage footer sign-ups and unsubscribe status."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <AdminCard className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-navy">{counts.active}</p>
            <p className="text-sm text-slate-500">Active subscribers</p>
          </div>
        </AdminCard>
        <AdminCard className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-navy">{counts.total}</p>
            <p className="text-sm text-slate-500">Total records</p>
          </div>
        </AdminCard>
      </div>

      {loading ? (
        <AdminLoading />
      ) : (
        <div className="space-y-3">
          {subscribers.map((subscriber, index) => (
            <motion.div
              key={subscriber.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
            >
              <AdminCard className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-navy">{subscriber.email}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {subscriber.source} · {new Date(subscriber.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      subscriber.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {subscriber.status}
                  </span>
                  <AdminButton
                    type="button"
                    variant="secondary"
                    disabled={actingId === subscriber.id}
                    onClick={() => toggleStatus(subscriber)}
                  >
                    {actingId === subscriber.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : subscriber.status === "ACTIVE" ? (
                      "Unsubscribe"
                    ) : (
                      "Reactivate"
                    )}
                  </AdminButton>
                </div>
              </AdminCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
