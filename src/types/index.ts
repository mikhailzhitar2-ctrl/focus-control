export type Screen =
  | 'onboarding'
  | 'dashboard'
  | 'focus-timer'
  | 'distraction-log'
  | 'recovery-flow'
  | 'daily-missions'
  | 'analytics'
  | 'ai-coach'
  | 'coach-export';

export type ScrollingEstimate = '<1h' | '1-2h' | '2-3h' | '3-5h' | '5+h';
export type EnergyState = 'charged' | 'normal' | 'tired';

export interface User {
  name: string;
  goal: string;
  scrollingEstimate: ScrollingEstimate;
  initialEnergy: EnergyState;
  xp: number;
  csi: number;
  energy: number;
  streak: number;
  createdAt: string;
  lastActiveDate: string;
}

export interface DailyStats {
  date: string;
  focusMinutes: number;
  focusSessions: number;
  distractionMinutes: number;
  distractionCount: number;
  recoveryCount: number;
  energy: number;
  csi: number;
  timeSaved: number;
}

export interface DistractionEvent {
  id: string;
  time: string;
  minutes: number;
  recovered: boolean;
}

export interface FocusSession {
  id: string;
  duration: number;
  completed: boolean;
  startedAt: string;
  endedAt: string;
}

export interface RecoveryEvent {
  id: string;
  startedAt: string;
  completedAt: string;
  nextAction: string;
}
