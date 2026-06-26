"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Expand,
  LoaderCircle,
  LockKeyhole,
  Maximize2,
  Minimize2,
  MonitorSmartphone,
  Pause,
  Play,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { CurrentLearningLesson } from "@/lib/learning/types";
import { WATCH_HEARTBEAT_INTERVAL_MS } from "@/lib/auth/constants";
import { isYouTubeVideoId } from "@/lib/video/youtube";

type YouTubePlayer = {
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  pauseVideo: () => void;
  playVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setPlaybackRate: (rate: number) => void;
};

type YouTubeNamespace = {
  Player: new (
    element: HTMLElement,
    options: {
      host: string;
      videoId: string;
      playerVars: Record<string, number | string>;
      events: {
        onReady: (event: { target: YouTubePlayer }) => void;
        onStateChange: (event: { data: number; target: YouTubePlayer }) => void;
      };
    },
  ) => YouTubePlayer;
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
};

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YouTubeNamespace> | null = null;

function getReadyYouTubeApi() {
  const api = window.YT;
  return typeof api?.Player === "function" &&
    typeof api.PlayerState === "object"
    ? api
    : null;
}

function loadYouTubeIframeApi() {
  const readyApi = getReadyYouTubeApi();
  if (readyApi) return Promise.resolve(readyApi);
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise<YouTubeNamespace>((resolve, reject) => {
    let settled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let timeoutTimer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (pollTimer) clearInterval(pollTimer);
      if (timeoutTimer) clearTimeout(timeoutTimer);
    };

    const finishIfReady = () => {
      const api = getReadyYouTubeApi();
      if (settled || !api) return;
      settled = true;
      cleanup();
      resolve(api);
    };

    window.onYouTubeIframeAPIReady = finishIfReady;

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]',
    );

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onerror = () => {
        if (settled) return;
        settled = true;
        cleanup();
        youtubeApiPromise = null;
        reject(new Error("YouTube player could not be loaded."));
      };
      document.head.appendChild(script);
    }

    pollTimer = setInterval(finishIfReady, 100);
    timeoutTimer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      youtubeApiPromise = null;
      reject(new Error("YouTube player took too long to load."));
    }, 15_000);

    finishIfReady();
  });

  return youtubeApiPromise;
}

