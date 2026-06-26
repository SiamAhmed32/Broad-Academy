import { db } from "@/lib/db";

import type { GameOutcome } from "./tic-tac-toe";

let gameTablesAvailable: boolean | null = null;

async function hasGameTables() {
  if (gameTablesAvailable !== null) return gameTablesAvailable;
  try {
    await db.$queryRaw`SELECT "userId" FROM "StudentGameStats" LIMIT 1`;
    gameTablesAvailable = true;
  } catch {
    gameTablesAvailable = false;
  }
  return gameTablesAvailable;
}

const defaultStats = {
  wins: 0,
  losses: 0,
  draws: 0,
  gamesPlayed: 0,
  winStreak: 0,
  bestWinStreak: 0,
  lastPlayedAt: null as string | null,
};

export async function getStudentGameStats(userId: string) {
  if (!(await hasGameTables())) {
    return { ...defaultStats, enabled: false };
  }

  const stats = await db.studentGameStats.findUnique({
    where: { userId },
    select: {
      wins: true,
      losses: true,
      draws: true,
      gamesPlayed: true,
      winStreak: true,
      bestWinStreak: true,
      lastPlayedAt: true,
    },
  });

  if (!stats) {
    return { ...defaultStats, enabled: true };
  }

  return {
    wins: stats.wins,
    losses: stats.losses,
    draws: stats.draws,
    gamesPlayed: stats.gamesPlayed,
    winStreak: stats.winStreak,
    bestWinStreak: stats.bestWinStreak,
    lastPlayedAt: stats.lastPlayedAt?.toISOString() ?? null,
    enabled: true,
  };
}

const SESSION_TTL_MS = 30 * 60 * 1000;

export async function createStudentGameSession(userId: string) {
  if (!(await hasGameTables())) {
    return null;
  }

  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const session = await db.studentGameSession.create({
    data: {
      userId,
      expiresAt,
    },
    select: { id: true, expiresAt: true },
  });

  return {
    sessionId: session.id,
    expiresAt: session.expiresAt.toISOString(),
  };
}

export async function recordStudentGameResult(
  userId: string,
  sessionId: string,
  outcome: GameOutcome,
  moves: number,
) {
  if (!(await hasGameTables())) {
    return { ok: false as const, code: "DISABLED" as const };
  }

  if (moves < 5 || moves > 9) {
    return { ok: false as const, code: "INVALID_MOVES" as const };
  }

  const now = new Date();

  return db.$transaction(async (tx) => {
    const session = await tx.studentGameSession.findFirst({
      where: {
        id: sessionId,
        userId,
        consumedAt: null,
        expiresAt: { gt: now },
      },
      select: { id: true },
    });

    if (!session) {
      return { ok: false as const, code: "INVALID_SESSION" as const };
    }

    const existing = await tx.studentGameStats.findUnique({
      where: { userId },
      select: { winStreak: true, bestWinStreak: true },
    });

    const winStreak =
      outcome === "win" ? (existing?.winStreak ?? 0) + 1 : 0;
    const bestWinStreak = Math.max(
      existing?.bestWinStreak ?? 0,
      winStreak,
    );

    const stats = await tx.studentGameStats.upsert({
      where: { userId },
      create: {
        userId,
        wins: outcome === "win" ? 1 : 0,
        losses: outcome === "loss" ? 1 : 0,
        draws: outcome === "draw" ? 1 : 0,
        gamesPlayed: 1,
        winStreak,
        bestWinStreak,
        lastPlayedAt: now,
      },
      update: {
        wins: { increment: outcome === "win" ? 1 : 0 },
        losses: { increment: outcome === "loss" ? 1 : 0 },
        draws: { increment: outcome === "draw" ? 1 : 0 },
        gamesPlayed: { increment: 1 },
        winStreak,
        bestWinStreak,
        lastPlayedAt: now,
      },
      select: {
        wins: true,
        losses: true,
        draws: true,
        gamesPlayed: true,
        winStreak: true,
        bestWinStreak: true,
        lastPlayedAt: true,
      },
    });

    await tx.studentGameSession.update({
      where: { id: session.id },
      data: { consumedAt: now },
    });

    return {
      ok: true as const,
      stats: {
        wins: stats.wins,
        losses: stats.losses,
        draws: stats.draws,
        gamesPlayed: stats.gamesPlayed,
        winStreak: stats.winStreak,
        bestWinStreak: stats.bestWinStreak,
        lastPlayedAt: stats.lastPlayedAt?.toISOString() ?? null,
        enabled: true,
      },
    };
  });
}

export async function pruneExpiredGameSessions() {
  if (!(await hasGameTables())) return;
  await db.studentGameSession.deleteMany({
    where: {
      OR: [
        { expiresAt: { lte: new Date() } },
        {
          consumedAt: { not: null },
          createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      ],
    },
  });
}
