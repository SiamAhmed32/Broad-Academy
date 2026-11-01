"use client";

import { Check, ChevronDown, Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { adminFetch } from "@/lib/admin/client";
import { splitInstructorNames } from "@/lib/courses/instructors";

type Teacher = {
  id: string;
  fullName: string;
  specialty: string;
  avatarUrl: string | null;
};

export function CourseInstructorPicker({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const selected = splitInstructorNames(value);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setLoadError("");
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      const result = await adminFetch<{ teachers: Teacher[] }>(
        `/api/admin/courses/instructors?${params}`,
        { signal: controller.signal },
      );
      if (controller.signal.aborted) return;
      setTeachers(result.data?.teachers ?? []);
      setLoadError(result.success ? "" : result.message ?? "Could not load teachers.");
      setLoading(false);
    }, search ? 200 : 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, search]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function toggleTeacher(name: string) {
    const exists = selected.some((item) => item.toLowerCase() === name.toLowerCase());
    onChange(
      (exists
        ? selected.filter((item) => item.toLowerCase() !== name.toLowerCase())
        : [...selected, name]
      ).join(", "),
    );
    setSearch("");
    inputRef.current?.focus();
  }

  return (
    <div ref={rootRef} className="relative">
      <span className="mb-1.5 block text-sm font-medium text-navy">Teachers</span>
      <div className={`min-h-11 rounded-xl border bg-white p-1.5 ${error ? "border-red-400" : "border-slate-200"}`}>
        <div className="flex flex-wrap items-center gap-1.5">
          {selected.map((name) => (
            <span key={name} className="inline-flex max-w-full items-center gap-1 rounded-lg bg-accent/10 px-2.5 py-1 text-sm font-medium text-navy">
              <span className="truncate">{name}</span>
              <button type="button" onClick={() => toggleTeacher(name)} aria-label={`Remove ${name}`} className="rounded p-0.5 hover:bg-accent/15">
                <X aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
          <div className="flex min-w-[150px] flex-1 items-center gap-2 px-1.5">
            <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              ref={inputRef}
              type="search"
              value={search}
              onFocus={() => setOpen(true)}
              onChange={(event) => { setSearch(event.target.value); setOpen(true); }}
              onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}
              placeholder={selected.length ? "Search more teachers" : "Search or select a teacher"}
              role="combobox"
              aria-expanded={open}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-label="Search active teachers"
              className="h-8 min-w-0 flex-1 bg-transparent text-sm text-navy outline-none placeholder:text-slate-400"
            />
            <button type="button" onClick={() => { if (open) { setOpen(false); inputRef.current?.blur(); } else { setOpen(true); inputRef.current?.focus(); } }} aria-label={open ? "Hide teachers" : "Show teachers"} className="rounded p-1 text-slate-500 hover:bg-slate-100">
              <ChevronDown aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      <p className="mt-1.5 text-xs text-slate-500">Choose active instructor profiles. You can select several teachers for a combo course.</p>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
      {open ? (
        <div id={listId} role="listbox" aria-multiselectable="true" aria-label="Active teachers" className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
          {loading ? <p className="px-3 py-2 text-sm text-slate-500">Searching teachers…</p> : null}
          {!loading && loadError ? <p className="px-3 py-2 text-sm text-red-600">{loadError}</p> : null}
          {!loading && !loadError && teachers.length === 0 ? <p className="px-3 py-2 text-sm text-slate-500">No active teachers found.</p> : null}
          {!loading && !loadError && teachers.map((teacher) => {
            const isSelected = selected.some((name) => name.toLowerCase() === teacher.fullName.toLowerCase());
            return (
              <button key={teacher.id} type="button" role="option" aria-selected={isSelected} onClick={() => toggleTeacher(teacher.fullName)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">{teacher.fullName.slice(0, 1)}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-navy">{teacher.fullName}</span><span className="block truncate text-xs text-slate-500">{teacher.specialty}</span></span>
                {isSelected ? <Check aria-hidden="true" className="h-4 w-4 text-accent" /> : null}
              </button>
            );
          })}
          {!loading && !search && teachers.length === 100 ? <p className="px-3 py-2 text-xs text-slate-500">Showing the first 100 teachers. Search to find others.</p> : null}
        </div>
      ) : null}
    </div>
  );
}
