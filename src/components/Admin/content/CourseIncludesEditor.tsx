"use client";

import { useEffect, useId, useState } from "react";
import { ChevronDown, ChevronUp, ListChecks, Plus, Trash2 } from "lucide-react";

import { AdminButton, AdminInput } from "@/components/Admin";
import {
  COURSE_INCLUDE_MAX_LENGTH,
  COURSE_INCLUDES_MAX_ITEMS,
} from "@/lib/courses/constants";

const iconButton =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:pointer-events-none disabled:opacity-30";

// Stable row keys so inputs keep focus and state when lines are reordered.
let rowKeySeed = 0;
const newRowKey = () => ++rowKeySeed;

/**
 * Editor for the "এই কোর্সে যা থাকছে" list on the public course page:
 * add, edit, remove and reorder short lines.
 */
export function CourseIncludesEditor({
  value,
  onChange,
  error,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  error?: string;
}) {
  const [keys, setKeys] = useState(() => value.map(newRowKey));
  const [focusKey, setFocusKey] = useState<number | null>(null);
  const idPrefix = useId();
  const atLimit = value.length >= COURSE_INCLUDES_MAX_ITEMS;

  useEffect(() => {
    if (focusKey === null) return;
    document.getElementById(`${idPrefix}-${focusKey}`)?.focus();
  }, [focusKey, idPrefix]);

  function insertAt(index: number) {
    if (atLimit) return;
    const key = newRowKey();
    onChange([...value.slice(0, index), "", ...value.slice(index)]);
    setKeys([...keys.slice(0, index), key, ...keys.slice(index)]);
    setFocusKey(key);
  }

  function update(index: number, text: string) {
    onChange(value.map((line, i) => (i === index ? text : line)));
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
    setKeys(keys.filter((_, i) => i !== index));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const swap = <T,>(list: T[]) => {
      const next = [...list];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    };
    onChange(swap(value));
    setKeys(swap(keys));
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-navy">This course includes</p>
          <p className="mt-0.5 text-xs leading-5 text-slate-500">
            Shown as “এই কোর্সে যা থাকছে” on the course page, one point per line.
            Leave empty to show the auto-generated list.
          </p>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
          {value.length}/{COURSE_INCLUDES_MAX_ITEMS}
        </span>
      </div>

      {value.length > 0 ? (
        <ol className="mt-4 space-y-2">
          {value.map((line, index) => {
            const key = keys[index] ?? -index - 1;
            const remaining = COURSE_INCLUDE_MAX_LENGTH - line.length;

            return (
              <li key={key} className="flex items-center gap-1.5 sm:gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-semibold text-slate-400 ring-1 ring-slate-200">
                  {index + 1}
                </span>
                <div className="relative min-w-0 flex-1">
                  <AdminInput
                    id={`${idPrefix}-${key}`}
                    value={line}
                    maxLength={COURSE_INCLUDE_MAX_LENGTH}
                    placeholder="যেমন: সপ্তাহে ৩টি লাইভ ক্লাস"
                    aria-label={`Line ${index + 1}`}
                    className="font-bangla pr-12"
                    onChange={(event) => update(index, event.target.value)}
                    onKeyDown={(event) => {
                      // Enter adds the next point instead of submitting the form.
                      if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                        event.preventDefault();
                        insertAt(index + 1);
                      }
                    }}
                  />
                  {remaining <= 30 ? (
                    <span
                      className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold ${
                        remaining <= 10 ? "text-amber-600" : "text-slate-400"
                      }`}
                    >
                      {remaining}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center">
                  <button
                    type="button"
                    className={iconButton}
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move line ${index + 1} up`}
                    title="Move up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={iconButton}
                    onClick={() => move(index, 1)}
                    disabled={index === value.length - 1}
                    aria-label={`Move line ${index + 1} down`}
                    title="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={`${iconButton} hover:bg-red-50 hover:text-red-600`}
                    onClick={() => remove(index)}
                    aria-label={`Remove line ${index + 1}`}
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center">
          <ListChecks className="h-6 w-6 text-slate-300" />
          <p className="mt-2 text-sm text-slate-500">
            No points yet. Add what students get, e.g. live classes, lecture notes, exams.
          </p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <AdminButton
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertAt(value.length)}
          disabled={atLimit}
        >
          <Plus className="h-4 w-4" />
          Add line
        </AdminButton>
        {atLimit ? (
          <span className="text-xs text-slate-500">
            Maximum {COURSE_INCLUDES_MAX_ITEMS} lines reached.
          </span>
        ) : (
          <span className="hidden text-xs text-slate-400 sm:inline">
            Tip: press Enter to add the next line.
          </span>
        )}
      </div>

      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
