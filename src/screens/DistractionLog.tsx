import { useState } from 'react';
import { NavProps } from '../App';
import {
  getUser,
  updateUser,
  getTodayStats,
  saveTodayStats,
  addDistractionEvent,
} from '../utils/storage';
import { calcCSI, DISTRACTION_ENERGY, clampEnergy, uid } from '../utils/calculations';

const DURATIONS = [
  { minutes: 5, label: '5 минут', desc: 'Быстрый зал' },
  { minutes: 15, label: '15 минут', desc: 'Серьезный залип' },
  { minutes: 30, label: '30 минут', desc: 'Глубокий залип' },
  { minutes: 60, label: '60+ минут', desc: 'Потеря контроля' },
];

export default function DistractionLog({ navigate, refresh }: NavProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const handleConfirm = () => {
    if (!selected) return;
    const user = getUser()!;
    const stats = getTodayStats();
    const energyDelta = DISTRACTION_ENERGY[selected] ?? -10;
    const newEnergy = clampEnergy(user.energy + energyDelta);
    const newDistractionMinutes = stats.distractionMinutes + selected;
    const newDistractionCount = stats.distractionCount + 1;
    const newCSI = calcCSI(
      stats.focusSessions,
      stats.focusMinutes,
      stats.recoveryCount,
      newDistractionMinutes,
      newDistractionCount,
    );

    addDistractionEvent({
      id: uid(),
      time: new Date().toISOString(),
      minutes: selected,
      recovered: false,
    });
    updateUser({ energy: newEnergy, csi: newCSI });
    saveTodayStats({
      ...stats,
      distractionMinutes: newDistractionMinutes,
      distractionCount: newDistractionCount,
      energy: newEnergy,
      csi: newCSI,
    });

    refresh();
    setDone(true);
  };

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fadeIn">
        <div className="w-full max-w-sm text-center">
          <div className="text-[10px] tracking-[0.3em] text-red-600 uppercase mb-6">
            Зафиксировано
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Импульс перехватил управление.
          </h2>
          <p className="text-gray-500 text-sm mb-10">День можно спасти.</p>

          <div className="space-y-3">
            <button
              onClick={() => navigate('recovery-flow')}
              className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-semibold py-4 rounded-xl transition-colors"
            >
              Вернуть контроль
            </button>
            <button
              onClick={() => navigate('dashboard')}
              className="w-full bg-[#111] border border-[#1a1a1a] text-gray-400 hover:text-gray-300 font-medium py-4 rounded-xl transition-colors text-sm"
            >
              Позже
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fadeIn">
      <div className="w-full max-w-sm">
        <button
          onClick={() => navigate('dashboard')}
          className="text-gray-600 hover:text-gray-400 text-sm mb-8 transition-colors"
        >
          ← Назад
        </button>

        <div className="text-[10px] tracking-[0.3em] text-red-600 uppercase mb-3">
          Журнал срывов
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Я отвлекся</h1>
        <p className="text-sm text-gray-500 mb-7">Сколько длился залип?</p>

        <div className="space-y-2">
          {DURATIONS.map((d) => (
            <button
              key={d.minutes}
              onClick={() => setSelected(d.minutes)}
              className={`w-full text-left px-4 py-4 rounded-xl border transition-all ${
                selected === d.minutes
                  ? 'border-red-800/60 bg-red-950/20 text-white'
                  : 'border-[#1a1a1a] bg-[#111] text-gray-300 hover:border-[#2a2a2a]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{d.label}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{d.desc}</div>
                </div>
                <div className="text-xs text-red-800 font-medium">
                  {DISTRACTION_ENERGY[d.minutes]} энергии
                </div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handleConfirm}
          disabled={!selected}
          className="w-full bg-[#1a1a1a] hover:bg-[#222] disabled:opacity-30 text-white font-semibold py-4 rounded-xl transition-colors mt-5 border border-[#2a2a2a]"
        >
          Зафиксировать
        </button>
      </div>
    </div>
  );
}
