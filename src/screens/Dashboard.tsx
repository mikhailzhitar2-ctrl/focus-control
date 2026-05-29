import { useState, useEffect } from 'react';
import { NavProps } from '../App';
import {
  getUser,
  getTodayStats,
  updateUser,
  getYesterdayStats,
  getTodayDistractionEvents,
} from '../utils/storage';
import { getCoachTips } from '../utils/coachTips';

export default function Dashboard({ navigate, refresh: _refresh }: NavProps) {
  const [user, setUserState] = useState(getUser()!);
  const [stats, setStats] = useState(getTodayStats());

  // Streak update on mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (user.lastActiveDate !== today) {
      const last = new Date(user.lastActiveDate);
      const now = new Date(today);
      const diff = Math.round((now.getTime() - last.getTime()) / 86400000);
      const newStreak = diff === 1 ? user.streak + 1 : 1;
      const updated = { ...user, lastActiveDate: today, streak: newStreak };
      updateUser(updated);
      setUserState(updated);
    }
    setStats(getTodayStats());
  }, []);

  const todayEvents = getTodayDistractionEvents();
  const yesterdayStats = getYesterdayStats();
  const tips = getCoachTips(user, stats, todayEvents, yesterdayStats);

  const csiColor =
    user.csi >= 70
      ? 'text-emerald-400'
      : user.csi >= 40
        ? 'text-yellow-400'
        : 'text-red-400';
  const energyColor =
    user.energy >= 60
      ? 'text-emerald-400'
      : user.energy >= 30
        ? 'text-yellow-400'
        : 'text-red-400';

  const topTip = tips[0];

  return (
    <div className="min-h-screen pb-12 animate-fadeIn">
      {/* Header */}
      <div className="px-6 pt-12 pb-6 border-b border-[#141414]">
        <div className="text-[10px] tracking-[0.3em] text-gray-600 uppercase mb-3">
          Focus Control
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{user.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-600">
                Streak{' '}
                <span className="text-emerald-500 font-semibold">{user.streak}</span>
                {' '}дн.
              </span>
              <span className="text-[#222]">·</span>
              <span className="text-xs text-gray-600">
                XP{' '}
                <span className="text-white font-semibold">{user.xp}</span>
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${csiColor}`}>{user.csi}</div>
            <div className="text-[10px] text-gray-600 uppercase tracking-wider mt-0.5">CSI</div>
          </div>
        </div>
      </div>

      <div className="px-6 pt-5 space-y-3">
        {/* Energy + Today */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-4">
            <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">
              Mental Energy
            </div>
            <div className={`text-3xl font-bold ${energyColor}`}>{user.energy}</div>
            <div className="w-full bg-[#1e1e1e] rounded-full h-1 mt-2.5">
              <div
                className="h-1 rounded-full transition-all"
                style={{
                  width: `${user.energy}%`,
                  backgroundColor:
                    user.energy >= 60 ? '#10b981' : user.energy >= 30 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>
          </div>

          <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-4">
            <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">
              Сегодня
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Фокус</span>
                <span className="text-sm font-semibold text-white">{stats.focusMinutes} мин</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Срывов</span>
                <span className="text-sm font-semibold text-white">{stats.distractionCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Recovery</span>
                <span className="text-sm font-semibold text-emerald-400">{stats.recoveryCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Time saved */}
        {stats.timeSaved > 0 && (
          <div className="bg-[#111] border border-emerald-900/30 rounded-2xl px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-gray-500">Сэкономлено времени сегодня</span>
            <span className="text-emerald-400 font-semibold text-sm">~{stats.timeSaved} мин</span>
          </div>
        )}

        {/* Coach tip */}
        {topTip && (
          <div
            className={`rounded-2xl px-4 py-3.5 border ${
              topTip.type === 'warning'
                ? 'bg-red-950/20 border-red-900/30'
                : topTip.type === 'success'
                  ? 'bg-emerald-950/20 border-emerald-900/30'
                  : 'bg-[#111] border-[#1a1a1a]'
            }`}
          >
            <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-1.5">
              AI Coach
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">{topTip.text}</p>
            {tips.length > 1 && (
              <button
                onClick={() => navigate('ai-coach')}
                className="text-xs text-emerald-600 hover:text-emerald-500 mt-1.5 transition-colors"
              >
                ещё {tips.length - 1} совета →
              </button>
            )}
          </div>
        )}

        {/* Primary action */}
        <button
          onClick={() => navigate('focus-timer')}
          className="w-full bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 text-white rounded-2xl py-5 text-left px-5 transition-colors group"
        >
          <div className="text-[10px] text-emerald-500 uppercase tracking-wider mb-1">
            Начать сессию
          </div>
          <div className="text-lg font-semibold group-hover:translate-x-0.5 transition-transform">
            Start Focus →
          </div>
        </button>

        {/* Secondary actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('distraction-log')}
            className="bg-[#111] border border-[#1a1a1a] hover:border-red-900/50 text-gray-200 rounded-2xl py-4 transition-colors text-sm font-medium"
          >
            Я отвлекся
          </button>
          <button
            onClick={() => navigate('recovery-flow')}
            className="bg-[#111] border border-[#1a1a1a] hover:border-violet-900/50 text-gray-200 rounded-2xl py-4 transition-colors text-sm font-medium"
          >
            Recovery
          </button>
        </div>

        {/* Nav row */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => navigate('daily-missions')}
            className="bg-[#111] border border-[#1a1a1a] hover:border-[#2a2a2a] text-gray-400 rounded-xl py-3 transition-colors text-xs font-medium"
          >
            Миссии
          </button>
          <button
            onClick={() => navigate('analytics')}
            className="bg-[#111] border border-[#1a1a1a] hover:border-[#2a2a2a] text-gray-400 rounded-xl py-3 transition-colors text-xs font-medium"
          >
            Аналитика
          </button>
          <button
            onClick={() => navigate('ai-coach')}
            className="bg-[#111] border border-[#1a1a1a] hover:border-[#2a2a2a] text-gray-400 rounded-xl py-3 transition-colors text-xs font-medium"
          >
            Coach
          </button>
        </div>

        {/* Export */}
        <button
          onClick={() => navigate('coach-export')}
          className="w-full border border-dashed border-[#222] hover:border-[#333] text-gray-600 hover:text-gray-500 rounded-xl py-3 transition-colors text-xs"
        >
          Send progress to AI Coach
        </button>
      </div>
    </div>
  );
}
