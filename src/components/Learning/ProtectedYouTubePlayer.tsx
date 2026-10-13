"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Expand,
  LoaderCircle,
  LockKeyhole,
  LogIn,
  Maximize2,
  Minimize2,
  MonitorSmartphone,
  Pause,
  Play,
  ShieldCheck,
  Volume2,
  VolumeX,
} from "lucide-react";
import Link from "next/link";
import {
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { CurrentLearningLesson } from "@/lib/learning/types";
import { WATCH_HEARTBEAT_INTERVAL_MS } from "@/lib/auth/constants";
import { isYouTubeVideoId } from "@/lib/video/youtube";

type YouTubePlayer = {
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  getVolume: () => number;
  isMuted: () => boolean;
  mute: () => void;
  pauseVideo: () => void;
  playVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  unMute: () => void;
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
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number; BUFFERING: number };
};

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

/**
 * Why playback is stopped on this device:
 * - busy: another device was already playing when this one tried to start;
 * - taken-over: another device started playing while this one was;
 * - signed-out: this device's login has ended.
 */
type WatchBlock = {
  kind: "busy" | "taken-over" | "signed-out";
  message: string;
  /** When the block was shown (ms). */
  since?: number;
};

type ClaimOutcome =
  | { status: "granted" }
  | { status: "conflict"; message: string }
  | { status: "signed-out" }
  // Network or server trouble: never a reason to stop a class.
  | { status: "unavailable" };

type PlayerHandlers = {
  ready: (player: YouTubePlayer) => void;
  stateChange: (state: number) => void;
  wake: () => void;
  sleep: () => void;
  saveTick: () => void;
  teardown: () => void;
};

// Backoff between claim attempts when the server can't be reached.
const CLAIM_RETRY_DELAYS_MS = [1_000, 2_000, 4_000];
// How often a blocked player checks whether the other device has stopped:
// often at first, then slowly, so a forgotten tab doesn't poll forever.
const BLOCK_RECHECK_INTERVAL_MS = 5_000;
const BLOCK_RECHECK_SLOW_MS = 30_000;
const BLOCK_RECHECK_FAST_FOR_MS = 120_000;
// A "busy" device starts by itself only this soon after the student tapped
// play. Later it shows a Resume button instead, so a tab left open on a
// laptop can't start playing and take the lock from the phone in use.
const BUSY_AUTO_START_MS = 60_000;
// A play tap still counts as "wants to play" while YouTube starts up.
const PLAY_INTENT_MS = 15_000;
// "Play here" keeps taking over for this long, in case the first start is refused.
const TAKEOVER_WINDOW_MS = 60_000;
// Pausing frees the lock after this delay, so seeks and quick pause/play
// don't churn it.
const PAUSE_RELEASE_DELAY_MS = 2_000;
// If an automatic resume hasn't started by now, show a Resume button.
const RESUME_CHECK_DELAY_MS = 2_500;
// Let a page that was just woken up get its network back first.
const WAKE_DELAY_MS = 400;

const DEFAULT_CONFLICT_MESSAGE =
  "Another device is already playing a lesson on your account.";
const TAKEN_OVER_MESSAGE =
  "Your account started playing a lesson on another device, so this one paused.";
const SIGNED_OUT_MESSAGE =
  "Your login on this device has ended. Please sign in again to keep watching.";

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
        // A failed tag would be reused by the next attempt; let it add a fresh one.
        script.remove();
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

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/** The player's state, or null while its API methods aren't attached yet. */
function readPlayerState(player: YouTubePlayer | null) {
  if (!player || typeof player.getPlayerState !== "function") return null;
  return player.getPlayerState();
}

function isPlaybackActive(player: YouTubePlayer | null) {
  const states = window.YT?.PlayerState;
  const state = readPlayerState(player);
  if (!states || state === null) return false;
  return state === states.PLAYING || state === states.BUFFERING;
}

