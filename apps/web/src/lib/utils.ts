import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format handicap: "SCR" for 0, "+2" for negatives, "12" for positives */
export function formatHandicap(h: number): string {
  if (h === 0) return 'SCR';
  if (h < 0) return `+${Math.abs(h)}`;
  return String(h);
}

/** Format score relative to par: "E" for even, "+4" for over, "-2" for under */
export function formatScore(score: number, par: number): string {
  const diff = score - par;
  if (diff === 0) return 'E';
  if (diff > 0) return `+${diff}`;
  return String(diff);
}

/** Format ISO date string to e.g. "Jan 15, 2025" */
export function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/** Tailwind text color class based on score vs par */
export function getScoreColor(score: number, par: number): string {
  const diff = score - par;
  if (diff <= -2) return 'text-yellow-400'; // eagle or better
  if (diff === -1) return 'text-green-400';  // birdie
  if (diff === 0) return 'text-white';        // par
  if (diff === 1) return 'text-orange-400';   // bogey
  if (diff === 2) return 'text-red-400';      // double bogey
  return 'text-red-600';                       // triple+
}

/** Tailwind text color class based on handicap level */
export function getHandicapColor(h: number): string {
  if (h <= 0) return 'text-yellow-400';   // scratch or better
  if (h <= 5) return 'text-green-400';    // low handicap
  if (h <= 10) return 'text-green-500';   // mid-low
  if (h <= 18) return 'text-blue-400';    // mid
  if (h <= 28) return 'text-orange-400';  // high
  return 'text-red-400';                   // very high
}

/** Calculate handicap differential */
export function calcDifferential(
  score: number,
  courseRating: number,
  slopeRating: number
): number {
  return Math.round(((score - courseRating) * 113) / slopeRating * 10) / 10;
}
