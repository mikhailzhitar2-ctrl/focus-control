import { NavProps } from '../App';
import {
  getTodayStats,
  getAllDailyStats,
  getTodayDistractionEvents,
  getBestFocusSession,
} from '../utils/storage';
import { getUser } from '../utils/storage';

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#141414] last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

export default function Analytics({ navigate }: NavProps) {
  const user = getUser()!;
  const stats = getTodayStats();
  const allStats = getAllDailyStats();
  const todayEvents = getTodayDistractionEvents();
  const bestSession = getBestFocusSession();

  // Risk time: hour with most distractions
  const hourCounts: Record<number, number> = {};
  todayEvents.forEach((e) => {
    const h = new Date(e.time).getHours();
    hourCounts[h] = (hourCounts[h] ?? 0) + 1;
  });
  const riskHour =
    Object.keys(hourCounts).length > 0
      ? parseInt(Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0][0])
      : null;

  // Last 7 days CSI for sparkline
  const last7 = [...allStats]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7);

  const maxCSI = last7.length > 0 ? Math.max(...last7.map((s) => s.csi), 1) : 100;

  return (
    <div className="min-h-screen p-6 animate-fadeIn">
      <div className="max-w-sm mx-auto">
        <button
          onClick={() => navigate('dashboard')}
          className="text-gray-600 hover:text-gray-400 text-sm mb-8 transition-colors"
        >
          ← Назад
        </button>

        <div className="text-[10px] tracking-[0.3em] text-emerald-500 uppercase mb-3">
          Аналитика
        </div>
        <h1 className="text-3xl font-bold text-white mb-7">Аналитика</h1>

        {/* Today */}
        <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-5 mb-4">
          <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-3">Сегодня</div>
          <StatRow label="Минут фокуса" value={`${stats.focusMinutes} мин`} />
          <StatRow label="Фокус-сессий" value={stats.focusSessions} />
          <StatRow label="Срывов" value={stats.distractionCount} />
          <StatRow label="Минут скроллинга" value={`${stats.distractionMinutes} мин`} />
          <StatRow label="Recovery" value={stats.recoveryCount} />
          <StatRow label="Сэкономлено времени" value={`~${stats.timeSaved} мин`} />
        </div>

        {/* Best / Risk */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-4">
            <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">
              Лучшая сессия
            </div>
            <div className="text-2xl font-bold text-emerald-400">
              {bestSession > 0 ? `${bestSession} мин` : '—'}
            </div>
          </div>
          <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-4">
            <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">
              Риск-окно
            </div>
            <div className="text-2xl font-bold text-amber-400">
              {riskHour !== null ? `${riskHour}:00` : '—'}
            </div>
          </div>
        </div>

        {/* CSI history */}
        {last7.length > 1 && (
          <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-5">
            <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-4">
              CSI — последние {last7.length} дней
            </div>
            <div className="flex items-end gap-1.5 h-20">
              {last7.map((s) => (
                <div key={s.date} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-sm bg-emerald-700/60 transition-all"
                    style={{ height: `${(s.csi / maxCSI) * 72}px`, minHeight: '2px' }}
                    title={`${s.date}: CSI ${s.csi}`}
                  />
                  <div className="text-[9px] text-gray-700">
                    {s.date.slice(8)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-5 mt-4">
          <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-3">Всего</div>
          <StatRow label="Опыт накоплен" value={user.xp} />
          <StatRow label="Streak" value={`${user.streak} дн.`} />
          <StatRow
            label="Дней в приложении"
            value={allStats.length || 1}
          />
        </div>
      </div>
    </div>
  );
}
