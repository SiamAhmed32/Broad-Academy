import type { CourseListQuery } from "./validation";

export function courseQueryParams(
  query: CourseListQuery,
  options?: {
    page?: number;
    remove?: "search" | "category" | "level";
  },
) {
  const params = new URLSearchParams();
  if (query.search && options?.remove !== "search") params.set("search", query.search);
  if (query.category && options?.remove !== "category") params.set("category", query.category);
  if (query.level && options?.remove !== "level") params.set("level", query.level);
  if (query.sort !== "featured") params.set("sort", query.sort);
  const page = options?.page ?? query.page;
  if (page > 1) params.set("page", String(page));
  return params;
}