/** iPhone/iPad, where the page can't change the volume (only mute it). */
function isAppleMobileDevice() {
  const { userAgent, maxTouchPoints } = window.navigator;
  // iPadOS reports itself as a Mac, so also check for a touch screen.
  return (
    /iPad|iPhone|iPod/.test(userAgent) ||
    (/Macintosh/.test(userAgent) && maxTouchPoints > 1)
  );
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
  // The YouTube player binds its event handlers once, so they go through
  // this ref, which always points at the latest render's callbacks.
  const handlersRef = useRef<PlayerHandlers | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const releaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumeCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasWatchLockRef = useRef(false);
  const claimRef = useRef<{
    promise: Promise<ClaimOutcome>;
    takeover: boolean;
  } | null>(null);
  // Until when a recent play tap still counts as wanting to play.
  const playIntentUntilRef = useRef(0);
  // Until when claims take the lock over (the student pressed "Play here").
  const takeoverUntilRef = useRef(0);
  const blockRef = useRef<WatchBlock | null>(null);
  // Only the student's own mute is kept when they press play.
  const userMutedRef = useRef(false);
  const unmountedRef = useRef(false);
  // Where to start once the student presses play. Seeking an unstarted
  // YouTube player makes it auto-play.
  const pendingSeekRef = useRef<number | null>(null);
  const watchedRef = useRef(lesson.watchedSeconds);
  const lastTickRef = useRef<number | null>(null);
  const completedRef = useRef(lesson.completed);
  // Latest known duration, read by the tracking interval.
  const durationRef = useRef(lesson.durationSeconds);
  const [ready, setReady] = useState(false);
  const [playerError, setPlayerError] = useState("");
  // Bumped by "Try again" to load the YouTube player once more.
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [canFullscreen, setCanFullscreen] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [watchBlock, setWatchBlock] = useState<WatchBlock | null>(null);
  const [resumePrompt, setResumePrompt] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [muted, setMuted] = useState(false);
  const [volume, setVolumeLevel] = useState(100);
  const [canSetVolume, setCanSetVolume] = useState(true);
  const [position, setPosition] = useState(lesson.lastPositionSec);
  const [duration, setDuration] = useState(lesson.durationSeconds);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const [watermarkPosition, setWatermarkPosition] = useState(0);

  const watermark = useMemo(
    () => `${studentName} · ${studentEmail}`,
    [studentEmail, studentName],
  );

  const updateDuration = useCallback((seconds: number) => {
    durationRef.current = seconds;
    setDuration(seconds);
  }, []);

  const showBlock = useCallback((block: WatchBlock | null) => {
    blockRef.current = block;
    setWatchBlock(block);
  }, []);

  const clearResumeCheck = useCallback(() => {
    if (resumeCheckRef.current) clearTimeout(resumeCheckRef.current);
    resumeCheckRef.current = null;
  }, []);

  const cancelScheduledRelease = useCallback(() => {
    if (releaseTimerRef.current) clearTimeout(releaseTimerRef.current);
    releaseTimerRef.current = null;
  }, []);

  const releaseWatchLock = useCallback(async () => {
    cancelScheduledRelease();
    if (!hasWatchLockRef.current) return;
    hasWatchLockRef.current = false;
    try {
      // keepalive lets the release finish even when the tab is closing.
      await fetch("/api/learning/watch", { method: "DELETE", keepalive: true });
    } catch {
      // Best effort: an unreleased lock goes stale on its own.
    }
  }, [cancelScheduledRelease]);

  const scheduleRelease = useCallback(() => {
    cancelScheduledRelease();
    releaseTimerRef.current = setTimeout(() => {
      releaseTimerRef.current = null;
      void releaseWatchLock();
    }, PAUSE_RELEASE_DELAY_MS);
  }, [cancelScheduledRelease, releaseWatchLock]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    heartbeatRef.current = null;
  }, []);

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
      const player = playerRef.current;
      if (!durationRef.current && player) {
        const playerDuration = Math.floor(player.getDuration() || 0);
        if (playerDuration) updateDuration(playerDuration);
      }
      // Cap at the video length once it's known; never cap at zero.
      const cap = Math.max(durationRef.current, lesson.durationSeconds);
      const watched = watchedRef.current + elapsed;
      watchedRef.current = cap > 0 ? Math.min(cap, watched) : watched;
      setPosition(Math.floor(player?.getCurrentTime() || 0));
    }, 1000);
  }, [lesson.durationSeconds, stopTracking, updateDuration]);

  /** Whether this device should be holding the watch lock right now. */
  const wantsWatchLock = useCallback(
    () =>
      isPlaybackActive(playerRef.current) ||
      Date.now() < playIntentUntilRef.current,
    [],
  );

  const claimOnce = useCallback(
    async (takeover: boolean): Promise<ClaimOutcome> => {
      try {
        const response = await fetch("/api/learning/watch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            lessonId: lesson.id,
            courseSlug,
            lessonSlug,
            ...(takeover ? { takeover: true } : {}),
          }),
        });
        if (response.ok) return { status: "granted" };
        if (response.status === 401) return { status: "signed-out" };
        if (response.status === 409) {
          const result = await response.json().catch(() => ({}));
          if (result.code === "OTHER_DEVICE") {
            return {
              status: "conflict",
              message:
                typeof result.message === "string"
                  ? result.message
                  : DEFAULT_CONFLICT_MESSAGE,
            };
          }
        }
        return { status: "unavailable" };
      } catch {
        return { status: "unavailable" };
      }
    },
    [courseSlug, lesson.id, lessonSlug],
  );

  /**
   * Ask the server for the account's watch lock. Concurrent callers share
   * one request. Network and server errors are retried with backoff and end
   * as "unavailable", which callers treat as "keep playing".
   */
  const claimWatchLock = useCallback((): Promise<ClaimOutcome> => {
    const takeover = Date.now() < takeoverUntilRef.current;
    const inFlight = claimRef.current;
    if (inFlight && (inFlight.takeover || !takeover)) return inFlight.promise;

    const promise = (async (): Promise<ClaimOutcome> => {
      let outcome = await claimOnce(takeover);
      for (const delay of CLAIM_RETRY_DELAYS_MS) {
        if (
          outcome.status !== "unavailable" ||
          unmountedRef.current ||
          !wantsWatchLock()
        ) {
          break;
        }
        await wait(delay);
        if (unmountedRef.current) break;
        outcome = await claimOnce(takeover);
      }
      if (outcome.status === "granted") hasWatchLockRef.current = true;
      return outcome;
    })();

    const entry = { promise, takeover };
    claimRef.current = entry;
    void promise.finally(() => {
      if (claimRef.current === entry) claimRef.current = null;
    });
    return promise;
  }, [claimOnce, wantsWatchLock]);

  const handleWatchConflict = useCallback(
    (block: WatchBlock) => {
      showBlock({ ...block, since: Date.now() });
      setPlaying(false);
      setResumePrompt(false);
      clearResumeCheck();
      playIntentUntilRef.current = 0;
      takeoverUntilRef.current = 0;
      stopTracking();
      stopHeartbeat();
      playerRef.current?.pauseVideo();
      void releaseWatchLock();
    },
    [clearResumeCheck, releaseWatchLock, showBlock, stopHeartbeat, stopTracking],
  );

  /** Act on a claim result. Only a real conflict or sign-out stops playback. */
  const settleClaim = useCallback(
    (outcome: ClaimOutcome, userInitiated: boolean) => {
      if (unmountedRef.current) {
        // Granted after the student left: nothing would renew it, and the
        // other device would wait for it to go stale.
        if (outcome.status === "granted") void releaseWatchLock();
        return;
      }
      if (outcome.status === "granted") {
        if (blockRef.current) showBlock(null);
        if (!wantsWatchLock()) {
          // Paused while we were asking: hand the lock straight back.
          void releaseWatchLock();
          return;
        }
        if (isPlaybackActive(playerRef.current)) takeoverUntilRef.current = 0;
        return;
      }
      if (outcome.status === "conflict") {
        // A stale answer to an older request: "Play here" is taking over.
        if (Date.now() < takeoverUntilRef.current) return;
        handleWatchConflict(
          userInitiated
            ? { kind: "busy", message: outcome.message }
            : { kind: "taken-over", message: TAKEN_OVER_MESSAGE },
        );
        return;
      }
      if (outcome.status === "signed-out") {
        handleWatchConflict({ kind: "signed-out", message: SIGNED_OUT_MESSAGE });
      }
      // "unavailable": keep playing. The heartbeat keeps trying meanwhile.
    },
    [handleWatchConflict, releaseWatchLock, showBlock, wantsWatchLock],
  );

  /** Renew the watch lock, or claim it when this device doesn't hold it. */
  const syncWatchLock = useCallback(async () => {
    if (blockRef.current || unmountedRef.current) return;

    if (!hasWatchLockRef.current) {
      const outcome = await claimWatchLock();
      settleClaim(outcome, Date.now() < playIntentUntilRef.current);
      return;
    }

    let response: Response;
    try {
      response = await fetch("/api/learning/watch", {
        method: "PATCH",
        cache: "no-store",
      });
    } catch {
      // Network blip: the next beat retries and the lock stays valid meanwhile.
      return;
    }
    if (response.status === 401) {
      settleClaim({ status: "signed-out" }, false);
      return;
    }
    if (response.status !== 409 || blockRef.current) return;

    const result = await response.json().catch(() => ({}));
    if (result.code === "OTHER_DEVICE") {
      settleClaim({ status: "conflict", message: TAKEN_OVER_MESSAGE }, false);
      return;
    }
    // Our lock lapsed (the tab slept, or a pause/play raced the release) and
    // no other device holds it: take it back instead of stopping playback.
    hasWatchLockRef.current = false;
    const outcome = await claimWatchLock();
    settleClaim(outcome, false);
  }, [claimWatchLock, settleClaim]);

  const startHeartbeat = useCallback(() => {
    stopHeartbeat();
    void syncWatchLock();
    heartbeatRef.current = setInterval(() => {
      void syncWatchLock();
    }, WATCH_HEARTBEAT_INTERVAL_MS);
  }, [stopHeartbeat, syncWatchLock]);

  const saveProgress = useCallback(
    async (forceComplete = false) => {
      const player = playerRef.current;
      // The API methods appear only once the player is ready.
      if (!player || typeof player.getCurrentTime !== "function") return;

      const currentPosition = Math.max(0, Math.floor(player.getCurrentTime() || 0));
      const playerDuration = Math.max(
        lesson.durationSeconds,
        durationRef.current,
        Math.floor(player.getDuration() || 0),
      );
      const completed =
        forceComplete ||
        (playerDuration > 0 && watchedRef.current >= playerDuration * 0.9);

      setPosition(currentPosition);
      updateDuration(playerDuration);
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
      } catch {
        // Saved again on the next tick.
      } finally {
        setSaveState("saved");
      }
    },
    [lesson.durationSeconds, lesson.id, onCompleted, updateDuration],
  );

  /** Start playing. Call it straight from a tap, before any await. */
  const startPlayback = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    // A quick pause→play: keep the lock instead of releasing it mid-start.
    cancelScheduledRelease();
    setResumePrompt(false);
    clearResumeCheck();
    playIntentUntilRef.current = Date.now() + PLAY_INTENT_MS;
    // Phones only allow sound that a tap turned on, so unmute inside it.
    if (!userMutedRef.current) {
      player.unMute();
      setMuted(false);
    }
    if (pendingSeekRef.current !== null) {
      player.seekTo(pendingSeekRef.current, true);
      pendingSeekRef.current = null;
    }
    // Playing right away keeps the tap valid; the PLAYING handler then
    // claims the watch lock in the background.
    player.playVideo();
  }, [cancelScheduledRelease, clearResumeCheck]);

  const scheduleResumeCheck = useCallback(() => {
    clearResumeCheck();
    resumeCheckRef.current = setTimeout(() => {
      resumeCheckRef.current = null;
      // The browser refused to start without a tap: offer a clear button.
      if (!blockRef.current && !isPlaybackActive(playerRef.current)) {
        setResumePrompt(true);
      }
    }, RESUME_CHECK_DELAY_MS);
  }, [clearResumeCheck]);

  /** While blocked: has the other device stopped? If so, carry on. */
  const recheckBlock = useCallback(async () => {
    const block = blockRef.current;
    if (!block || block.kind === "signed-out") return;

    let status: { blockedByOther?: boolean } | null = null;
    try {
      const response = await fetch("/api/learning/watch", { cache: "no-store" });
      if (response.status === 401) {
        if (blockRef.current === block) {
          handleWatchConflict({ kind: "signed-out", message: SIGNED_OUT_MESSAGE });
        }
        return;
      }
      // Server trouble: check again on the next tick.
      if (!response.ok) return;
      status = await response.json().catch(() => null);
    } catch {
      // Offline: check again on the next tick or when the connection returns.
      return;
    }
    if (!status || unmountedRef.current || blockRef.current !== block) return;
    if (status.blockedByOther) return;

    showBlock(null);
    const player = playerRef.current;
    if (!player) return;
    if (
      block.kind === "busy" &&
      document.visibilityState === "visible" &&
      Date.now() - (block.since ?? 0) < BUSY_AUTO_START_MS
    ) {
      // The student just tried to watch here, so start. The PLAYING handler
      // claims the lock; if the browser wants a tap, a Resume button shows.
      playIntentUntilRef.current = Date.now() + PLAY_INTENT_MS;
      if (!userMutedRef.current) player.unMute();
      player.playVideo();
      scheduleResumeCheck();
    } else {
      setResumePrompt(true);
    }
  }, [handleWatchConflict, scheduleResumeCheck, showBlock]);

  const handlePlayerReady = useCallback(
    (player: YouTubePlayer) => {
      setReady(true);
      const actualDuration = Math.floor(player.getDuration() || 0);
      if (actualDuration) updateDuration(actualDuration);
      if (
        lesson.lastPositionSec > 5 &&
        lesson.lastPositionSec < actualDuration - 10
      ) {
        pendingSeekRef.current = lesson.lastPositionSec;
      }
      setMuted(player.isMuted());
      const playerVolume = Math.round(player.getVolume());
      if (Number.isFinite(playerVolume)) setVolumeLevel(playerVolume);
      setCanSetVolume(!isAppleMobileDevice());
      // iPhone Safari can't make a page element fullscreen.
      setCanFullscreen(
        Boolean(document.fullscreenEnabled) &&
          typeof wrapperRef.current?.requestFullscreen === "function",
      );
    },
    [lesson.lastPositionSec, updateDuration],
  );

  const handlePlayerStateChange = useCallback(
    (state: number) => {
      const states = window.YT?.PlayerState;
      const player = playerRef.current;
      if (!states || !player) return;

      if (state === states.PLAYING) {
        if (blockRef.current) {
          // Never play behind the "another device" screen.
          player.pauseVideo();
          return;
        }
        cancelScheduledRelease();
        clearResumeCheck();
        setResumePrompt(false);
        setPlaying(true);
        setMuted(player.isMuted());
        startTracking();
        if (hasWatchLockRef.current) takeoverUntilRef.current = 0;
        // Renews the lock, or claims it now. Playback carries on while we
        // ask; only a real conflict stops it.
        if (!heartbeatRef.current) startHeartbeat();
      }
      if (state === states.PAUSED) {
        setPlaying(false);
        playIntentUntilRef.current = 0;
        stopTracking();
        stopHeartbeat();
        // In the background (e.g. a locked iPhone) the page may be suspended
        // before a delayed release runs, so free the lock now.
        if (document.visibilityState === "hidden") void releaseWatchLock();
        else scheduleRelease();
        void saveProgress();
      }
      if (state === states.ENDED) {
        setPlaying(false);
        playIntentUntilRef.current = 0;
        stopTracking();
        stopHeartbeat();
        void releaseWatchLock();
        watchedRef.current = Math.max(
          watchedRef.current,
          durationRef.current,
          lesson.durationSeconds,
        );
        void saveProgress(true);
      }
    },
    [
      cancelScheduledRelease,
      clearResumeCheck,
      lesson.durationSeconds,
      releaseWatchLock,
      saveProgress,
      scheduleRelease,
      startHeartbeat,
      startTracking,
      stopHeartbeat,
      stopTracking,
    ],
  );

  /** The page is visible/focused/online again, or was restored. */
  const handleWake = useCallback(() => {
    if (unmountedRef.current || !playerRef.current) return;
    if (blockRef.current) {
      void recheckBlock();
      return;
    }
    if (isPlaybackActive(playerRef.current)) {
      setPlaying(true);
      if (!timerRef.current) startTracking();
      // Renew right away: re-claims a lock that lapsed while we were away,
      // or pauses if another device really took over.
      startHeartbeat();
    } else if (
      Date.now() >= playIntentUntilRef.current &&
      (timerRef.current || heartbeatRef.current)
    ) {
      // Playback stopped in the background without telling us.
      setPlaying(false);
      stopTracking();
      stopHeartbeat();
      void releaseWatchLock();
    }
  }, [
    recheckBlock,
    releaseWatchLock,
    startHeartbeat,
    startTracking,
    stopHeartbeat,
    stopTracking,
  ]);

  /** The page is being frozen or hidden for good. */
  const handleSleep = useCallback(() => {
    void saveProgress();
    // Free playback for the student's other devices straight away instead
    // of making them wait for the lock to go stale. Waking up re-claims it
    // if this device is still playing.
    stopHeartbeat();
    void releaseWatchLock();
  }, [releaseWatchLock, saveProgress, stopHeartbeat]);

  useEffect(() => {
    handlersRef.current = {
      ready: handlePlayerReady,
      stateChange: handlePlayerStateChange,
      wake: handleWake,
      sleep: handleSleep,
      saveTick: () => {
        if (readPlayerState(playerRef.current) === window.YT?.PlayerState.PLAYING) {
          void saveProgress();
        }
      },
      teardown: () => {
        clearResumeCheck();
        stopTracking();
        stopHeartbeat();
        void saveProgress();
        void releaseWatchLock();
      },
    };
  });

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
        onReady: ({ target }) => handlersRef.current?.ready(target),
        onStateChange: ({ data }) => handlersRef.current?.stateChange(data),
      },
    });
  }, [lesson.youtubeVideoId]);

  useEffect(() => {
    unmountedRef.current = false;
    let wakeTimer: ReturnType<typeof setTimeout> | null = null;

    const interval = setInterval(
      () => setWatermarkPosition((current) => (current + 1) % 4),
      18_000,
    );
    const saveInterval = setInterval(() => handlersRef.current?.saveTick(), 15_000);

    const wake = () => {
      if (document.visibilityState === "hidden") return;
      if (wakeTimer) clearTimeout(wakeTimer);
      // Coalesce focus/visibility/pageshow firing together.
      wakeTimer = setTimeout(() => {
        wakeTimer = null;
        handlersRef.current?.wake();
      }, WAKE_DELAY_MS);
    };
    const sleep = () => handlersRef.current?.sleep();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") wake();
    };

    window.addEventListener("pagehide", sleep);
    window.addEventListener("pageshow", wake);
    window.addEventListener("focus", wake);
    window.addEventListener("online", wake);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    // Page Lifecycle (Chrome, Android): a frozen tab can't send heartbeats.
    document.addEventListener("freeze", sleep);
    document.addEventListener("resume", wake);

    return () => {
      unmountedRef.current = true;
      clearInterval(interval);
      clearInterval(saveInterval);
      if (wakeTimer) clearTimeout(wakeTimer);
      window.removeEventListener("pagehide", sleep);
      window.removeEventListener("pageshow", wake);
      window.removeEventListener("focus", wake);
      window.removeEventListener("online", wake);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("freeze", sleep);
      document.removeEventListener("resume", wake);
    };
  }, []);

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
      handlersRef.current?.teardown();
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [createPlayer, loadAttempt]);

  // While blocked, check right away and then keep checking whether the
  // other device has stopped, so the student never has to reload.
  const blockKind = watchBlock?.kind;
  useEffect(() => {
    if (!blockKind || blockKind === "signed-out") return;
    const blockedAt = Date.now();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const check = (first: boolean) => {
      if (first || document.visibilityState === "visible") void recheckBlock();
      const fast = Date.now() - blockedAt < BLOCK_RECHECK_FAST_FOR_MS;
      timer = setTimeout(
        () => check(false),
        fast ? BLOCK_RECHECK_INTERVAL_MS : BLOCK_RECHECK_SLOW_MS,
      );
    };
    timer = setTimeout(() => check(true), 0);
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [blockKind, recheckBlock]);

  async function toggleFullscreen() {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await wrapper.requestFullscreen();
    } catch {
      // The browser refused; the player simply stays as it is.
    }
  }

  function retryLoad() {
    setPlayerError("");
    setLoadAttempt((attempt) => attempt + 1);
  }

  function togglePlayback() {
    const player = playerRef.current;
    if (!player || !ready) return;
    if (playing) {
      clearResumeCheck();
      player.pauseVideo();
      return;
    }
    startPlayback();
  }

  /** "Play here": move playback to this device; the other one pauses. */
  function playHere() {
    if (!playerRef.current || !ready) return;
    takeoverUntilRef.current = Date.now() + TAKEOVER_WINDOW_MS;
    showBlock(null);
    startPlayback();
    void claimWatchLock().then((outcome) => settleClaim(outcome, true));
    scheduleResumeCheck();
  }

  function toggleMute() {
    const player = playerRef.current;
    if (!player || !ready) return;
    // Volume 0 shows as muted, so the button must unmute it too.
    if (muted || volume === 0) {
      userMutedRef.current = false;
      player.unMute();
      if (volume === 0) {
        player.setVolume(50);
        setVolumeLevel(50);
      }
      setMuted(false);
    } else {
      userMutedRef.current = true;
      player.mute();
      setMuted(true);
    }
  }

  function changeVolume(nextVolume: number) {
    const player = playerRef.current;
    if (!player || !ready) return;
    const safeVolume = Math.max(0, Math.min(100, Math.round(nextVolume)));
    player.setVolume(safeVolume);
    setVolumeLevel(safeVolume);
    if (safeVolume === 0) {
      userMutedRef.current = true;
      player.mute();
      setMuted(true);
    } else if (muted) {
      userMutedRef.current = false;
      player.unMute();
      setMuted(false);
    }
  }

  function handlePlayerKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key !== "m" && event.key !== "M") return;
    if (!ready || playerError || watchBlock) return;
    event.preventDefault();
    toggleMute();
  }

  function seekToPosition(nextPosition: number) {
    const safePosition = Math.max(0, Math.min(duration, nextPosition));
    setPosition(safePosition);
    const state = playerRef.current?.getPlayerState();
    const youtube = window.YT?.PlayerState;
    // Seeking a paused or playing video is safe. Seeking an unstarted or
    // ended one makes YouTube auto-play, so wait for the play button instead.
    if (
      youtube &&
      (state === youtube.PLAYING ||
        state === youtube.PAUSED ||
        state === youtube.BUFFERING)
    ) {
      playerRef.current?.seekTo(safePosition, true);
    } else {
      pendingSeekRef.current = safePosition;
    }
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
  const soundOff = muted || volume === 0;
  const blockTitle =
    watchBlock?.kind === "signed-out"
      ? "Please sign in again"
      : watchBlock?.kind === "taken-over"
        ? "Playback moved to another device"
        : "Your account is playing on another device";
  const blockHint =
    watchBlock?.kind === "busy"
      ? "Tap Play here to watch on this device instead. The other device will pause."
      : watchBlock?.kind === "taken-over"
        ? "Tap Play here to keep watching on this device."
        : "";

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
        onKeyDown={handlePlayerKeyDown}
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
              <button
                type="button"
                onClick={retryLoad}
                className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-[#83e8ca] px-4 text-sm font-bold text-navy transition hover:bg-[#6fe0bb]"
              >
                Try again
              </button>
            </div>
          </div>
        ) : null}
        {watchBlock ? (
          <div className="absolute inset-0 z-40 overflow-y-auto bg-[#071521]/95 text-white">
            <div className="flex min-h-full items-center justify-center px-4 py-3 text-center sm:px-6">
              <div className="max-w-md" role="alert">
                {watchBlock.kind === "signed-out" ? (
                  <LogIn className="mx-auto hidden h-8 w-8 text-[#83e8ca] sm:block" />
                ) : (
                  <MonitorSmartphone className="mx-auto hidden h-8 w-8 text-[#83e8ca] sm:block" />
                )}
                <p className="text-sm font-semibold sm:mt-3 sm:text-lg">{blockTitle}</p>
                {/* Phones: the 16:9 box is too short for all the text and the buttons. */}
                <p className="mt-1 text-xs leading-5 text-white/60 max-[360px]:hidden sm:mt-2 sm:text-sm sm:leading-6">
                  {watchBlock.message}
                  {blockHint ? <span className="hidden sm:inline"> {blockHint}</span> : null}
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:mt-5">
                  {watchBlock.kind === "signed-out" ? (
                    <Link
                      href={`/login?next=${encodeURIComponent(`/learn/${courseSlug}/${lessonSlug}`)}`}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#83e8ca] px-4 text-sm font-bold text-navy transition hover:bg-[#6fe0bb]"
                    >
                      <LogIn className="h-4 w-4" />
                      Sign in again
                    </Link>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={playHere}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#83e8ca] px-4 text-sm font-bold text-navy transition hover:bg-[#6fe0bb]"
                      >
                        <Play className="h-4 w-4" />
                        Play here
                      </button>
                      <Link
                        href="/dashboard?tab=security"
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-white/20 px-4 text-sm font-bold text-white transition hover:bg-white/10"
                      >
                        <span className="sm:hidden">My devices</span>
                        <span className="hidden sm:inline">Manage signed-in devices</span>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
        <div
          className={`pointer-events-none absolute z-20 max-w-[75%] rounded-md border border-white/15 bg-black/35 px-2.5 py-1.5 text-[10px] font-semibold text-white/55 backdrop-blur-sm transition-all duration-700 sm:text-xs ${positions[watermarkPosition]}`}
        >
          {watermark}
        </div>
        {resumePrompt && ready && !playerError && !watchBlock ? (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <button
              type="button"
              onClick={startPlayback}
              className="pointer-events-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#83e8ca] px-5 text-sm font-bold text-navy shadow-lg transition hover:bg-[#6fe0bb]"
            >
              <Play className="h-4 w-4" />
              Resume video
            </button>
          </div>
        ) : null}

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

            <div className="mt-2 flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={togglePlayback}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-navy transition hover:bg-[#83e8ca]"
                aria-label={playing ? "Pause video" : "Play video"}
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
              </button>

              <div className="flex shrink-0 items-center rounded-xl border border-white/15 bg-black/35 backdrop-blur-md">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white transition hover:bg-white/15"
                  aria-label={soundOff ? "Unmute video (M)" : "Mute video (M)"}
                >
                  {soundOff ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                {canSetVolume ? (
                  <label className="hidden items-center pr-3 sm:flex">
                    <span className="sr-only">Volume</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={soundOff ? 0 : volume}
                      onChange={(event) => changeVolume(Number(event.target.value))}
                      className="h-1.5 w-20 cursor-pointer accent-[#43d6ac]"
                      aria-valuetext={soundOff ? "Muted" : `${volume}%`}
                    />
                  </label>
                ) : null}
              </div>

              {/* Shrinks (with "…") before anything is pushed off a narrow screen. */}
              <span className="min-w-0 truncate text-[11px] font-medium tabular-nums text-white/75 sm:text-xs">
                {formatClock(position)}
                <span className="max-[360px]:hidden"> / {formatClock(duration)}</span>
              </span>

              <div
                className="ml-auto flex shrink-0 items-center gap-0.5 rounded-xl border border-white/15 bg-black/35 p-0.5 backdrop-blur-md sm:gap-1 sm:p-1"
                aria-label="Playback speed"
              >
                {[1, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => changePlaybackRate(rate)}
                    className={`h-7 rounded-lg px-1.5 text-xs font-bold transition sm:px-2 ${
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
                title={theaterMode ? "Minimize video" : "Enlarge video"}
                aria-pressed={theaterMode}
              >
                {theaterMode ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
                {/* Icon only beside the lesson list on laptop widths, where the row is tight. */}
                <span className={theaterMode ? undefined : "lg:max-xl:hidden"}>
                  {theaterMode ? "Minimize" : "Enlarge"}
                </span>
              </button>

              {canFullscreen ? (
                <button
                  type="button"
                  onClick={() => void toggleFullscreen()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-black/35 text-white backdrop-blur-md transition hover:bg-white/15"
                  aria-label="Toggle fullscreen"
                >
                  <Expand className="h-4 w-4" />
                </button>
              ) : null}
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
