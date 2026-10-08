import type { CourseInstructor } from "./types";

type InstructorProfile = {
  slug: string;
  fullName: string;
  avatarUrl: string;
  subjects: string[];
  specialty: string;
};

/**
 * `Course.instructorName` is free text, so admins may list several teachers:
 * "Rahim Uddin, Karim Ahmed", "Rahim & Karim", "Rahim and Karim", "রহিম ও করিম".
 */
export function splitInstructorNames(value: string) {
  const seen = new Set<string>();
  const names: string[] = [];

  for (const part of value.split(/\s*[,&/;|+\n]\s*|\s+(?:and|এবং|ও)\s+/i)) {
    const name = part.replace(/\s+/g, " ").trim();
    const key = normalizeInstructorName(name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }

  return names;
}

/** Case-, whitespace- and dot-insensitive key ("Md. Rahim" === "md rahim"). */
export function normalizeInstructorName(name: string) {
  return name.toLowerCase().replace(/[.\s]+/g, " ").trim();
}

/**
 * Matches each listed name to an active instructor profile. Unmatched names
 * keep the course subject so the fallback card still says what they teach.
 */
export function matchCourseInstructors(
  instructorName: string,
  profiles: InstructorProfile[],
  fallbackSubject: string,
): CourseInstructor[] {
  const byName = new Map(
    profiles.map((profile) => [normalizeInstructorName(profile.fullName), profile]),
  );

  return splitInstructorNames(instructorName).map((name) => {
    const profile = byName.get(normalizeInstructorName(name));
    if (!profile) {
      return { name, slug: null, avatarUrl: null, subjects: [fallbackSubject] };
    }

    const subjects = profile.subjects.length
      ? profile.subjects
      : [profile.specialty || fallbackSubject];

    return {
      name: profile.fullName,
      slug: profile.slug,
      avatarUrl: profile.avatarUrl || null,
      subjects: subjects.filter(Boolean).slice(0, 3),
    };
  });
}
