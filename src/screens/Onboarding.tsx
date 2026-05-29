import { useState } from 'react';
import { NavProps } from '../App';
import { ScrollingEstimate, EnergyState, User } from '../types';
import { setUser } from '../utils/storage';
import { scrollingToTime } from '../utils/calculations';

const SCROLLING_OPTIONS: { value: ScrollingEstimate; label: string }[] = [
  { value: '<1h', label: 'Меньше 1 часа' },
  { value: '1-2h', label: '1–2 часа' },
  { value: '2-3h', label: '2–3 часа' },
  { value: '3-5h', label: '3–5 часов' },
  { value: '5+h', label: '5+ часов' },
];

const ENERGY_OPTIONS: { value: EnergyState; label: string; desc: string; startEnergy: number }[] = [
  { value: 'charged', label: 'Заряжен', desc: 'Готов к сложным задачам', startEnergy: 80 },
  { value: 'normal', label: 'Нормально', desc: 'Обычный рабочий день', startEnergy: 70 },
  { value: 'tired', label: 'Устал', desc: 'Нужна осторожность', startEnergy: 50 },
];

export default function Onboarding({ navigate }: NavProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [scrolling, setScrolling] = useState<ScrollingEstimate | null>(null);
  const [energyState, setEnergyState] = useState<EnergyState | null>(null);

  const handleComplete = () => {
    if (!name || !goal || !scrolling || !energyState) return;
    const energyOpt = ENERGY_OPTIONS.find((e) => e.value === energyState)!;
    const now = new Date().toISOString();
    const user: User = {
      name: name.trim(),
      goal: goal.trim(),
      scrollingEstimate: scrolling,
      initialEnergy: energyState,
      xp: 0,
      csi: 50,
      energy: energyOpt.startEnergy,
      streak: 1,
      createdAt: now,
      lastActiveDate: now.split('T')[0],
    };
    setUser(user);
    navigate('dashboard');
  };

  const timeCalc = scrolling ? scrollingToTime(scrolling) : null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fadeIn">
      <div className="w-full max-w-sm">
        {/* Label */}
        <div className="text-[10px] tracking-[0.35em] text-emerald-500 uppercase mb-3">
          Focus Control
        </div>

        {/* Step 0 — name + goal */}
        {step === 0 && (
          <div className="animate-fadeIn">
            <h1 className="text-3xl font-bold text-white mb-8">Начнем</h1>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
                  Как тебя зовут?
                </label>
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Имя"
                  className="w-full bg-[#111] border border-[#222] focus:border-emerald-600 rounded-xl px-4 py-3.5 text-white placeholder-gray-700 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
                  Зачем хочешь вернуть фокус?
                </label>
                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Моя цель..."
                  rows={3}
                  className="w-full bg-[#111] border border-[#222] focus:border-emerald-600 rounded-xl px-4 py-3.5 text-white placeholder-gray-700 transition-colors resize-none"
                />
              </div>
              <button
                onClick={() => setStep(1)}
                disabled={!name.trim() || !goal.trim()}
                className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:bg-[#1a1a1a] disabled:text-gray-600 text-white font-semibold py-4 rounded-xl transition-colors mt-2"
              >
                Продолжить
              </button>
            </div>
          </div>
        )}

        {/* Step 1 — scrolling estimate */}
        {step === 1 && (
          <div className="animate-fadeIn">
            <h1 className="text-3xl font-bold text-white mb-2">Твое время</h1>
            <p className="text-sm text-gray-500 mb-6">Сколько времени в день уходит на скроллинг?</p>
            <div className="space-y-2">
              {SCROLLING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setScrolling(opt.value)}
                  className={`w-full text-left px-4 py-4 rounded-xl border transition-all ${
                    scrolling === opt.value
                      ? 'border-emerald-600 bg-emerald-950/40 text-white'
                      : 'border-[#1e1e1e] bg-[#111] text-gray-300 hover:border-[#2a2a2a]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {timeCalc && (
              <div className="mt-4 p-4 bg-[#111] border border-[#1e1e1e] rounded-xl animate-fadeIn">
                <p className="text-sm text-gray-300 leading-relaxed">
                  Ты теряешь примерно{' '}
                  <span className="text-white font-semibold">{timeCalc.hoursPerMonth} часов в месяц</span>
                  {' / '}
                  <span className="text-white font-semibold">{timeCalc.daysPerYear} дней в год</span>.{' '}
                  <span className="text-gray-500">Мы поможем вернуть часть этого времени.</span>
                </p>
              </div>
            )}

            <button
              onClick={() => setStep(2)}
              disabled={!scrolling}
              className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:bg-[#1a1a1a] disabled:text-gray-600 text-white font-semibold py-4 rounded-xl transition-colors mt-4"
            >
              Продолжить
            </button>
          </div>
        )}

        {/* Step 2 — energy state */}
        {step === 2 && (
          <div className="animate-fadeIn">
            <h1 className="text-3xl font-bold text-white mb-2">Состояние</h1>
            <p className="text-sm text-gray-500 mb-6">Как ты себя чувствуешь прямо сейчас?</p>
            <div className="space-y-2">
              {ENERGY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setEnergyState(opt.value)}
                  className={`w-full text-left px-4 py-4 rounded-xl border transition-all ${
                    energyState === opt.value
                      ? 'border-emerald-600 bg-emerald-950/40 text-white'
                      : 'border-[#1e1e1e] bg-[#111] text-gray-300 hover:border-[#2a2a2a]'
                  }`}
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
            <button
              onClick={handleComplete}
              disabled={!energyState}
              className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:bg-[#1a1a1a] disabled:text-gray-600 text-white font-semibold py-4 rounded-xl transition-colors mt-4"
            >
              Начать
            </button>
          </div>
        )}

        {/* Progress dots */}
        <div className="flex gap-2 justify-center mt-10">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`rounded-full transition-all ${
                i === step ? 'w-5 h-1.5 bg-emerald-500' : 'w-1.5 h-1.5 bg-[#2a2a2a]'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
