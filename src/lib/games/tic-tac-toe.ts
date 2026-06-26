export type Mark = "X" | "O";
export type Cell = Mark | null;
export type GameOutcome = "win" | "loss" | "draw";

export const winningLines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

export function getWinner(board: Cell[]) {
  for (const [a, b, c] of winningLines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { mark: board[a] as Mark, line: [a, b, c] as const };
    }
  }
  return null;
}

function findTacticalMove(board: Cell[], mark: Mark) {
  for (const [a, b, c] of winningLines) {
    const line = [a, b, c];
    const marks = line.map((index) => board[index]);
    if (
      marks.filter((cell) => cell === mark).length === 2 &&
      marks.includes(null)
    ) {
      return line[marks.indexOf(null)];
    }
  }
  return null;
}

export function chooseComputerMove(board: Cell[]) {
  const win = findTacticalMove(board, "O");
  if (win !== null) return win;
  const block = findTacticalMove(board, "X");
  if (block !== null) return block;
  if (board[4] === null) return 4;

  const corners = [0, 2, 6, 8].filter((index) => board[index] === null);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];

  const empty = board
    .map((cell, index) => (cell === null ? index : -1))
    .filter((index) => index >= 0);
  return empty.length ? empty[Math.floor(Math.random() * empty.length)] : null;
}

export function emptyBoard(): Cell[] {
  return Array.from({ length: 9 }, () => null);
}

export function outcomeFromBoard(board: Cell[]): GameOutcome | null {
  const winner = getWinner(board);
  if (winner?.mark === "X") return "win";
  if (winner?.mark === "O") return "loss";
  if (board.every(Boolean)) return "draw";
  return null;
}

export function countMoves(board: Cell[]) {
  return board.filter(Boolean).length;
}
