import { User, DailyStats, DistractionEvent } from '../types';

export interface CoachTip {
  id: string;
  text: string;
  type: 'warning' | 'info' | 'success';
}

export function getCoachTips(
  user: User,
  stats: DailyStats,
  todayEvents: DistractionEvent[],
  yesterdayStats: DailyStats | null,
): CoachTip[] {
  const tips: CoachTip[] = [];

  if (user.energy < 40) {
    tips.push({
      id: 'low-energy',
      text: 'Энергия низкая. Лучше сделать короткий reset перед работой.',
      type: 'warning',
    });
  }

  if (stats.distractionCount >= 2) {
    tips.push({
      id: 'high-distraction',
      text: 'Сегодня высокий риск срыва. Делай короткие фокус-сессии по 5–15 минут.',
      type: 'warning',
    });
  }

  if (stats.recoveryCount > 0) {
    tips.push({
      id: 'recovery-done',
      text: 'Ты не просто сорвался — ты вернул контроль. Это главный прогресс.',
      type: 'success',
    });
  }

  if (yesterdayStats && stats.focusMinutes > yesterdayStats.focusMinutes && stats.focusMinutes > 0) {
    tips.push({
      id: 'focus-growth',
      text: 'Твоя длина фокуса растет. Продолжай.',
      type: 'success',
    });
  }

  const afternoonDistractions = todayEvents.filter((e) => {
    const hour = new Date(e.time).getHours();
    return hour >= 15;
  });
  if (todayEvents.length >= 2 && afternoonDistractions.length / todayEvents.length > 0.5) {
    tips.push({
      id: 'risk-window',
      text: 'Твое риск-окно — вторая половина дня. Планируй защитные ритуалы после 15:00.',
      type: 'info',
    });
  }

  if (tips.length === 0) {
    tips.push({
      id: 'default',
      text: 'Начни первую фокус-сессию дня. Даже 5 минут перестраивают режим.',
      type: 'info',
    });
  }

  return tips;
}
