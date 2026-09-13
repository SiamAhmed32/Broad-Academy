import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

const SEARCHABLE_COLUMNS = Prisma.raw(`(
  coalesce("title", '') || ' ' ||
  coalesce("shortDescription", '') || ' ' ||
  coalesce("category", '') || ' ' ||
  coalesce("subject", '') || ' ' ||
  coalesce("instructorName", '')
)`);

let trigramAvailable: boolean | null = null;

export async function hasTrigramSearch(): Promise<boolean> {
  if (trigramAvailable !== null) return trigramAvailable;

  try {
    await db.$queryRaw`SELECT word_similarity('chem', 'chemistry')`;
    trigramAvailable = true;
  } catch {
    trigramAvailable = false;
  }

  return trigramAvailable;
}

export function courseSearchTokens(search: string): string[] {
  const tokens = search
    .trim()
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length >= 2 || /^\d+$/.test(token));

  if (tokens.length > 0) return [...new Set(tokens)];

  const fallback = search.trim().toLowerCase().replace(/[%_\\]/g, "");
  return fallback ? [fallback] : [];
}

function ilikePattern(value: string) {
  return `%${value.replace(/[%_\\]/g, "")}%`;
}

function tokenMatchSql(token: string, useTrigram: boolean): Prisma.Sql {
  const pattern = ilikePattern(token);

  if (useTrigram && token.length >= 4) {
    return Prisma.sql`(
      ${SEARCHABLE_COLUMNS} ILIKE ${pattern}
      OR word_similarity(${token}, ${SEARCHABLE_COLUMNS}) >= 0.4
    )`;
  }

  return Prisma.sql`${SEARCHABLE_COLUMNS} ILIKE ${pattern}`;
}

export function courseSearchFilter(
  search: string | undefined,
  useTrigram: boolean,
): Prisma.Sql {
  if (!search) return Prisma.empty;

  const tokens = courseSearchTokens(search);
  if (tokens.length === 0) return Prisma.empty;

  return Prisma.sql`AND (${Prisma.join(
    tokens.map((token) => tokenMatchSql(token, useTrigram)),
    " AND ",
  )})`;
}

export function courseSearchOrderBy(
  search: string | undefined,
  fallback: Prisma.Sql,
  useTrigram: boolean,
): Prisma.Sql {
  if (!search || courseSearchTokens(search).length === 0) {
    return fallback;
  }

  const phrase = ilikePattern(search.trim());
  const rank = useTrigram
    ? Prisma.sql`(
        CASE WHEN "title" ILIKE ${phrase} THEN 120 ELSE 0 END +
        CASE WHEN ${SEARCHABLE_COLUMNS} ILIKE ${phrase} THEN 40 ELSE 0 END +
        (word_similarity(${search.trim()}, ${SEARCHABLE_COLUMNS}) * 50)
      ) DESC`
    : Prisma.sql`(
        CASE WHEN "title" ILIKE ${phrase} THEN 120 ELSE 0 END +
        CASE WHEN ${SEARCHABLE_COLUMNS} ILIKE ${phrase} THEN 40 ELSE 0 END
      ) DESC`;

  return Prisma.sql`${rank}, ${fallback}`;
}
