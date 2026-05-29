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
  { minutes: 5, label: '5 минут', desc: 'Лёгкий старт' },
  { minutes: 15, label: '15 минут', desc: 'Рабочий блок' },
  { minutes: 25, label: '25 минут', desc: 'Глубокий фокус' },
];

const MILESTONES: { pct: number; text: string }[] = [
  { pct: 0, text: 'Мозг переключается в режим фокуса...' },
  { pct: 25, text: 'Концентрация нарастает' },
  { pct: 50, text: 'Ты в потоке' },
  { pct: 75, text: 'Нейронные пути укрепляются' },
  { pct: 95, text: 'Финальный рывок' },
];

function GrowingTree({ progress }: { progress: number }) {
  // progress: 0–100
  const p = Math.min(progress, 100);

  // Trunk height grows first (0-20%)
  const trunkH = Math.min(1, p / 20);
  // Layer 1 appears at 20%
  const l1 = Math.max(0, Math.min(1, (p - 20) / 20));
  // Layer 2 appears at 40%
  const l2 = Math.max(0, Math.min(1, (p - 40) / 20));
  // Layer 3 appears at 60%
  const l3 = Math.max(0, Math.min(1, (p - 60) / 20));
  // Top / crown at 80%
  const l4 = Math.max(0, Math.min(1, (p - 80) / 20));

  // Glow intensity
  const glow = 0.3 + (p / 100) * 0.7;

  return (
    <svg viewBox="0 0 120 180" className="w-40 h-48 mx-auto">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Ground */}
        <radialGradient id="groundGrad" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#166534" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#166534" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ground glow */}
      <ellipse cx="60" cy="168" rx="35" ry="6" fill="url(#groundGrad)" />

      {/* Trunk */}
      <rect
        x="55" y={168 - trunkH * 50} width="10" height={trunkH * 50}
        rx="4" fill="#15803d"
        style={{ transition: 'all 1s ease-out' }}
      />

      {/* Layer 1 — bottom foliage */}
      <ellipse
        cx="60" cy="110" rx={28 * l1} ry={22 * l1}
        fill="#166534"
        opacity={l1 * glow}
        filter="url(#glow)"
        style={{ transition: 'all 1.2s ease-out' }}
      />

      {/* Layer 2 */}
      <ellipse
        cx="60" cy="88" rx={22 * l2} ry={18 * l2}
        fill="#15803d"
        opacity={l2 * glow}
        filter="url(#glow)"
        style={{ transition: 'all 1.2s ease-out' }}
      />

      {/* Layer 3 */}
      <ellipse
        cx="60" cy="68" rx={17 * l3} ry={15 * l3}
        fill="#16a34a"
        opacity={l3 * glow}
        filter="url(#glow)"
        style={{ transition: 'all 1.2s ease-out' }}
      />

      {/* Crown */}
      <ellipse
        cx="60" cy="52" rx={11 * l4} ry={12 * l4}
        fill="#22c55e"
        opacity={l4 * glow}
        filter="url(#glow)"
        style={{ transition: 'all 1.2s ease-out' }}
      />

      {/* Tip sparkle */}
      {l4 > 0.8 && (
        <circle cx="60" cy="42" r={2 * l4} fill="#86efac" opacity={l4} />
      )}
    </svg>
  );
}

export default function FocusTimer({ navigate, refresh }: NavProps) {
  const [phase, setPhase] = useState<Phase>('pick');
  const [selectedMinutes, setSelectedMinutes] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [reward, setReward] = useState({ xp: 0, energy: 0 });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef('');

  const totalSeconds = selectedMinutes * 60;
  const elapsed = totalSeconds - secondsLeft;
  const progress = totalSeconds > 0 ? (elapsed / totalSeconds) * 100 : 0;

  const milestone = [...MILESTONES].reverse().find((m) => progress >= m.pct) ?? MILESTONES[0];

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
    const newCSI = calcCSI(newFocusSessions, newFocusMinutes, stats.recoveryCount, stats.distractionMinutes, stats.distractionCount);
    const timeSaved = Math.round(stats.timeSaved + selectedMinutes * 0.3);

    updateUser({ energy: newEnergy, xp: newXP, csi: newCSI });
    saveTodayStats({ ...stats, focusMinutes: newFocusMinutes, focusSessions: newFocusSessions, energy: newEnergy, csi: newCSI, timeSaved });
    addFocusSession({ id: uid(), duration: selectedMinutes, completed: true, startedAt: startedAtRef.current, endedAt: new Date().toISOString() });

    setReward(rewards);
    setPhase('done');
    refresh();
  };

  const cancelTimer = () => {
    clearInterval(intervalRef.current!);
    addFocusSession({ id: uid(), duration: selectedMinutes, completed: false, startedAt: startedAtRef.current, endedAt: new Date().toISOString() });
    navigate('dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fadeIn">
      <div className="w-full max-w-sm">

        {/* ── Pick phase ── */}
        {phase === 'pick' && (
          <>
            <button onClick={() => navigate('dashboard')} className="text-gray-600 hover:text-gray-400 text-sm mb-8 transition-colors">
              ← Назад
            </button>
            <div className="text-[10px] tracking-[0.3em] text-emerald-500 uppercase mb-3">
              Фокус-сессия
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Улучши фокус</h1>
            <p className="text-sm text-gray-500 mb-7">Выбери длину блока. Мозг начнёт перестраиваться уже с первой минуты.</p>
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
                      <div>+{FOCUS_REWARDS[d.minutes].energy} энергии</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Running phase ── */}
        {phase === 'running' && (
          <div className="text-center animate-fadeIn">
            <div className="text-[10px] tracking-[0.3em] text-emerald-500 uppercase mb-2">
              Фокус-сессия · {selectedMinutes} мин
            </div>

            {/* Growing tree */}
            <div className="my-4">
              <GrowingTree progress={progress} />
            </div>

            {/* Timer */}
            <div className="text-5xl font-mono font-bold text-white mb-2">
              {formatDuration(secondsLeft)}
            </div>

            {/* Milestone message */}
            <p className="text-sm text-gray-500 min-h-[20px] mb-6 transition-all">
              {milestone.text}
            </p>

            {/* Progress bar */}
            <div className="w-full bg-[#1a1a1a] rounded-full h-1 mb-8">
              <div
                className="bg-emerald-600 h-1 rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>

            <button onClick={cancelTimer} className="text-gray-700 hover:text-gray-500 text-sm transition-colors">
              Прервать
            </button>
          </div>
        )}

        {/* ── Done phase ── */}
        {phase === 'done' && (
          <div className="text-center animate-fadeIn">
            <div className="text-[10px] tracking-[0.3em] text-emerald-500 uppercase mb-6">
              Завершено
            </div>

            {/* Full tree */}
            <GrowingTree progress={100} />

            <h2 className="text-2xl font-bold text-white mt-4 mb-2">Фокус завершён.</h2>
            <p className="text-gray-500 text-sm mb-8">Контроль усилен.</p>

            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="bg-[#111] border border-[#1a1a1a] rounded-xl py-3 px-4">
                <div className="text-emerald-400 text-xl font-bold">+{reward.xp}</div>
                <div className="text-xs text-gray-600">XP</div>
              </div>
              <div className="bg-[#111] border border-[#1a1a1a] rounded-xl py-3 px-4">
                <div className="text-emerald-400 text-xl font-bold">+{reward.energy}</div>
                <div className="text-xs text-gray-600">Энергия</div>
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
