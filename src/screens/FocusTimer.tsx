import { useState, useEffect, useRef } from 'react';
import { NavProps } from '../App';
import {
  getUser,
  updateUser,
  getTodayStats,
  saveTodayStats,
  addFocusSession,
} from '../utils/storage';
import { calcCSI, FOCUS_REWARDS, clampEnergy, formatDuration, uid } from '../utils/calculations';

type Phase = 'pick' | 'running' | 'done';

const DURATIONS = [
  { minutes: 5, label: '5 мин', desc: 'Быстрый старт' },
  { minutes: 15, label: '15 мин', desc: 'Оптимальный' },
  { minutes: 25, label: '25 мин', desc: 'Глубокий фокус' },
];

export default function FocusTimer({ navigate, refresh }: NavProps) {
  const [phase, setPhase] = useState<Phase>('pick');
  const [selectedMinutes, setSelectedMinutes] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [reward, setReward] = useState({ xp: 0, energy: 0 });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef('');

  const startTimer = (minutes: number) => {
    setSelectedMinutes(minutes);
    setSecondsLeft(minutes * 60);
    startedAtRef.current = new Date().toISOString();
    setPhase('running');
  };

  useEffect(() => {
    if (phase !== 'running') return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          handleComplete();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [phase]);

  const handleComplete = () => {
    const user = getUser()!;
    const rewards = FOCUS_REWARDS[selectedMinutes] ?? FOCUS_REWARDS[5];
    const stats = getTodayStats();

    const newEnergy = clampEnergy(user.energy + rewards.energy);
    const newXP = user.xp + rewards.xp;
    const newFocusMinutes = stats.focusMinutes + selectedMinutes;
    const newFocusSessions = stats.focusSessions + 1;
    const newCSI = calcCSI(
      newFocusSessions,
      newFocusMinutes,
      stats.recoveryCount,
      stats.distractionMinutes,
      stats.distractionCount,
    );
    const timeSaved = Math.round(stats.timeSaved + selectedMinutes * 0.3);

    updateUser({ energy: newEnergy, xp: newXP, csi: newCSI });
    saveTodayStats({
      ...stats,
      focusMinutes: newFocusMinutes,
      focusSessions: newFocusSessions,
      energy: newEnergy,
      csi: newCSI,
      timeSaved,
    });
    addFocusSession({
      id: uid(),
      duration: selectedMinutes,
      completed: true,
      startedAt: startedAtRef.current,
      endedAt: new Date().toISOString(),
    });

    setReward(rewards);
    setPhase('done');
    refresh();
  };

  const cancelTimer = () => {
    clearInterval(intervalRef.current!);
    addFocusSession({
      id: uid(),
      duration: selectedMinutes,
      completed: false,
      startedAt: startedAtRef.current,
      endedAt: new Date().toISOString(),
    });
    navigate('dashboard');
  };

  const progress =
    phase === 'running'
      ? ((selectedMinutes * 60 - secondsLeft) / (selectedMinutes * 60)) * 100
      : 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fadeIn">
      <div className="w-full max-w-sm">
        {/* Pick phase */}
        {phase === 'pick' && (
          <>
            <button
              onClick={() => navigate('dashboard')}
              className="text-gray-600 hover:text-gray-400 text-sm mb-8 transition-colors"
            >
              ← Назад
            </button>
            <div className="text-[10px] tracking-[0.3em] text-emerald-500 uppercase mb-3">
              Focus Session
            </div>
            <h1 className="text-3xl font-bold text-white mb-8">Выбери длину</h1>
            <div className="space-y-3">
              {DURATIONS.map((d) => (
                <button
                  key={d.minutes}
                  onClick={() => startTimer(d.minutes)}
                  className="w-full text-left bg-[#111] border border-[#1a1a1a] hover:border-emerald-800 rounded-2xl p-5 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-semibold text-white">{d.label}</div>
                      <div className="text-xs text-gray-600 mt-0.5">{d.desc}</div>
                    </div>
                    <div className="text-right text-xs text-gray-600">
                      <div className="text-emerald-600">+{FOCUS_REWARDS[d.minutes].xp} XP</div>
                      <div>+{FOCUS_REWARDS[d.minutes].energy} energy</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Running phase */}
        {phase === 'running' && (
          <div className="text-center animate-fadeIn">
            <div className="text-[10px] tracking-[0.3em] text-emerald-500 uppercase mb-8">
              В фокусе
            </div>

            {/* Circle progress */}
            <div className="relative w-52 h-52 mx-auto mb-8">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="46"
                  fill="none"
                  stroke="#1a1a1a"
                  strokeWidth="3"
                />
                <circle
                  cx="50" cy="50" r="46"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 46}`}
                  strokeDashoffset={`${2 * Math.PI * 46 * (1 - progress / 100)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-4xl font-mono font-bold text-white">
                  {formatDuration(secondsLeft)}
                </div>
                <div className="text-xs text-gray-600 mt-1">{selectedMinutes} мин</div>
              </div>
            </div>

            <p className="text-gray-500 text-sm mb-10">
              Закрой лишние вкладки. Ты в фокусе.
            </p>

            <button
              onClick={cancelTimer}
              className="text-gray-700 hover:text-gray-500 text-sm transition-colors"
            >
              Прервать
            </button>
          </div>
        )}

        {/* Done phase */}
        {phase === 'done' && (
          <div className="text-center animate-fadeIn">
            <div className="text-[10px] tracking-[0.3em] text-emerald-500 uppercase mb-6">
              Завершено
            </div>

            <div className="w-20 h-20 rounded-full border-2 border-emerald-500 flex items-center justify-center mx-auto mb-8">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
              Фокус завершен.
            </h2>
            <p className="text-gray-500 text-sm mb-8">Контроль усилен.</p>

            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="bg-[#111] border border-[#1a1a1a] rounded-xl py-3 px-4">
                <div className="text-emerald-400 text-xl font-bold">+{reward.xp}</div>
                <div className="text-xs text-gray-600">XP</div>
              </div>
              <div className="bg-[#111] border border-[#1a1a1a] rounded-xl py-3 px-4">
                <div className="text-emerald-400 text-xl font-bold">+{reward.energy}</div>
                <div className="text-xs text-gray-600">Energy</div>
              </div>
            </div>

            <button
              onClick={() => navigate('dashboard')}
              className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-semibold py-4 rounded-xl transition-colors"
            >
              На главную
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
