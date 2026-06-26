"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Archive,
  ArrowRight,
  CalendarClock,
  Eye,
  Gift,
  ImageIcon,
  Loader2,
  Megaphone,
  PauseCircle,
  Pencil,
  PlayCircle,
  Plus,
  Search,
  Send,
  Sparkles,
  Users,
  Clock,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmpty,
  AdminField,
  AdminImageUpload,
  AdminInput,
  AdminLoading,
  AdminPageHeader,
  AdminPagination,
  AdminSelect,
  AdminTextarea,
  type AdminPaginationMeta,
  useAdminToast,
} from "@/components/Admin";
import Modal from "@/components/reusables/Modal";
import { adminFetch, formatAdminDate } from "@/lib/admin/client";

type CampaignStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
type CampaignAudience = "ALL" | "GUESTS" | "STUDENTS";
type CampaignFrequency =
  | "ONCE_PER_CAMPAIGN"
  | "ONCE_PER_SESSION"
  | "EVERY_VISIT";

type Campaign = {
  id: string;
  title: string;
  content: string;
  badge: string | null;
  imageUrl: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  status: CampaignStatus;
  audience: CampaignAudience;
  frequency: CampaignFrequency;
  startsAt: string | null;
  endsAt: string | null;
  priority: number;
  
  // Premium promo fields
  originalPrice: number | null;
  salePrice: number | null;
  countdownEndsAt: string | null;
  theme: string;
  
  createdAt: string;
  updatedAt: string;
};

type CampaignForm = {
  title: string;
  content: string;
  badge: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  status: CampaignStatus;
  audience: CampaignAudience;
  frequency: CampaignFrequency;
  startsAt: string;
  endsAt: string;
  priority: number;
  
  // Premium promo fields
  originalPrice: string;
  salePrice: string;
  countdownEndsAt: string;
  theme: string;
};

const emptyCampaign: CampaignForm = {
  title: "",
  content: "",
  badge: "SPECIAL OFFER",
  imageUrl: "",
  ctaText: "Explore courses",
  ctaLink: "/courses",
  status: "DRAFT",
  audience: "ALL",
  frequency: "ONCE_PER_CAMPAIGN",
  startsAt: "",
  endsAt: "",
  priority: 0,
  originalPrice: "",
  salePrice: "",
  countdownEndsAt: "",
  theme: "LIGHT",
};

const emptyPagination: AdminPaginationMeta = {
  page: 1,
  limit: 8,
  total: 0,
  totalPages: 1,
};

function toLocalDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function campaignToForm(campaign: Campaign): CampaignForm {
  return {
    title: campaign.title,
    content: campaign.content,
    badge: campaign.badge || "",
    imageUrl: campaign.imageUrl || "",
    ctaText: campaign.ctaText || "",
    ctaLink: campaign.ctaLink || "",
    status: campaign.status,
    audience: campaign.audience,
    frequency: campaign.frequency,
    startsAt: toLocalDateTime(campaign.startsAt),
    endsAt: toLocalDateTime(campaign.endsAt),
    priority: campaign.priority,
    originalPrice: campaign.originalPrice ? String(campaign.originalPrice) : "",
    salePrice: campaign.salePrice ? String(campaign.salePrice) : "",
    countdownEndsAt: toLocalDateTime(campaign.countdownEndsAt),
    theme: campaign.theme || "LIGHT",
  };
}

function campaignPayload(form: CampaignForm) {
  let ctaLink = form.ctaLink.trim();
  if (ctaLink && typeof window !== "undefined") {
    try {
      const url = new URL(ctaLink);
      if (url.origin === window.location.origin) {
        ctaLink = `${url.pathname}${url.search}${url.hash}`;
      }
    } catch {
      // Relative paths are intentionally preserved for backend validation.
    }
  }

  return {
    ...form,
    badge: form.badge.trim() || null,
    imageUrl: form.imageUrl || null,
    ctaText: form.ctaText.trim() || null,
    ctaLink: ctaLink || null,
    startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
    endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
    originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
    salePrice: form.salePrice ? Number(form.salePrice) : null,
    countdownEndsAt: form.countdownEndsAt ? new Date(form.countdownEndsAt).toISOString() : null,
    theme: form.theme,
  };
}

