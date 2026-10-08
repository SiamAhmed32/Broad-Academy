"use client";

import { BookOpen, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AdminButton, AdminInput, AdminLoading, useAdminToast } from "@/components/Admin";
import Modal from "@/components/reusables/Modal";
import { adminFetch } from "@/lib/admin/client";

type CourseOption = { id: string; title: string; status: string };

/** Lets owners/admins choose which courses a teacher may edit and monitor. */
export default function TeacherCoursesDialog({
  teacher,
  onClose,
  onSaved,
}: {
  teacher: { id: string; fullName: string } | null;
  onClose: () => void;
  onSaved: (count: number) => void;
}) {
  return (
    <Modal isOpen={teacher !== null} onClose={onClose} title="Teacher courses" size="lg">
      {teacher ? (
        <TeacherCoursesForm
          key={teacher.id}
          teacher={teacher}
          onClose={onClose}
          onSaved={onSaved}
        />
      ) : null}
    </Modal>
  );
}

function TeacherCoursesForm({
  teacher,
  onClose,
  onSaved,
}: {
  teacher: { id: string; fullName: string };
  onClose: () => void;
  onSaved: (count: number) => void;
}) {
  const { showToast } = useAdminToast();
  const [courses, setCourses] = useState<CourseOption[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminFetch<{ courses: CourseOption[]; assignedCourseIds: string[] }>(
      `/api/admin/team/${teacher.id}/courses`,
    ).then((res) => {
      if (cancelled) return;
      if (res.success && res.data) {
        setCourses(res.data.courses);
        setSelected(new Set(res.data.assignedCourseIds));
      } else {
        showToast(res.message ?? "Could not load courses.", true);
        setCourses([]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [showToast, teacher.id]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (courses ?? []).filter((course) => course.title.toLowerCase().includes(query));
  }, [courses, search]);

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const save = async () => {
    setSaving(true);
    const res = await adminFetch(`/api/admin/team/${teacher.id}/courses`, {
      method: "PUT",
      body: JSON.stringify({ courseIds: [...selected] }),
    });
    setSaving(false);
    if (!res.success) {
      showToast(res.message ?? "Could not save courses.", true);
      return;
    }
    showToast(`${teacher.fullName} now teaches ${selected.size} course${selected.size === 1 ? "" : "s"}.`);
    onSaved(selected.size);
  };

  return (
    <div className="p-6 pt-14 sm:p-7 sm:pt-14">
      <h2 className="text-xl font-semibold text-navy">Courses for {teacher.fullName}</h2>
      <p className="mt-1 text-sm text-slate-500">
        The teacher can upload content and see students only in the courses ticked here.
      </p>

      <div className="relative mt-5">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <AdminInput
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search courses..."
        />
      </div>

      <div className="mt-4 max-h-[50vh] overflow-y-auto rounded-xl border border-slate-200">
        {courses === null ? (
          <AdminLoading label="Loading courses..." />
        ) : visible.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">No courses found.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {visible.map((course) => (
              <li key={course.id}>
                <label className="flex cursor-pointer items-center gap-3 px-4 py-3 transition hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={selected.has(course.id)}
                    onChange={() => toggle(course.id)}
                    className="h-4 w-4 rounded border-slate-300 accent-accent"
                  />
                  <BookOpen className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-navy">
                    {course.title}
                  </span>
                  {course.status !== "PUBLISHED" ? (
                    <span className="text-xs text-slate-400">{course.status.toLowerCase()}</span>
                  ) : null}
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">{selected.size} selected</p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <AdminButton variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </AdminButton>
          <AdminButton onClick={() => void save()} isLoading={saving} disabled={courses === null}>
            Save courses
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
