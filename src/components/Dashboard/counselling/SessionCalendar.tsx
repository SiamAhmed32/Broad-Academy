"use client";

import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
} from "lucide-react";
import {
  calendarDays,
  dhakaDateKey,
  formatHourLabel,
  getDhakaTimeParts,
  getWeekDaysForDate,
  shiftCalendarMonth,
  shiftDateKey,
} from "@/lib/counselling/calendar";
import type { CounsellingBookingSummary } from "@/lib/student/types";
import { sessionTime } from "./sessionPresentation";

type CalendarViewMode = "month" | "week" | "day" | "agenda";

const STATUS_FILTERS = [
  {
    id: "CONFIRMED" as const,
    label: "Confirmed",
    color: "bg-sky-500",
    chipBg: "bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100",
    accentBorder: "border-sky-500",
  },
  {
    id: "PENDING" as const,
    label: "Pending",
    color: "bg-amber-500",
    chipBg: "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100",
    accentBorder: "border-amber-500",
  },
  {
    id: "COMPLETED" as const,
    label: "Completed",
    color: "bg-emerald-500",
    chipBg:
      "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100",
    accentBorder: "border-emerald-500",
  },
  {
    id: "CANCELLED" as const,
    label: "Cancelled",
    color: "bg-slate-400",
    chipBg: "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200",
    accentBorder: "border-slate-400",
  },
];

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function SessionCalendar({
  month,
  bookings,
  onMonthChange,
  onSelect,
  onNewSession,
  canBook = true,
  defaultSidebarOpen = true,
  sidebarOpen: controlledSidebarOpen,
  onSidebarOpenChange,
}: {
  month: string;
  bookings: CounsellingBookingSummary[];
  onMonthChange: (month: string) => void;
  onSelect: (booking: CounsellingBookingSummary) => void;
  onNewSession?: () => void;
  canBook?: boolean;
  defaultSidebarOpen?: boolean;
  sidebarOpen?: boolean;
  onSidebarOpenChange?: (open: boolean) => void;
}) {
  const todayKey = dhakaDateKey(new Date());

  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [internalSidebarOpen, setInternalSidebarOpen] =
    useState(defaultSidebarOpen);
  const isSidebarControlled = controlledSidebarOpen !== undefined;
  const sidebarOpen = isSidebarControlled
    ? controlledSidebarOpen
    : internalSidebarOpen;

  function handleToggleSidebar() {
    const next = !sidebarOpen;
    if (!isSidebarControlled) {
      setInternalSidebarOpen(next);
    }
    onSidebarOpenChange?.(next);
  }

  const [focusedDate, setFocusedDate] = useState(
    todayKey.startsWith(month) ? todayKey : `${month}-01`,
  );
  const [miniMonthOverride, setMiniMonthOverride] = useState<string | null>(
    null,
  );
  const miniMonth = miniMonthOverride ?? month;

  // Sync focusedDate and miniMonthOverride when month prop changes externally without unmounting
  const [prevMonthProp, setPrevMonthProp] = useState(month);
  if (prevMonthProp !== month) {
    setPrevMonthProp(month);
    setMiniMonthOverride(null);
    if (!focusedDate.startsWith(month)) {
      setFocusedDate(todayKey.startsWith(month) ? todayKey : `${month}-01`);
    }
  }

  const [selectedStatuses, setSelectedStatuses] = useState<
    Set<CounsellingBookingSummary["status"]>
  >(new Set(["CONFIRMED", "PENDING", "COMPLETED", "CANCELLED"]));

  const weekScrollRef = useRef<HTMLDivElement>(null);
  const dayScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll time grid to daytime (8 AM = 8 * 56px = 448px)
  useEffect(() => {
    if (viewMode === "week" && weekScrollRef.current) {
      weekScrollRef.current.scrollTop = 8 * 56;
    } else if (viewMode === "day" && dayScrollRef.current) {
      dayScrollRef.current.scrollTop = 8 * 64;
    }
  }, [viewMode]);

  // Filter bookings based on selected checkboxes
  const filteredBookings = bookings.filter((b) =>
    selectedStatuses.has(b.status),
  );

  const scheduled = filteredBookings.filter((b) => b.scheduledAt);
  const unscheduled = filteredBookings.filter(
    (b) =>
      !b.scheduledAt && b.status !== "CANCELLED" && b.status !== "COMPLETED",
  );

  // Group scheduled bookings by Bangladesh date
  const eventsByDate = new Map<string, CounsellingBookingSummary[]>();
  for (const booking of scheduled) {
    const key = dhakaDateKey(booking.scheduledAt!);
    eventsByDate.set(key, [...(eventsByDate.get(key) ?? []), booking]);
  }
  for (const list of eventsByDate.values()) {
    list.sort((a, b) => a.scheduledAt!.localeCompare(b.scheduledAt!));
  }

  // Count by status for filter list
  const statusCounts = bookings.reduce(
    (acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Filter toggles
  const allSelected = selectedStatuses.size === STATUS_FILTERS.length;
  function toggleAllFilters() {
    if (allSelected) {
      setSelectedStatuses(new Set());
    } else {
      setSelectedStatuses(
        new Set(["CONFIRMED", "PENDING", "COMPLETED", "CANCELLED"]),
      );
    }
  }

  function toggleStatusFilter(status: CounsellingBookingSummary["status"]) {
    setSelectedStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }

  // Navigation handlers
  function handlePrev() {
    if (viewMode === "month" || viewMode === "agenda") {
      const prevMonth = shiftCalendarMonth(month, -1);
      setMiniMonthOverride(null);
      onMonthChange(prevMonth);
      setFocusedDate(`${prevMonth}-01`);
    } else if (viewMode === "week") {
      const newDate = shiftDateKey(focusedDate, -7);
      setFocusedDate(newDate);
      const newMonth = newDate.slice(0, 7);
      if (newMonth !== month) {
        setMiniMonthOverride(null);
        onMonthChange(newMonth);
      }
    } else if (viewMode === "day") {
      const newDate = shiftDateKey(focusedDate, -1);
      setFocusedDate(newDate);
      const newMonth = newDate.slice(0, 7);
      if (newMonth !== month) {
        setMiniMonthOverride(null);
        onMonthChange(newMonth);
      }
    }
  }

  function handleNext() {
    if (viewMode === "month" || viewMode === "agenda") {
      const nextMonth = shiftCalendarMonth(month, 1);
      setMiniMonthOverride(null);
      onMonthChange(nextMonth);
      setFocusedDate(`${nextMonth}-01`);
    } else if (viewMode === "week") {
      const newDate = shiftDateKey(focusedDate, 7);
      setFocusedDate(newDate);
      const newMonth = newDate.slice(0, 7);
      if (newMonth !== month) {
        setMiniMonthOverride(null);
        onMonthChange(newMonth);
      }
    } else if (viewMode === "day") {
      const newDate = shiftDateKey(focusedDate, 1);
      setFocusedDate(newDate);
      const newMonth = newDate.slice(0, 7);
      if (newMonth !== month) {
        setMiniMonthOverride(null);
        onMonthChange(newMonth);
      }
    }
  }

  function handleToday() {
    setFocusedDate(todayKey);
    const todayMonth = todayKey.slice(0, 7);
    if (todayMonth !== month) {
      setMiniMonthOverride(null);
      onMonthChange(todayMonth);
    }
  }

  function handleMiniDateClick(key: string) {
    setFocusedDate(key);
    const keyMonth = key.slice(0, 7);
    if (keyMonth !== month) {
      setMiniMonthOverride(null);
      onMonthChange(keyMonth);
    }
  }

  // Header title formatted according to current view
  let headerTitle = "";
  if (viewMode === "month" || viewMode === "agenda") {
    headerTitle = new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${month}-01T00:00:00Z`));
  } else if (viewMode === "week") {
    const weekDays = getWeekDaysForDate(focusedDate);
    const first = new Date(`${weekDays[0].key}T12:00:00Z`);
    const last = new Date(`${weekDays[6].key}T12:00:00Z`);
    if (first.getUTCMonth() === last.getUTCMonth()) {
      headerTitle = new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(first);
    } else {
      const m1 = new Intl.DateTimeFormat("en-US", {
        month: "short",
        timeZone: "UTC",
      }).format(first);
      const m2 = new Intl.DateTimeFormat("en-US", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(last);
      headerTitle = `${m1} – ${m2}`;
    }
  } else if (viewMode === "day") {
    headerTitle = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${focusedDate}T12:00:00Z`));
  }

  const miniMonthTitle = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${miniMonth}-01T00:00:00Z`));

  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs lg:flex-row">
      {/* =========================================================================
          LEFT SIDEBAR: + New session, Mini Datepicker Calendar, Event Filters
      ========================================================================== */}
      <aside
        id="counselling-calendar-sidebar"
        aria-label="Calendar sidebar"
        data-state={sidebarOpen ? "open" : "closed"}
        hidden={!sidebarOpen}
        className={`w-full shrink-0 flex-col gap-5 border-b border-slate-200 bg-white p-4 sm:p-5 lg:w-64 lg:border-b-0 lg:border-r xl:w-72 ${
          sidebarOpen ? "flex" : "hidden"
        }`}
      >
        {/* + New Event Button */}
        <button
          type="button"
          onClick={onNewSession}
          disabled={!canBook}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>New event</span>
        </button>

        {/* Mini Calendar */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous mini calendar month"
              onClick={() =>
                setMiniMonthOverride(shiftCalendarMonth(miniMonth, -1))
              }
              className="rounded-md p-1 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <span className="text-xs font-bold text-slate-800">
              {miniMonthTitle}
            </span>
            <button
              type="button"
              aria-label="Next mini calendar month"
              onClick={() =>
                setMiniMonthOverride(shiftCalendarMonth(miniMonth, 1))
              }
              className="rounded-md p-1 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
            >
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <span
                key={day}
                className="py-1 text-[10px] font-semibold text-slate-400"
              >
                {day}
              </span>
            ))}
          </div>

          <div
            className="grid grid-cols-7 gap-y-1 text-center"
            role="grid"
            aria-label="Mini calendar month days"
          >
            {calendarDays(miniMonth).map((day) => {
              const isToday = day.key === todayKey;
              const isFocused = day.key === focusedDate;
              const hasEvents = (eventsByDate.get(day.key)?.length ?? 0) > 0;
              const formattedDate = new Intl.DateTimeFormat("en-US", {
                dateStyle: "long",
                timeZone: "UTC",
              }).format(new Date(`${day.key}T12:00:00Z`));

              return (
                <button
                  key={day.key}
                  type="button"
                  tabIndex={isFocused ? 0 : -1}
                  aria-label={`${formattedDate}${isToday ? ", today" : ""}${hasEvents ? ", has sessions" : ""}`}
                  onClick={() => handleMiniDateClick(day.key)}
                  className={`group relative mx-auto flex h-7 w-7 flex-col items-center justify-center rounded-full text-[11px] transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500 ${
                    isToday
                      ? "bg-slate-900 font-bold text-white shadow-xs"
                      : isFocused
                        ? "bg-blue-100 font-bold text-blue-900 ring-2 ring-blue-500"
                        : day.inMonth
                          ? "text-slate-700 hover:bg-slate-200/70"
                          : "text-slate-300 hover:text-slate-500"
                  }`}
                >
                  <span>{day.day}</span>
                  {hasEvents && !isToday ? (
                    <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-blue-500" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Event Filters Section */}
        <div className="border-t border-slate-100 pt-4">
          <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-slate-500">
            Event filters
          </h3>

          <div className="space-y-1.5">
            {/* All Checkbox */}
            <label className="flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100">
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border transition ${
                  allSelected
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white"
                }`}
              >
                {allSelected ? <Check className="h-3 w-3" /> : null}
              </span>
              <input
                type="checkbox"
                className="sr-only"
                checked={allSelected}
                onChange={toggleAllFilters}
              />
              <span className="flex-1 font-semibold text-slate-900">All</span>
            </label>

            {/* Individual Status Checkboxes */}
            {STATUS_FILTERS.map((item) => {
              const checked = selectedStatuses.has(item.id);
              const count = statusCounts[item.id] || 0;

              return (
                <label
                  key={item.id}
                  className="flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border transition ${
                      checked
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {checked ? <Check className="h-3 w-3" /> : null}
                  </span>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() => toggleStatusFilter(item.id)}
                  />
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.color}`}
                  />
                  <span className="flex-1">{item.label}</span>
                  {count > 0 ? (
                    <span className="text-[11px] text-slate-400">{count}</span>
                  ) : null}
                </label>
              );
            })}
          </div>
        </div>

        {/* Timezone hint & Unscheduled Count */}
        <div className="mt-auto border-t border-slate-100 pt-3 text-[11px] text-slate-500">
          <p className="flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5 text-slate-400" />
            <span>Timezone: GMT+6 (Bangladesh)</span>
          </p>
          {unscheduled.length > 0 ? (
            <p className="mt-1 text-amber-700">
              {unscheduled.length} request(s) awaiting date arrangement
            </p>
          ) : null}
        </div>
      </aside>

      {/* =========================================================================
          RIGHT MAIN AREA: Top Bar (Today, Nav Arrows, Title, View Dropdown) + Calendar Body
      ========================================================================== */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header Bar */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSidebar}
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              aria-expanded={sidebarOpen}
              aria-controls="counselling-calendar-sidebar"
              data-state={sidebarOpen ? "open" : "closed"}
              title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
              ) : (
                <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={handleToday}
              className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              Today
            </button>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Previous"
                onClick={handlePrev}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>

              <h2 className="min-w-36 text-center text-sm font-bold text-slate-900 sm:min-w-44 sm:text-base">
                {headerTitle}
              </h2>

              <button
                type="button"
                aria-label="Next"
                onClick={handleNext}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* View Dropdown (Month / Week / Day / Agenda) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setViewMenuOpen((v) => !v)}
              className="inline-flex h-8 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              aria-haspopup="listbox"
              aria-expanded={viewMenuOpen}
            >
              <span className="capitalize">{viewMode}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            </button>

            {viewMenuOpen ? (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setViewMenuOpen(false)}
                />
                <div
                  role="listbox"
                  aria-label="Calendar view options"
                  className="absolute right-0 top-full z-40 mt-1 w-32 rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                >
                  {(["month", "week", "day", "agenda"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      role="option"
                      aria-selected={viewMode === mode}
                      onClick={() => {
                        setViewMode(mode);
                        setViewMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-xs capitalize transition ${
                        viewMode === mode
                          ? "bg-slate-100 font-bold text-slate-900"
                          : "font-medium text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span>{mode}</span>
                      {viewMode === mode ? <Check className="h-3 w-3" aria-hidden="true" /> : null}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </header>

        {/* View Content Bodies */}
        {viewMode === "month" && (
          <MonthView
            month={month}
            todayKey={todayKey}
            eventsByDate={eventsByDate}
            onSelect={onSelect}
            onDayClick={(dateKey) => {
              setFocusedDate(dateKey);
              setViewMode("day");
            }}
          />
        )}

        {viewMode === "week" && (
          <WeekView
            focusedDate={focusedDate}
            todayKey={todayKey}
            eventsByDate={eventsByDate}
            onSelect={onSelect}
            scrollRef={weekScrollRef}
          />
        )}

        {viewMode === "day" && (
          <DayView
            focusedDate={focusedDate}
            todayKey={todayKey}
            eventsByDate={eventsByDate}
            onSelect={onSelect}
            scrollRef={dayScrollRef}
          />
        )}

        {viewMode === "agenda" && (
          <AgendaView
            scheduled={scheduled}
            unscheduled={unscheduled}
            onSelect={onSelect}
          />
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   1. MONTH VIEW (7 columns Sun-Sat, Day cells with event pills)
========================================================================== */
function MonthView({
  month,
  todayKey,
  eventsByDate,
  onSelect,
  onDayClick,
}: {
  month: string;
  todayKey: string;
  eventsByDate: Map<string, CounsellingBookingSummary[]>;
  onSelect: (booking: CounsellingBookingSummary) => void;
  onDayClick: (dateKey: string) => void;
}) {
  const days = calendarDays(month);

  return (
    <div className="flex flex-1 flex-col">
      {/* Weekday Header Row */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50">
        {WEEKDAY_NAMES.map((name) => (
          <div
            key={name}
            className="py-2.5 text-center text-xs font-semibold text-slate-500"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Month Days Grid */}
      <div className="grid flex-1 grid-cols-7 auto-rows-fr">
        {days.map((day) => {
          const isToday = day.key === todayKey;
          const entries = eventsByDate.get(day.key) ?? [];
          const visibleEntries = entries.slice(0, 2);
          const extraCount = entries.length - visibleEntries.length;

          return (
            <div
              key={day.key}
              className={`flex min-h-[105px] min-w-0 flex-col border-b border-r border-slate-200 p-1.5 transition sm:min-h-[120px] sm:p-2 ${
                day.inMonth ? "bg-white" : "bg-slate-50/40 text-slate-300"
              }`}
            >
              {/* Day Number Header */}
              <div className="mb-1 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onDayClick(day.key)}
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs transition ${
                    isToday
                      ? "bg-blue-600 font-bold text-white shadow-xs"
                      : day.inMonth
                        ? "font-semibold text-slate-700 hover:bg-slate-100"
                        : "text-slate-400"
                  }`}
                >
                  {day.day}
                </button>
              </div>

              {/* Event Pills inside day cell */}
              <div className="space-y-1">
                {visibleEntries.map((entry) => {
                  const filterConfig = STATUS_FILTERS.find(
                    (f) => f.id === entry.status,
                  );
                  const chipClass =
                    filterConfig?.chipBg ??
                    "bg-slate-100 border-slate-200 text-slate-700";

                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => onSelect(entry)}
                      title={`${entry.fullName} (${entry.status}) - ${sessionTime(entry.scheduledAt!)}`}
                      className={`block w-full truncate rounded-md border px-1.5 py-1 text-left text-[11px] font-medium shadow-2xs transition hover:brightness-95 ${chipClass}`}
                    >
                      <span className="font-semibold">
                        {sessionTime(entry.scheduledAt!)}
                      </span>{" "}
                      · {entry.fullName}
                    </button>
                  );
                })}

                {extraCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => onDayClick(day.key)}
                    className="block text-left text-[10px] font-bold text-blue-600 hover:underline"
                  >
                    +{extraCount} more
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================================
   2. WEEK VIEW (GMT+6 time column + 7 day columns, 24 hour grid)
