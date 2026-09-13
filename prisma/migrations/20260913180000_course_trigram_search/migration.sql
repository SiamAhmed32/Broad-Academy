CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "Course_search_trgm_idx"
ON "Course"
USING GIN (
  (
    coalesce("title", '') || ' ' ||
    coalesce("shortDescription", '') || ' ' ||
    coalesce("category", '') || ' ' ||
    coalesce("subject", '') || ' ' ||
    coalesce("instructorName", '')
  ) gin_trgm_ops
);