function displayStatus(campaign: Campaign) {
  const now = Date.now();
  if (campaign.status === "ARCHIVED") return "Archived";
  if (campaign.status === "DRAFT") return "Draft";
  if (campaign.startsAt && new Date(campaign.startsAt).getTime() > now) {
    return "Scheduled";
  }
  if (campaign.endsAt && new Date(campaign.endsAt).getTime() <= now) {
    return "Ended";
  }
  return "Live";
}

function statusVariant(label: string) {
  if (label === "Live") return "success" as const;
  if (label === "Scheduled") return "info" as const;
  if (label === "Ended") return "warning" as const;
  if (label === "Archived") return "muted" as const;
  return "default" as const;
}

export default function AdminOffersPage() {
  const reduceMotion = useReducedMotion();
  const { showToast, ToastViewport } = useAdminToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(emptyPagination);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CampaignForm>(emptyCampaign);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showNotificationForm, setShowNotificationForm] = useState(false);

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(emptyPagination.limit),
    });
    if (search.trim()) params.set("search", search.trim());
    if (statusFilter) params.set("status", statusFilter);

    const response = await adminFetch<{
      campaigns: Campaign[];
      pagination: AdminPaginationMeta;
    }>(`/api/admin/popup-campaigns?${params.toString()}`);

    if (response.success && response.data) {
      setCampaigns(response.data.campaigns);
      setPagination(response.data.pagination);
    } else {
      showToast(response.message || "Could not load campaigns.", true);
    }
    setLoading(false);
  }, [page, search, showToast, statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadCampaigns(), 250);
    return () => window.clearTimeout(timer);
  }, [loadCampaigns]);

  const liveCount = useMemo(
    () => campaigns.filter((campaign) => displayStatus(campaign) === "Live").length,
    [campaigns],
  );

  function openCreate() {
    setEditingId(null);
    setForm(emptyCampaign);
    setFieldErrors({});
    setShowEditor(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openEdit(campaign: Campaign) {
    setEditingId(campaign.id);
    setForm(campaignToForm(campaign));
    setFieldErrors({});
    setShowEditor(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeEditor() {
    if (saving || uploading) return;
    setShowEditor(false);
    setEditingId(null);
    setForm(emptyCampaign);
    setFieldErrors({});
  }

  async function saveCampaign(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFieldErrors({});
    const response = await adminFetch<Campaign>(
      editingId
        ? `/api/admin/popup-campaigns/${editingId}`
        : "/api/admin/popup-campaigns",
      {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify(campaignPayload(form)),
      },
    );
    setSaving(false);

    if (!response.success) {
      setFieldErrors(response.fields || {});
      showToast(response.message || "Could not save the campaign.", true);
      return;
    }

    showToast(response.message || "Campaign saved.");
    closeEditor();
    void loadCampaigns();
  }

  async function changeStatus(campaign: Campaign, status: CampaignStatus) {
    const response = await adminFetch<Campaign>(
      `/api/admin/popup-campaigns/${campaign.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          ...campaignPayload(campaignToForm(campaign)),
          status,
        }),
      },
    );
    if (!response.success) {
      showToast(response.message || "Could not update campaign.", true);
      return;
    }
    showToast(status === "PUBLISHED" ? "Campaign published." : "Campaign paused.");
    void loadCampaigns();
  }

  async function archiveCampaign(campaign: Campaign) {
    if (!window.confirm(`Archive "${campaign.title}"? It will stop appearing immediately.`)) {
      return;
    }
    const response = await adminFetch(`/api/admin/popup-campaigns/${campaign.id}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "archive" }),
    });
    if (!response.success) {
      showToast(response.message || "Could not archive campaign.", true);
      return;
    }
    showToast("Campaign archived.");
    void loadCampaigns();
  }

  return (
    <div>
      <AdminPageHeader
        title="Offers & popup campaigns"
        description="Create polished, scheduled promotional popups for sales, admission offers, discounts, and seasonal campaigns."
        actions={
          <AdminButton onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New popup campaign
          </AdminButton>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={Megaphone}
          label="Campaigns"
          value={pagination.total}
          tone="navy"
        />
        <SummaryCard icon={Sparkles} label="Live now" value={liveCount} tone="emerald" />
        <SummaryCard
          icon={Users}
          label="Audience options"
          value={3}
          tone="sky"
        />
      </div>

      {showEditor ? (
        <motion.form
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={saveCampaign}
          className="mt-6"
        >
          <AdminCard className="overflow-hidden p-0">
            <div className="border-b border-slate-200 bg-gradient-to-r from-navy to-[#194c72] px-5 py-5 text-white sm:px-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                    Campaign studio
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">
                    {editingId ? "Edit popup campaign" : "Create a popup campaign"}
                  </h2>
                </div>
                <AdminButton
                  type="button"
                  variant="ghost"
                  className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                  onClick={() => setPreviewOpen(true)}
                >
                  <Eye className="h-4 w-4" />
                  Preview popup
                </AdminButton>
              </div>
            </div>

            <div className="grid gap-7 p-5 sm:p-7 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                  <AdminField
                    label="Campaign title"
                    error={fieldErrors.title?.[0]}
                  >
                    <AdminInput
                      required
                      maxLength={120}
                      placeholder="Summer Learning Festival"
                      value={form.title}
                      onChange={(event) =>
                        setForm({ ...form, title: event.target.value })
                      }
                    />
                  </AdminField>
                  <AdminField label="Badge" error={fieldErrors.badge?.[0]}>
                    <AdminInput
                      maxLength={30}
                      placeholder="SAVE 30%"
                      value={form.badge}
                      onChange={(event) =>
                        setForm({ ...form, badge: event.target.value })
                      }
                    />
                  </AdminField>
                </div>

                <AdminField
                  label="Offer message"
                  hint={`${form.content.length}/1000 characters. Plain text is rendered safely.`}
                  error={fieldErrors.content?.[0]}
                >
                  <AdminTextarea
                    required
                    rows={5}
                    maxLength={1000}
                    placeholder="Join our new batch and receive a special discount for a limited time."
                    value={form.content}
                    onChange={(event) =>
                      setForm({ ...form, content: event.target.value })
                    }
                  />
                </AdminField>

                <div className="grid gap-4 sm:grid-cols-2">
                  <AdminField
                    label="Button text"
                    error={fieldErrors.ctaText?.[0]}
                  >
                    <AdminInput
                      maxLength={40}
                      placeholder="Enroll now"
                      value={form.ctaText}
                      onChange={(event) =>
                        setForm({ ...form, ctaText: event.target.value })
                      }
                    />
                  </AdminField>
                  <AdminField
                    label="Button destination"
                    hint="Use /courses for this website, or a secure https:// external link."
                    error={fieldErrors.ctaLink?.[0]}
                  >
                    <AdminInput
                      maxLength={300}
                      placeholder="/courses"
                      value={form.ctaLink}
                      onChange={(event) =>
                        setForm({ ...form, ctaLink: event.target.value })
                      }
                    />
                  </AdminField>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <AdminField label="Starts" error={fieldErrors.startsAt?.[0]}>
                    <AdminInput
                      type="datetime-local"
                      value={form.startsAt}
                      onChange={(event) =>
                        setForm({ ...form, startsAt: event.target.value })
                      }
                    />
                  </AdminField>
                  <AdminField label="Ends" error={fieldErrors.endsAt?.[0]}>
                    <AdminInput
                      type="datetime-local"
                      min={form.startsAt || undefined}
                      value={form.endsAt}
                      onChange={(event) =>
                        setForm({ ...form, endsAt: event.target.value })
                      }
                    />
                  </AdminField>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <AdminField label="Audience" error={fieldErrors.audience?.[0]}>
                    <AdminSelect
                      value={form.audience}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          audience: event.target.value as CampaignAudience,
                        })
                      }
                    >
                      <option value="ALL">Everyone</option>
                      <option value="GUESTS">Visitors only</option>
                      <option value="STUDENTS">Logged-in students</option>
                    </AdminSelect>
                  </AdminField>
                  <AdminField
                    label="Show frequency"
                    error={fieldErrors.frequency?.[0]}
                  >
                    <AdminSelect
                      value={form.frequency}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          frequency: event.target.value as CampaignFrequency,
                        })
                      }
                    >
                      <option value="ONCE_PER_CAMPAIGN">Once per campaign</option>
                      <option value="ONCE_PER_SESSION">Once per visit session</option>
                      <option value="EVERY_VISIT">Every page visit</option>
                    </AdminSelect>
                  </AdminField>
                  <AdminField
                    label="Priority"
                    hint="Higher campaigns win if schedules overlap."
                    error={fieldErrors.priority?.[0]}
                  >
                    <AdminInput
                      type="number"
                      min={0}
                      max={100}
                      value={form.priority}
                      onChange={(event) =>
                        setForm({ ...form, priority: Number(event.target.value) })
                      }
                    />
                  </AdminField>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 border-t border-slate-200/60 pt-4 mt-4">
                  <AdminField
                    label="Original Price (Optional)"
                    hint="Crossed out price"
                    error={fieldErrors.originalPrice?.[0]}
                  >
                    <AdminInput
                      type="number"
                      placeholder="e.g., 1200"
                      value={form.originalPrice}
                      onChange={(event) =>
                        setForm({ ...form, originalPrice: event.target.value })
                      }
                    />
                  </AdminField>
                  <AdminField
                    label="Sale Price (Optional)"
                    hint="Highlight price"
                    error={fieldErrors.salePrice?.[0]}
                  >
                    <AdminInput
                      type="number"
                      placeholder="e.g., 399"
                      value={form.salePrice}
                      onChange={(event) =>
                        setForm({ ...form, salePrice: event.target.value })
                      }
                    />
                  </AdminField>
                  <AdminField
                    label="Countdown Timer Ends (Optional)"
                    hint="Show ticking countdown"
                    error={fieldErrors.countdownEndsAt?.[0]}
                  >
                    <AdminInput
                      type="datetime-local"
                      value={form.countdownEndsAt}
                      onChange={(event) =>
                        setForm({ ...form, countdownEndsAt: event.target.value })
                      }
                    />
                  </AdminField>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <AdminField
                    label="Campaign Theme"
                    error={fieldErrors.theme?.[0]}
                  >
                    <AdminSelect
                      value={form.theme}
                      onChange={(event) =>
                        setForm({ ...form, theme: event.target.value })
                      }
                    >
                      <option value="LIGHT">Clean Light Theme</option>
                      <option value="DARK_ROYAL">Royal Purple (Dark)</option>
                      <option value="DARK_MYSTIC">Mystic Obsidian (Dark)</option>
                    </AdminSelect>
                  </AdminField>
                </div>

                <AdminField
                  label="Publishing status"
                  error={fieldErrors.status?.[0]}
                >
                  <AdminSelect
                    value={form.status}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        status: event.target.value as CampaignStatus,
                      })
                    }
                  >
                    <option value="DRAFT">Draft / paused</option>
                    <option value="PUBLISHED">Published</option>
                    {editingId ? <option value="ARCHIVED">Archived</option> : null}
                  </AdminSelect>
                </AdminField>
              </div>

              <div>
                <AdminImageUpload
                  label="Campaign image (optional)"
                  value={form.imageUrl}
                  onChange={(imageUrl) => setForm({ ...form, imageUrl })}
                  purpose="campaign-image"
                  aspect="video"
                  hint="Optional. Without an image, a polished branded illustration is shown."
                  onUploadingChange={setUploading}
                  fieldError={fieldErrors.imageUrl?.[0]}
                />
                <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                  <div className="flex gap-3">
                    <Gift className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                    <div>
                      <p className="text-sm font-semibold text-navy">Recommended setup</p>
                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        Use a short title, one clear benefit, one CTA, and an end date.
                        The popup is automatically hidden from admin, authentication,
                        and active lesson screens.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
              <AdminButton type="button" variant="ghost" onClick={closeEditor}>
                Cancel
              </AdminButton>
              <AdminButton type="submit" isLoading={saving} disabled={uploading}>
                {form.status === "PUBLISHED" ? (
                  <PlayCircle className="h-4 w-4" />
                ) : (
                  <CalendarClock className="h-4 w-4" />
                )}
                {editingId ? "Save campaign" : "Create campaign"}
              </AdminButton>
            </div>
          </AdminCard>
        </motion.form>
      ) : null}

      <AdminCard className="mt-6 overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-navy">Popup campaign library</h2>
            <p className="text-sm text-slate-500">
              Manage drafts, schedules, live offers, and archived campaigns.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <AdminInput
                className="pl-9 sm:w-56"
                placeholder="Search campaigns"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>
            <AdminSelect
              className="sm:w-40"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </AdminSelect>
          </div>
        </div>

        {loading ? (
          <AdminLoading label="Loading popup campaigns..." />
        ) : campaigns.length === 0 ? (
          <AdminEmpty
            title="No popup campaigns found"
            description="Create a seasonal offer, sale, discount, or admission campaign."
            actionLabel="Create campaign"
            onAction={openCreate}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {campaigns.map((campaign, index) => {
              const label = displayStatus(campaign);
              return (
                <motion.article
                  key={campaign.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.025 }}
                  className="grid gap-4 p-5 lg:grid-cols-[96px_1fr_auto] lg:items-center"
                >
                  <div className="flex h-20 w-24 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-navy to-sky-700 text-emerald-300">
                    {campaign.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={campaign.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-7 w-7" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-semibold text-navy">
                        {campaign.title}
                      </h3>
                      <AdminBadge variant={statusVariant(label)}>{label}</AdminBadge>
                      {campaign.badge ? (
                        <AdminBadge variant="info">{campaign.badge}</AdminBadge>
                      ) : null}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
                      {campaign.content}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span>{campaign.audience.toLowerCase()}</span>
                      <span>Priority {campaign.priority}</span>
                      <span>
                        {campaign.startsAt
                          ? `Starts ${formatAdminDate(campaign.startsAt)}`
                          : "Starts immediately"}
                      </span>
                      {campaign.endsAt ? (
                        <span>Ends {formatAdminDate(campaign.endsAt)}</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <AdminButton
                      size="sm"
                      variant="ghost"
                      onClick={() => openEdit(campaign)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </AdminButton>
                    {campaign.status !== "ARCHIVED" ? (
                      campaign.status === "PUBLISHED" ? (
                        <AdminButton
                          size="sm"
                          variant="ghost"
                          onClick={() => void changeStatus(campaign, "DRAFT")}
                        >
                          <PauseCircle className="h-3.5 w-3.5" />
                          Pause
                        </AdminButton>
                      ) : (
                        <AdminButton
                          size="sm"
                          variant="ghost"
                          onClick={() => void changeStatus(campaign, "PUBLISHED")}
                        >
                          <PlayCircle className="h-3.5 w-3.5" />
                          Publish
                        </AdminButton>
                      )
                    ) : null}
                    {campaign.status !== "ARCHIVED" ? (
                      <AdminButton
                        size="sm"
                        variant="ghost"
                        className="text-amber-700"
                        onClick={() => void archiveCampaign(campaign)}
                      >
                        <Archive className="h-3.5 w-3.5" />
                        Archive
                      </AdminButton>
                    ) : null}
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}

        {pagination.total > 0 ? (
          <AdminPagination
            pagination={pagination}
            onPageChange={(nextPage) => setPage(nextPage)}
          />
        ) : null}
      </AdminCard>

      <AdminCard className="mt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-navy">Student inbox offer</h2>
              <p className="mt-1 text-sm text-slate-500">
                Send a separate offer notification to all active students or one student.
              </p>
            </div>
          </div>
          <AdminButton
            variant="ghost"
            onClick={() => setShowNotificationForm((current) => !current)}
          >
            {showNotificationForm ? "Close sender" : "Compose notification"}
          </AdminButton>
        </div>
        {showNotificationForm ? <StudentOfferSender showToast={showToast} /> : null}
      </AdminCard>

      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Popup campaign preview"
        size="xl"
      >
        <div className="bg-slate-100 p-4 pt-14 sm:p-8 sm:pt-14">
          <CampaignPreview form={form} />
        </div>
      </Modal>
      {ToastViewport}
    </div>
  );
}

function CampaignPreview({ form }: { form: CampaignForm }) {
  const isDark = form.theme === "DARK_ROYAL" || form.theme === "DARK_MYSTIC";
  const bgThemeClass = 
    form.theme === "DARK_ROYAL" 
      ? "bg-gradient-to-br from-indigo-950 via-slate-900 to-navy text-white" 
      : form.theme === "DARK_MYSTIC"
        ? "bg-black text-white"
        : "bg-white text-navy";

  return (
    <div className={`mx-auto grid max-w-3xl overflow-hidden rounded-[32px] border ${
      isDark ? "border-white/15" : "border-slate-200"
    } ${bgThemeClass} shadow-2xl md:grid-cols-[0.92fr_1.08fr]`}>
      
      {/* Left Pane - Visual */}
      {form.imageUrl ? (
        <div className="relative min-h-52 overflow-hidden bg-navy md:min-h-[420px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={form.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          {form.badge && (
            <div className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-md">
              <Sparkles className="h-3 w-3 text-yellow-300 animate-pulse" />
              {form.badge}
            </div>
          )}
        </div>
      ) : (
        <div className={`relative hidden min-h-[420px] overflow-hidden md:flex md:items-center md:justify-center ${
          form.theme === "DARK_ROYAL"
            ? "bg-gradient-to-br from-indigo-900 via-purple-950 to-violet-900 text-white"
            : form.theme === "DARK_MYSTIC"
              ? "bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 text-white"
              : "bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white"
        }`}>
          <div className="absolute inset-0 opacity-15 [background-image:radial-gradient(circle_at_center,white_1.5px,transparent_1.5px)] [background-size:24px_24px]" />
          <div className="relative text-center flex flex-col items-center p-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-[24px] border border-white/20 bg-white/10 shadow-2xl backdrop-blur-md mb-4">
              <Gift className="h-8 w-8 text-yellow-300" strokeWidth={1.5} />
            </div>
            {form.badge && (
              <span className="bg-white/20 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm border border-white/10">
                {form.badge}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Right Pane - Content */}
      <div className="relative flex flex-col justify-center px-6 py-8 sm:px-8 sm:py-10 overflow-hidden">
        <div className="relative z-10">
          {/* Badge */}
          {form.badge && (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] ${
              isDark ? "bg-white/10 text-white border border-white/10" : "bg-emerald-50 text-emerald-700"
            }`}>
              <Sparkles className="h-3 w-3 text-yellow-400" />
              {form.badge}
            </span>
          )}

          {/* Title */}
          <h3 className={`mt-3 text-2xl font-bold leading-tight tracking-tight ${
            isDark ? "text-white" : "text-navy"
          }`}>
            {form.title || "Your campaign title"}
          </h3>

          {/* Content */}
          <p className={`mt-3 whitespace-pre-line text-xs sm:text-sm leading-6 ${
            isDark ? "text-slate-300" : "text-slate-600"
          }`}>
            {form.content ||
              "Your campaign message appears here. Add a clear benefit and keep it easy to scan."}
          </p>

          {/* Prices Block */}
          {(form.originalPrice || form.salePrice) && (
            <div className="mt-4 flex items-center gap-3 flex-wrap">
              {form.originalPrice && (
                <span className="text-slate-400 text-sm line-through font-medium">
                  ৳{form.originalPrice}
                </span>
              )}
              {form.salePrice && (
                <span className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-lg font-black px-3.5 py-1 rounded-full shadow-md border border-white/10 inline-flex items-center justify-center">
                  ৳{form.salePrice}
                </span>
              )}
              {form.originalPrice && form.salePrice && (
                <span className="text-[10px] font-bold text-emerald-500 uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  Save ৳{Number(form.originalPrice) - Number(form.salePrice)}
                </span>
              )}
            </div>
          )}

          {/* Countdown Timer Block (Mocked in Preview) */}
          {form.countdownEndsAt && (
            <div className="mt-5 pt-4 border-t border-dashed border-slate-700/30">
              <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <Clock className="h-3 w-3 text-yellow-400 animate-pulse" />
                Limited Time Remaining
              </div>
              <div className="flex gap-1.5 text-center">
                {[
                  { value: "02", label: "Day" },
                  { value: "05", label: "Hour" },
                  { value: "09", label: "Min" },
                  { value: "21", label: "Sec" },
                ].map((item, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div className={`min-w-[42px] px-1.5 py-1.5 rounded-lg font-black text-sm border ${
                      isDark 
                        ? "bg-white/5 border-white/10 text-cyan-300" 
                        : "bg-slate-50 border-slate-200 text-indigo-600"
                    }`}>
                      {item.value}
                    </div>
                    <span className="text-[9px] font-semibold tracking-wider text-slate-400 mt-0.5 uppercase">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Button */}
          {form.ctaText ? (
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
              <span className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-5 text-xs font-bold shadow-md transition-all ${
                isDark 
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white" 
                  : "bg-navy text-white"
              }`}>
                {form.ctaText}
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
              <span className={`px-4 py-2 text-xs font-semibold ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}>
                Maybe later
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Megaphone;
  label: string;
  value: number;
  tone: "navy" | "emerald" | "sky";
}) {
  const tones = {
    navy: "bg-navy/10 text-navy",
    emerald: "bg-emerald-50 text-emerald-700",
    sky: "bg-sky-50 text-sky-700",
  };
  return (
    <AdminCard className="flex items-center gap-4 p-4 sm:p-5">
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-navy">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </AdminCard>
  );
}

function StudentOfferSender({
  showToast,
}: {
  showToast: (message: string, error?: boolean) => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [link, setLink] = useState("/courses");
  const [audience, setAudience] = useState<"all_students" | "user">("all_students");
  const [userId, setUserId] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    const response = await adminFetch<{ sent: number }>("/api/admin/offers", {
      method: "POST",
      body: JSON.stringify({
        title,
        content,
        link,
        audience,
        ...(audience === "user" ? { userId } : {}),
      }),
    });
    setPending(false);
    if (!response.success) {
      showToast(response.message || "Could not send offer.", true);
      return;
    }
    showToast(response.message || `Sent to ${response.data?.sent ?? 0} students.`);
    setTitle("");
    setContent("");
  }

  return (
    <form onSubmit={submit} className="mt-6 grid gap-4 border-t border-slate-200 pt-6 sm:grid-cols-2">
      <AdminField label="Audience">
        <AdminSelect
          value={audience}
          onChange={(event) =>
            setAudience(event.target.value as "all_students" | "user")
          }
        >
          <option value="all_students">All active students</option>
          <option value="user">One student by user ID</option>
        </AdminSelect>
      </AdminField>
      {audience === "user" ? (
        <AdminField label="Student user ID">
          <AdminInput
            required
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
          />
        </AdminField>
      ) : (
        <div />
      )}
      <AdminField label="Notification title">
        <AdminInput
          required
          maxLength={120}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </AdminField>
      <AdminField label="Internal link">
        <AdminInput
          value={link}
          onChange={(event) => setLink(event.target.value)}
          placeholder="/courses"
        />
      </AdminField>
      <AdminField label="Message" className="sm:col-span-2">
        <AdminTextarea
          required
          rows={4}
          maxLength={500}
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
      </AdminField>
      <div className="sm:col-span-2">
        <AdminButton type="submit" disabled={pending}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Send student notification
        </AdminButton>
      </div>
    </form>
  );
}