========================================================================== */
function WeekView({
  focusedDate,
  todayKey,
  eventsByDate,
  onSelect,
  scrollRef,
}: {
  focusedDate: string;
  todayKey: string;
  eventsByDate: Map<string, CounsellingBookingSummary[]>;
  onSelect: (booking: CounsellingBookingSummary) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  const weekDays = getWeekDaysForDate(focusedDate);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header Row: GMT+6 + 7 Day Names & Numbers */}
      <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] border-b border-slate-200 bg-slate-50/70">
        <div className="border-r border-slate-200 py-3 text-center text-[10px] font-semibold text-slate-400">
          GMT+6
        </div>
        {weekDays.map((day) => {
          const isToday = day.key === todayKey;
          return (
            <div
              key={day.key}
              className={`border-r border-slate-200 py-2.5 text-center last:border-r-0 ${
                isToday ? "bg-blue-50/60 font-bold" : ""
              }`}
            >
              <div
                className={`text-[11px] font-medium ${isToday ? "text-blue-700" : "text-slate-500"}`}
              >
                {WEEKDAY_NAMES[day.dayOfWeek]}
              </div>
              <div
                className={`mt-0.5 text-sm ${
                  isToday
                    ? "font-extrabold text-blue-700"
                    : "font-semibold text-slate-800"
                }`}
              >
                {day.day}
              </div>
            </div>
          );
        })}
      </div>

      {/* Scrollable 24-hour time grid */}
      <div
        ref={scrollRef}
        className="relative max-h-[560px] flex-1 overflow-y-auto"
      >
        <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))]">
          {/* Hour labels down the left */}
          <div className="border-r border-slate-200 bg-white">
            {hours.map((h) => (
              <div
                key={h}
                className="relative h-14 border-b border-slate-100 pr-2 text-right text-[11px] font-medium text-slate-400"
              >
                <span className="-top-2.5 relative">{formatHourLabel(h)}</span>
              </div>
            ))}
          </div>

          {/* 7 Day Columns with Events */}
          {weekDays.map((day) => {
            const dayEvents = eventsByDate.get(day.key) ?? [];
            const isToday = day.key === todayKey;

            return (
              <div
                key={day.key}
                className={`relative border-r border-slate-200 last:border-r-0 ${
                  isToday ? "bg-blue-50/20" : "bg-white"
                }`}
              >
                {/* Background hour gridlines */}
                {hours.map((h) => (
                  <div key={h} className="h-14 border-b border-slate-100" />
                ))}

                {/* Absolutely positioned event cards */}
                {dayEvents.map((event) => {
                  const { hour, minute } = getDhakaTimeParts(
                    event.scheduledAt!,
                  );
                  const topOffset = (hour + minute / 60) * 56;
                  const filterConfig = STATUS_FILTERS.find(
                    (f) => f.id === event.status,
                  );
                  const bgClass =
                    filterConfig?.chipBg ?? "bg-blue-50 border-blue-200";

                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => onSelect(event)}
                      style={{ top: `${topOffset}px`, height: "50px" }}
                      className={`absolute inset-x-1 z-10 overflow-hidden rounded-md border p-1 text-left text-xs shadow-xs transition hover:brightness-95 ${bgClass}`}
                    >
                      <p className="truncate font-bold leading-tight">
                        {event.fullName}
                      </p>
                      <p className="text-[10px] opacity-80">
                        {sessionTime(event.scheduledAt!)}
                      </p>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   3. DAY VIEW (Single Day 24 hour grid with full-width slot cards)
========================================================================== */
function DayView({
  focusedDate,
  todayKey,
  eventsByDate,
  onSelect,
  scrollRef,
}: {
  focusedDate: string;
  todayKey: string;
  eventsByDate: Map<string, CounsellingBookingSummary[]>;
  onSelect: (booking: CounsellingBookingSummary) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const dayEvents = eventsByDate.get(focusedDate) ?? [];
  const isToday = focusedDate === todayKey;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div
        ref={scrollRef}
        className="relative max-h-[560px] flex-1 overflow-y-auto"
      >
        <div className="grid grid-cols-[70px_minmax(0,1fr)]">
          {/* Time Labels on left */}
          <div className="border-r border-slate-200 bg-white">
            {hours.map((h) => (
              <div
                key={h}
                className="relative h-16 border-b border-slate-100 pr-2.5 text-right text-[11px] font-medium text-slate-400"
              >
                <span className="-top-2.5 relative">{formatHourLabel(h)}</span>
              </div>
            ))}
          </div>

          {/* Main Day Column with Gridlines & Events */}
          <div
            className={`relative ${isToday ? "bg-blue-50/15" : "bg-white"}`}
          >
            {hours.map((h) => (
              <div key={h} className="h-16 border-b border-slate-100" />
            ))}

            {dayEvents.map((event) => {
              const { hour, minute } = getDhakaTimeParts(event.scheduledAt!);
              const topOffset = (hour + minute / 60) * 64;
              const filterConfig = STATUS_FILTERS.find(
                (f) => f.id === event.status,
              );
              const accentBorder = filterConfig?.accentBorder ?? "border-blue-500";
              const bgClass =
                filterConfig?.chipBg ?? "bg-sky-50 border-sky-200";

              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => onSelect(event)}
                  style={{ top: `${topOffset}px`, height: "58px" }}
                  className={`absolute inset-x-2 z-10 flex flex-col justify-center rounded-lg border border-l-4 p-2 text-left shadow-xs transition hover:brightness-95 ${accentBorder} ${bgClass}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900">
                      Study Plan &amp; Counselling · {event.fullName}
                    </span>
                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                      {event.status}
                    </span>
                  </div>
                  <span className="mt-0.5 text-xs text-slate-600">
                    {sessionTime(event.scheduledAt!)} (Bangladesh Time)
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   4. AGENDA VIEW (Chronological list grouped by date + Unscheduled)
========================================================================== */
function AgendaView({
  scheduled,
  unscheduled,
  onSelect,
}: {
  scheduled: CounsellingBookingSummary[];
  unscheduled: CounsellingBookingSummary[];
  onSelect: (booking: CounsellingBookingSummary) => void;
}) {
  const groups = new Map<string, CounsellingBookingSummary[]>();
  for (const b of scheduled) {
    const key = dhakaDateKey(b.scheduledAt!);
    groups.set(key, [...(groups.get(key) ?? []), b]);
  }
  const sortedDates = Array.from(groups.keys()).sort();

  return (
    <div className="max-h-[580px] flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
      {sortedDates.length === 0 && unscheduled.length === 0 ? (
        <div className="py-12 text-center text-slate-500">
          <CalendarDays className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-2 text-sm font-medium">
            No sessions match your filter for this period.
          </p>
        </div>
      ) : null}

      {/* Scheduled Sessions Grouped by Date */}
      {sortedDates.map((dateKey) => {
        const items = groups.get(dateKey) ?? [];
        const dateFormatted = new Intl.DateTimeFormat("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
          timeZone: "UTC",
        }).format(new Date(`${dateKey}T12:00:00Z`));

        return (
          <div key={dateKey} className="space-y-2">
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <CalendarDays className="h-3.5 w-3.5 text-blue-600" />
              <span>{dateFormatted}</span>
            </h4>

            <div className="space-y-2">
              {items.map((event) => {
                const filterConfig = STATUS_FILTERS.find(
                  (f) => f.id === event.status,
                );
                return (
                  <div
                    key={event.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs transition hover:border-blue-300"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {event.fullName}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            filterConfig?.chipBg ?? "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {event.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Scheduled: {sessionTime(event.scheduledAt!)} (BST)
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelect(event)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50"
                    >
                      Session details
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Awaiting Schedule Section */}
      {unscheduled.length > 0 ? (
        <div className="space-y-2 border-t border-dashed border-slate-200 pt-4">
          <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700">
            <Clock3 className="h-3.5 w-3.5 text-amber-600" />
            <span>Awaiting schedule ({unscheduled.length})</span>
          </h4>
          <p className="text-xs text-slate-500">
            These requests have no session date yet. Our team will arrange the
            time with you.
          </p>

          <div className="space-y-2">
            {unscheduled.map((event) => (
              <div
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/40 p-3.5 shadow-2xs"
              >
                <div>
                  <span className="text-sm font-bold text-slate-900">
                    {event.fullName}
                  </span>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Date to be arranged · Status: {event.status.toLowerCase()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelect(event)}
                  className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-50"
                >
                  View request
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
