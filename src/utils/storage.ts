import {
  User,
  DailyStats,
  DistractionEvent,
  FocusSession,
  RecoveryEvent,
} from '../types';

const KEYS = {
  USER: 'fc_user',
  DAILY_STATS: 'fc_daily_stats',
  DISTRACTION_EVENTS: 'fc_distraction_events',
  FOCUS_SESSIONS: 'fc_focus_sessions',
  RECOVERY_EVENTS: 'fc_recovery_events',
};

export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

// ── User ──────────────────────────────────────────────────────────────────────

export function getUser(): User | null {
  const d = localStorage.getItem(KEYS.USER);
  return d ? (JSON.parse(d) as User) : null;
}

export function setUser(user: User): void {
  localStorage.setItem(KEYS.USER, JSON.stringify(user));
}

export function updateUser(updates: Partial<User>): void {
  const u = getUser();
  if (u) setUser({ ...u, ...updates });
}

// ── Daily Stats ───────────────────────────────────────────────────────────────

export function getAllDailyStats(): DailyStats[] {
  const d = localStorage.getItem(KEYS.DAILY_STATS);
  return d ? (JSON.parse(d) as DailyStats[]) : [];
}

export function getTodayStats(): DailyStats {
  const today = getToday();
  const all = getAllDailyStats();
  const existing = all.find((s) => s.date === today);
  if (existing) return existing;
  const user = getUser();
  return {
    date: today,
    focusMinutes: 0,
    focusSessions: 0,
    distractionMinutes: 0,
    distractionCount: 0,
    recoveryCount: 0,
    energy: user?.energy ?? 70,
    csi: 50,
    timeSaved: 0,
  };
}

export function saveTodayStats(stats: DailyStats): void {
  const today = getToday();
  const all = getAllDailyStats();
  const idx = all.findIndex((s) => s.date === today);
  if (idx >= 0) {
    all[idx] = stats;
  } else {
    all.push(stats);
  }
  localStorage.setItem(KEYS.DAILY_STATS, JSON.stringify(all));
}

export function getYesterdayStats(): DailyStats | null {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];
  const all = getAllDailyStats();
  return all.find((s) => s.date === dateStr) ?? null;
}

// ── Distraction Events ────────────────────────────────────────────────────────

export function getDistractionEvents(): DistractionEvent[] {
  const d = localStorage.getItem(KEYS.DISTRACTION_EVENTS);
  return d ? (JSON.parse(d) as DistractionEvent[]) : [];
}

export function getTodayDistractionEvents(): DistractionEvent[] {
  const today = getToday();
  return getDistractionEvents().filter((e) => e.time.startsWith(today));
}

export function addDistractionEvent(event: DistractionEvent): void {
  const events = getDistractionEvents();
  events.push(event);
  localStorage.setItem(KEYS.DISTRACTION_EVENTS, JSON.stringify(events));
}

export function getLastDistractionId(): string | null {
  const events = getTodayDistractionEvents();
  const unrec = events.filter((e) => !e.recovered);
  return unrec.length > 0 ? unrec[unrec.length - 1].id : null;
}

export function markDistractionRecovered(id: string): void {
  const events = getDistractionEvents();
  const idx = events.findIndex((e) => e.id === id);
  if (idx >= 0) {
    events[idx].recovered = true;
    localStorage.setItem(KEYS.DISTRACTION_EVENTS, JSON.stringify(events));
  }
}

// ── Focus Sessions ────────────────────────────────────────────────────────────

export function getFocusSessions(): FocusSession[] {
  const d = localStorage.getItem(KEYS.FOCUS_SESSIONS);
  return d ? (JSON.parse(d) as FocusSession[]) : [];
}

export function addFocusSession(session: FocusSession): void {
  const sessions = getFocusSessions();
  sessions.push(session);
  localStorage.setItem(KEYS.FOCUS_SESSIONS, JSON.stringify(sessions));
}

export function getBestFocusSession(): number {
  const sessions = getFocusSessions().filter((s) => s.completed);
  if (!sessions.length) return 0;
  return Math.max(...sessions.map((s) => s.duration));
}

// ── Recovery Events ───────────────────────────────────────────────────────────

export function getRecoveryEvents(): RecoveryEvent[] {
  const d = localStorage.getItem(KEYS.RECOVERY_EVENTS);
  return d ? (JSON.parse(d) as RecoveryEvent[]) : [];
}

export function addRecoveryEvent(event: RecoveryEvent): void {
  const events = getRecoveryEvents();
  events.push(event);
  localStorage.setItem(KEYS.RECOVERY_EVENTS, JSON.stringify(events));
}

// ── Full export ───────────────────────────────────────────────────────────────

export function exportAllData() {
  return {
    user: getUser(),
    todayStats: getTodayStats(),
    allDailyStats: getAllDailyStats(),
    distractionEvents: getDistractionEvents(),
    focusSessions: getFocusSessions(),
    recoveryEvents: getRecoveryEvents(),
    exportedAt: new Date().toISOString(),
  };
}
