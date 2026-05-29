import { ScrollingEstimate } from '../types';

export function calcCSI(
  focusSessions: number,
  focusMinutes: number,
  recoveryCount: number,
  distractionMinutes: number,
  distractionCount: number,
): number {
  const raw =
    50 +
    focusSessions * 5 +
    focusMinutes / 5 +
    recoveryCount * 4 -
    distractionMinutes / 5 -
    distractionCount * 4;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function clampEnergy(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

export const FOCUS_REWARDS: Record<number, { energy: number; xp: number }> = {
  5: { energy: 5, xp: 10 },
  15: { energy: 8, xp: 25 },
  25: { energy: 12, xp: 40 },
};

export const DISTRACTION_ENERGY: Record<number, number> = {
  5: -5,
  15: -10,
  30: -18,
  60: -30,
};

export function scrollingToTime(estimate: ScrollingEstimate): {
  hoursPerMonth: number;
  daysPerYear: number;
} {
  const dailyMap: Record<ScrollingEstimate, number> = {
    '<1h': 0.5,
    '1-2h': 1.5,
    '2-3h': 2.5,
    '3-5h': 4,
    '5+h': 6,
  };
  const daily = dailyMap[estimate];
  return {
    hoursPerMonth: Math.round(daily * 30),
    daysPerYear: Math.round((daily * 365) / 24),
  };
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}