export function ProtectedYouTubePlayer({
  lesson,
  courseSlug,
  lessonSlug,
  studentName,
  studentEmail,
  onCompleted,
  theaterMode,
  onToggleTheater,
}: {
  lesson: CurrentLearningLesson;
  courseSlug: string;
  lessonSlug: string;
  studentName: string;
  studentEmail: string;
  onCompleted: () => void;
  theaterMode: boolean;
  onToggleTheater: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const mountRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasWatchLockRef = useRef(false);
  const watchedRef = useRef(lesson.watchedSeconds);
  const lastTickRef = useRef<number | null>(null);
  const completedRef = useRef(lesson.completed);
  const [ready, setReady] = useState(false);
  const [playerError, setPlayerError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [watchBlocked, setWatchBlocked] = useState(false);
  const [watchBlockedMessage, setWatchBlockedMessage] = useState("");
  const [playbackRate, setPlaybackRate] = useState(1);
  const [position, setPosition] = useState(lesson.lastPositionSec);
  const [duration, setDuration] = useState(lesson.durationSeconds);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const [watermarkPosition, setWatermarkPosition] = useState(0);

  const watermark = useMemo(
    () => `${studentName} · ${studentEmail}`,
    [studentEmail, studentName],
  );

  const releaseWatchLock = useCallback(async () => {
    if (!hasWatchLockRef.current) return;
    hasWatchLockRef.current = false;
    try {
      await fetch("/api/learning/watch", { method: "DELETE" });
    } catch {
      // Best effort on tab close.
    }
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    heartbeatRef.current = null;
  }, []);

  const handleWatchConflict = useCallback(
    (message: string) => {
      setWatchBlocked(true);
      setWatchBlockedMessage(message);
      setPlaying(false);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      lastTickRef.current = null;
      stopHeartbeat();
      playerRef.current?.pauseVideo();
      void releaseWatchLock();
    },
    [releaseWatchLock, stopHeartbeat],
  );

  const sendHeartbeat = useCallback(async () => {
    try {
      const response = await fetch("/api/learning/watch", { method: "PATCH" });
      if (response.status === 409) {
        const result = await response.json();
        handleWatchConflict(
          result.message ??
            "Another device took over video playback on your account.",
        );
      }
    } catch {
      // Ignore transient network errors; stale lock expires automatically.
    }
  }, [handleWatchConflict]);

  const startHeartbeat = useCallback(() => {
    stopHeartbeat();
    void sendHeartbeat();
    heartbeatRef.current = setInterval(() => {
      void sendHeartbeat();
    }, WATCH_HEARTBEAT_INTERVAL_MS);
  }, [sendHeartbeat, stopHeartbeat]);

  const claimWatchLock = useCallback(async () => {
    try {
      const response = await fetch("/api/learning/watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: lesson.id,
          courseSlug,
          lessonSlug,
        }),
      });
      if (response.ok) {
        hasWatchLockRef.current = true;
        setWatchBlocked(false);
        setWatchBlockedMessage("");
        return true;
      }
      const result = await response.json();
      if (response.status === 409) {
        setWatchBlocked(true);
        setWatchBlockedMessage(
          result.message ??
            "Another device is already playing a lesson video on your account.",
        );
        return false;
      }
      return false;
    } catch {
      setWatchBlocked(true);
      setWatchBlockedMessage("Could not verify playback permission. Try again.");
      return false;
    }
  }, [courseSlug, lesson.id, lessonSlug]);

  const saveProgress = useCallback(
    async (forceComplete = false) => {
      const player = playerRef.current;
      if (!player) return;

      const currentPosition = Math.max(0, Math.floor(player.getCurrentTime() || 0));
      const playerDuration = Math.max(
        lesson.durationSeconds,
        Math.floor(player.getDuration() || 0),
      );
      const completed =
        forceComplete ||
        (playerDuration > 0 && watchedRef.current >= playerDuration * 0.9);

      setPosition(currentPosition);
      setDuration(playerDuration);
      setSaveState("saving");
      try {
        const response = await fetch("/api/learning/progress", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lessonId: lesson.id,
            completed,
            watchedSeconds: Math.floor(watchedRef.current),
            lastPositionSec: currentPosition,
          }),
          keepalive: true,
        });
        if (response.ok && completed && !completedRef.current) {
          completedRef.current = true;
          onCompleted();
        }
      } finally {
        setSaveState("saved");
      }
    },
    [lesson.durationSeconds, lesson.id, onCompleted],
  );

  const stopTracking = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    lastTickRef.current = null;
  }, []);

  const startTracking = useCallback(() => {
    stopTracking();
    lastTickRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = lastTickRef.current
        ? Math.min(2, (now - lastTickRef.current) / 1000)
        : 0;
      lastTickRef.current = now;
      watchedRef.current = Math.min(
        Math.max(duration, lesson.durationSeconds),
        watchedRef.current + elapsed,
      );
      setPosition(Math.floor(playerRef.current?.getCurrentTime() || 0));
    }, 1000);
  }, [duration, lesson.durationSeconds, stopTracking]);

  const createPlayer = useCallback(() => {
    const youtube = getReadyYouTubeApi();
    if (
      !youtube ||
      !mountRef.current ||
      playerRef.current ||
      !lesson.youtubeVideoId
    ) {
      return;
    }

    const Player = youtube.Player;
    playerRef.current = new Player(mountRef.current, {
      host: "https://www.youtube-nocookie.com",
      videoId: lesson.youtubeVideoId,
      playerVars: {
        controls: 0,
        disablekb: 1,
        iv_load_policy: 3,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        fs: 0,
        origin: window.location.origin,
      },
      events: {
        onReady: ({ target }) => {
          setReady(true);
          const actualDuration = Math.floor(target.getDuration() || 0);
          if (actualDuration) setDuration(actualDuration);
          if (
            lesson.lastPositionSec > 5 &&
            lesson.lastPositionSec < actualDuration - 10
          ) {
            target.seekTo(lesson.lastPositionSec, true);
          }
        },
        onStateChange: ({ data }) => {
          if (data === youtube.PlayerState.PLAYING) {
            setPlaying(true);
            startTracking();
            startHeartbeat();
          }
          if (data === youtube.PlayerState.PAUSED) {
            setPlaying(false);
            stopTracking();
            stopHeartbeat();
            void releaseWatchLock();
            void saveProgress();
          }
          if (data === youtube.PlayerState.ENDED) {
            setPlaying(false);
            stopTracking();
            stopHeartbeat();
            void releaseWatchLock();
            watchedRef.current = Math.max(watchedRef.current, lesson.durationSeconds);
            void saveProgress(true);
          }
        },
      },
    });
  }, [
    lesson.durationSeconds,
    lesson.lastPositionSec,
    lesson.youtubeVideoId,
    releaseWatchLock,
    saveProgress,
    startHeartbeat,
    startTracking,
    stopHeartbeat,
    stopTracking,
  ]);

  useEffect(() => {
    let cancelled = false;

    void loadYouTubeIframeApi()
      .then(() => {
        if (!cancelled) createPlayer();
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setPlayerError(
            error instanceof Error
              ? error.message
              : "YouTube player could not be loaded.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [createPlayer]);

  useEffect(() => {
    const interval = setInterval(
      () => setWatermarkPosition((current) => (current + 1) % 4),
      18_000,
    );
    const saveInterval = setInterval(() => {
      if (playerRef.current?.getPlayerState() === window.YT?.PlayerState.PLAYING) {
        void saveProgress();
      }
    }, 15_000);
    const handlePageHide = () => void saveProgress();
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      clearInterval(interval);
      clearInterval(saveInterval);
      window.removeEventListener("pagehide", handlePageHide);
      stopTracking();
      stopHeartbeat();
      void releaseWatchLock();
      void saveProgress();
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [releaseWatchLock, saveProgress, stopHeartbeat, stopTracking]);

  async function toggleFullscreen() {
    if (!wrapperRef.current) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await wrapperRef.current.requestFullscreen();
  }

  async function togglePlayback() {
    const player = playerRef.current;
    if (!player || !ready) return;
    if (playing) {
      player.pauseVideo();
      return;
    }
    const claimed = await claimWatchLock();
    if (!claimed) return;
    player.playVideo();
  }

  function seekToPosition(nextPosition: number) {
    const safePosition = Math.max(0, Math.min(duration, nextPosition));
    playerRef.current?.seekTo(safePosition, true);
    setPosition(safePosition);
  }

  function changePlaybackRate(rate: number) {
    if (!playerRef.current || !ready) return;
    playerRef.current.setPlaybackRate(rate);
    setPlaybackRate(rate);
  }

  if (!lesson.youtubeVideoId || !isYouTubeVideoId(lesson.youtubeVideoId)) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-[1.75rem] bg-navy px-6 text-center text-white">
        <div>
          <LockKeyhole className="mx-auto h-9 w-9 text-[#83e8ca]" />
          <h2 className="mt-4 text-xl font-semibold">Video is being prepared</h2>
          <p className="mt-2 text-sm text-white/55">Please check again shortly.</p>
        </div>
      </div>
    );
  }

  const progress = duration ? Math.min(100, Math.round((position / duration) * 100)) : 0;
  const positions = [
    "left-4 top-4 sm:left-6 sm:top-6",
    "right-4 top-4 sm:right-6 sm:top-6",
    "bottom-12 left-4 sm:bottom-16 sm:left-6",
    "bottom-12 right-4 sm:bottom-16 sm:right-6",
  ];

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-[1.8rem] border border-white/8 bg-[#071521] shadow-[0_28px_80px_rgba(15,42,68,.22)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-5 py-4 text-white sm:px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#83e8ca]">
            <ShieldCheck className="h-4 w-4" />
            Protected learning room
          </div>
          <h1 className="mt-1 truncate text-base font-semibold sm:text-lg">{lesson.title}</h1>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/55">
          {saveState === "saving" ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <span className="h-2 w-2 rounded-full bg-[#83e8ca]" />}
          {saveState === "saving" ? "Saving progress" : "Progress saved"}
        </div>
      </div>

      <div
        ref={wrapperRef}
        className="group relative aspect-video bg-black"
        onContextMenu={(event) => event.preventDefault()}
      >
        <div
          ref={mountRef}
          className="pointer-events-none absolute inset-0 h-full w-full select-none"
          aria-hidden="true"
        />
        {ready && !playerError ? (
          <button
            type="button"
            onClick={togglePlayback}
            className="absolute inset-0 z-10 cursor-pointer"
            aria-label={playing ? "Pause video" : "Play video"}
          />
        ) : null}
        {!ready && !playerError ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#071521] text-white">
            <LoaderCircle className="h-8 w-8 animate-spin text-[#83e8ca]" />
          </div>
        ) : null}
        {playerError ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#071521] px-6 text-center text-white">
            <div>
              <LockKeyhole className="mx-auto h-8 w-8 text-[#83e8ca]" />
              <p className="mt-3 font-semibold">Video player unavailable</p>
              <p className="mt-1 text-sm text-white/55">{playerError}</p>
            </div>
          </div>
        ) : null}
        {watchBlocked ? (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#071521]/95 px-6 text-center text-white">
            <div className="max-w-md">
              <MonitorSmartphone className="mx-auto h-8 w-8 text-[#83e8ca]" />
              <p className="mt-3 text-lg font-semibold">Playback blocked on this device</p>
              <p className="mt-2 text-sm leading-6 text-white/60">
                {watchBlockedMessage ||
                  "Another device is already playing a lesson video on your account."}
              </p>
              <Link
                href="/dashboard?tab=security"
                className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-[#83e8ca] px-4 text-sm font-bold text-navy transition hover:bg-[#6fe0bb]"
              >
                Manage signed-in devices
              </Link>
            </div>
          </div>
        ) : null}
        <div
          className={`pointer-events-none absolute z-20 max-w-[75%] rounded-md border border-white/15 bg-black/35 px-2.5 py-1.5 text-[10px] font-semibold text-white/55 backdrop-blur-sm transition-all duration-700 sm:text-xs ${positions[watermarkPosition]}`}
        >
          {watermark}
        </div>

        {ready && !playerError ? (
          <div className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black via-black/75 to-transparent px-3 pb-3 pt-12 text-white sm:px-5 sm:pb-4">
            <label className="block">
              <span className="sr-only">Video position</span>
              <input
                type="range"
                min={0}
                max={Math.max(1, duration)}
                step={1}
                value={Math.min(position, Math.max(1, duration))}
                onChange={(event) => seekToPosition(Number(event.target.value))}
                className="h-1.5 w-full cursor-pointer accent-[#43d6ac]"
                aria-valuetext={`${formatClock(position)} of ${formatClock(duration)}`}
              />
            </label>

            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlayback}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-navy transition hover:bg-[#83e8ca]"
                aria-label={playing ? "Pause video" : "Play video"}
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
              </button>

              <span className="min-w-[84px] text-xs font-medium text-white/75">
                {formatClock(position)} / {formatClock(duration)}
              </span>

              <div
                className="ml-auto flex items-center gap-1 rounded-xl border border-white/15 bg-black/35 p-1 backdrop-blur-md"
                aria-label="Playback speed"
              >
                {[1, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => changePlaybackRate(rate)}
                    className={`h-7 rounded-lg px-2 text-xs font-bold transition ${
                      playbackRate === rate
                        ? "bg-[#83e8ca] text-navy"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                    aria-pressed={playbackRate === rate}
                  >
                    {rate}×
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={onToggleTheater}
                className="hidden h-9 items-center gap-2 rounded-xl border border-white/15 bg-black/35 px-3 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/15 sm:inline-flex"
                aria-label={theaterMode ? "Minimize video" : "Enlarge video"}
                aria-pressed={theaterMode}
              >
                {theaterMode ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
                {theaterMode ? "Minimize" : "Enlarge"}
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-black/35 text-white backdrop-blur-md transition hover:bg-white/15"
                aria-label="Toggle fullscreen"
              >
                <Expand className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}

        <div className="sr-only" aria-live="polite">
          {progress}% played at {playbackRate} times speed
        </div>
      </div>
    </motion.section>
  );
}

function formatClock(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(safe / 60);
  return `${minutes}:${String(safe % 60).padStart(2, "0")}`;
}
