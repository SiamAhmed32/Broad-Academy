"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Bot, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  chooseComputerMove,
  emptyBoard,
  getWinner,
  outcomeFromBoard,
  type Cell,
  type GameOutcome,
} from "@/lib/games/tic-tac-toe";

type TicTacToeBoardProps = {
  onGameStart?: () => void | Promise<void>;
  onGameEnd?: (outcome: GameOutcome, moves: number) => void | Promise<void>;
  className?: string;
};

export function TicTacToeBoard({
  onGameStart,
  onGameEnd,
  className = "",
}: TicTacToeBoardProps) {
  const reduceMotion = useReducedMotion();
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reportedRef = useRef(false);
  const startedRef = useRef(false);
  const [board, setBoard] = useState<Cell[]>(emptyBoard);
  const [computerThinking, setComputerThinking] = useState(false);

  const winner = getWinner(board);
  const draw = !winner && board.every(Boolean);
  const outcome = outcomeFromBoard(board);

  useEffect(() => {
    if (!outcome || reportedRef.current) return;
    reportedRef.current = true;
    void onGameEnd?.(outcome, board.filter(Boolean).length);
  }, [board, onGameEnd, outcome]);

  function resetGame() {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    setBoard(emptyBoard());
    setComputerThinking(false);
    reportedRef.current = false;
    startedRef.current = false;
  }

  async function ensureStarted() {
    if (startedRef.current) return;
    startedRef.current = true;
    await onGameStart?.();
  }

  function playCell(index: number) {
    if (board[index] || winner || draw || computerThinking) return;

    void ensureStarted();

    const nextBoard = [...board];
    nextBoard[index] = "X";
    setBoard(nextBoard);
    if (getWinner(nextBoard) || nextBoard.every(Boolean)) return;

    setComputerThinking(true);
    botTimerRef.current = setTimeout(() => {
      const computerMove = chooseComputerMove(nextBoard);
      if (computerMove !== null) {
        const computerBoard = [...nextBoard];
        computerBoard[computerMove] = "O";
        setBoard(computerBoard);
      }
      setComputerThinking(false);
    }, reduceMotion ? 100 : 480);
  }

  const gameMessage =
    winner?.mark === "X"
      ? "You won! Nicely played."
      : winner?.mark === "O"
        ? "Academy Bot took this round."
        : draw
          ? "Draw — great defense!"
          : computerThinking
            ? "Academy Bot is thinking..."
            : "Your turn — you are X.";

  return (
    <div
      className={`relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#eaf3ff] via-white to-[#f0fdf8] p-4 shadow-inner sm:rounded-[2rem] sm:p-5 ${className}`}
    >
      <div className="absolute inset-4 rounded-[1.35rem] border border-white/80 bg-white/60 sm:inset-5 sm:rounded-[1.5rem]" />

      <div className="relative flex h-full flex-col p-2 sm:p-3">
        <div className="flex items-center justify-between px-1 pb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
              Brain break
            </p>
            <p className="text-sm font-semibold text-navy">Tic-tac-toe</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-navy/5 px-2.5 py-1 text-[10px] font-semibold text-navy/65">
            <Bot className="h-3.5 w-3.5" />
            vs Academy Bot
          </span>
        </div>

        <div
          className="grid flex-1 grid-cols-3 grid-rows-3 gap-2.5 sm:gap-3"
          role="grid"
          aria-label="Tic-tac-toe board"
        >
          {board.map((cell, index) => {
            const isWinningCell = winner
              ? winner.line.some((cellIndex) => cellIndex === index)
              : false;
            return (
              <motion.button
                key={index}
                type="button"
                initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: reduceMotion ? 0 : index * 0.03 }}
                whileHover={
                  !cell && !winner && !draw && !computerThinking
                    ? { scale: 1.04 }
                    : undefined
                }
                whileTap={!cell ? { scale: 0.96 } : undefined}
                onClick={() => playCell(index)}
                disabled={
                  Boolean(cell) || Boolean(winner) || draw || computerThinking
                }
                className={`flex aspect-square items-center justify-center rounded-xl border text-3xl font-black shadow-sm transition sm:rounded-2xl sm:text-4xl ${
                  isWinningCell
                    ? "border-accent bg-accent text-white shadow-lg shadow-accent/25"
                    : cell === "X"
                      ? "border-navy bg-navy text-white"
                      : cell === "O"
                        ? "border-btnBg bg-btnBg text-white"
                        : "border-navy/10 bg-white/90 text-navy hover:border-accent/40 hover:bg-emerald-50"
                } disabled:cursor-default`}
                aria-label={
                  cell ? `Cell ${index + 1}: ${cell}` : `Play cell ${index + 1}`
                }
              >
                {cell}
              </motion.button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 px-1">
          <p
            className={`text-xs font-semibold ${
              winner?.mark === "X"
                ? "text-emerald-700"
                : winner?.mark === "O"
                  ? "text-btnBg"
                  : "text-navy/55"
            }`}
            aria-live="polite"
          >
            {gameMessage}
          </p>
          <button
            type="button"
            onClick={resetGame}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-navy/10 bg-white px-2.5 text-[11px] font-semibold text-navy transition hover:bg-navy hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            New round
          </button>
        </div>
      </div>
    </div>
  );
}
