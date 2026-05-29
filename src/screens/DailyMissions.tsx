import { NavProps } from '../App';
import { getUser, getTodayStats } from '../utils/storage';

interface Mission {
  id: string;
  title: string;
  desc: string;
  xp: number;
  completed: boolean;
}

export default function DailyMissions({ navigate }: NavProps) {
  const user = getUser()!;
  const stats = getTodayStats();

  const missions: Mission[] = [
    {
      id: 'focus-session',
      title: 'Первая фокус-сессия',
      desc: 'Завершить хотя бы одну фокус-сессию',
      xp: 25,
      completed: stats.focusSessions >= 1,
    },
    {
      id: 'recovery',
      title: 'Recovery после срыва',
      desc: 'Сорваться и вернуть контроль',
      xp: 20,
      completed: stats.recoveryCount >= 1,
    },
    {
      id: 'energy',
      title: 'Удержать энергию',
      desc: 'Энергия выше 50 в конце дня',
      xp: 15,
      completed: user.energy > 50,
    },
  ];

  const totalXP = missions.filter((m) => m.completed).reduce((s, m) => s + m.xp, 0);
  const completedCount = missions.filter((m) => m.completed).length;

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
          Ежедневные миссии
        </div>
        <h1 className="text-3xl font-bold text-white mb-1">Миссии дня</h1>
        <p className="text-sm text-gray-600 mb-7">
          {completedCount} из {missions.length} выполнено · {totalXP} опыта заработано
        </p>

        {/* Progress bar */}
        <div className="w-full bg-[#1a1a1a] rounded-full h-1 mb-7">
          <div
            className="bg-emerald-600 h-1 rounded-full transition-all"
            style={{ width: `${(completedCount / missions.length) * 100}%` }}
          />
        </div>

        <div className="space-y-3">
          {missions.map((m) => (
            <div
              key={m.id}
              className={`bg-[#111] border rounded-2xl p-5 transition-all ${
                m.completed ? 'border-emerald-900/40' : 'border-[#1a1a1a]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        m.completed ? 'bg-emerald-500' : 'bg-[#2a2a2a]'
                      }`}
                    />
                    <div
                      className={`font-semibold text-sm ${
                        m.completed ? 'text-emerald-300' : 'text-white'
                      }`}
                    >
                      {m.title}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 pl-4">{m.desc}</p>
                </div>
                <div
                  className={`text-xs font-semibold flex-shrink-0 ${
                    m.completed ? 'text-emerald-500' : 'text-gray-600'
                  }`}
                >
                  {m.completed ? '+' : ''}{m.xp} оп.
                </div>
              </div>
            </div>
          ))}
        </div>

        {completedCount === missions.length && (
          <div className="mt-6 p-4 bg-emerald-950/30 border border-emerald-900/40 rounded-2xl text-center animate-fadeIn">
            <div className="text-emerald-400 font-semibold mb-1">Все миссии выполнены</div>
            <div className="text-xs text-gray-600">Возвращайся завтра за новыми</div>
          </div>
        )}

        {completedCount < missions.length && (
          <div className="mt-6 space-y-2">
            {!missions[0].completed && (
              <button
                onClick={() => navigate('focus-timer')}
                className="w-full bg-[#111] border border-[#1a1a1a] hover:border-emerald-900/50 text-gray-300 rounded-xl py-3 text-sm transition-colors"
              >
                Начать фокус-сессию →
              </button>
            )}
            {!missions[1].completed && (
              <button
                onClick={() => navigate('recovery-flow')}
                className="w-full bg-[#111] border border-[#1a1a1a] hover:border-violet-900/50 text-gray-300 rounded-xl py-3 text-sm transition-colors"
              >
                Recovery →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
