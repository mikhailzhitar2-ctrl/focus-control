import { useState } from 'react';
import { NavProps } from '../App';
import { ScrollingEstimate, EnergyState, User } from '../types';
import { setUser } from '../utils/storage';
import { scrollingToTime } from '../utils/calculations';

const SCROLLING_OPTIONS: { value: ScrollingEstimate; label: string; hours: number }[] = [
  { value: '<1h', label: 'Меньше 1 часа', hours: 0.5 },
  { value: '1-2h', label: '1–2 часа', hours: 1.5 },
  { value: '2-3h', label: '2–3 часа', hours: 2.5 },
  { value: '3-5h', label: '3–5 часов', hours: 4 },
  { value: '5+h', label: '5+ часов', hours: 6 },
];

const ENERGY_OPTIONS: { value: EnergyState; label: string; desc: string; startEnergy: number }[] = [
  { value: 'charged', label: 'Заряжен', desc: 'Готов к сложным задачам', startEnergy: 80 },
  { value: 'normal', label: 'Нормально', desc: 'Обычный рабочий день', startEnergy: 70 },
  { value: 'tired', label: 'Устал', desc: 'Нужна осторожность', startEnergy: 50 },
];

type Step = 'name' | 'scrolling' | 'impact' | 'energy';

export default function Onboarding({ navigate }: NavProps) {
  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [scrolling, setScrolling] = useState<ScrollingEstimate | null>(null);
  const [energyState, setEnergyState] = useState<EnergyState | null>(null);

  const handleScrollingSelect = (value: ScrollingEstimate) => {
    setScrolling(value);
  };

  const handleComplete = () => {
    if (!name || !scrolling || !energyState) return;
    const energyOpt = ENERGY_OPTIONS.find((e) => e.value === energyState)!;
    const now = new Date().toISOString();
    const user: User = {
      name: name.trim(),
      goal: '',
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
  const hours5y = timeCalc ? Math.round(timeCalc.hoursPerMonth * 12 * 5) : 0;
  const days5y = Math.round(hours5y / 24);

  const stepIndex = { name: 0, scrolling: 1, impact: 1, energy: 2 }[step];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fadeIn">
      <div className="w-full max-w-sm">
        <div className="text-[10px] tracking-[0.35em] text-emerald-500 uppercase mb-3">
          Focus Control
        </div>

        {/* ── Step: name ── */}
        {step === 'name' && (
          <div className="animate-fadeIn">
            <h1 className="text-3xl font-bold text-white mb-2">Привет</h1>
            <p className="text-sm text-gray-500 mb-7">Как тебя зовут?</p>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && name.trim() && setStep('scrolling')}
              placeholder="Имя"
              className="w-full bg-[#111] border border-[#222] focus:border-emerald-600 rounded-xl px-4 py-4 text-white placeholder-gray-700 transition-colors text-lg mb-4"
            />
            <button
              onClick={() => setStep('scrolling')}
              disabled={!name.trim()}
              className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:bg-[#1a1a1a] disabled:text-gray-600 text-white font-semibold py-4 rounded-xl transition-colors"
            >
              Продолжить
            </button>
          </div>
        )}

        {/* ── Step: scrolling ── */}
        {step === 'scrolling' && (
          <div className="animate-fadeIn">
            <h1 className="text-3xl font-bold text-white mb-2">Сколько скроллишь?</h1>
            <p className="text-sm text-gray-500 mb-6">Среднее время в день на телефоне / соцсетях</p>
            <div className="space-y-2">
              {SCROLLING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleScrollingSelect(opt.value)}
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
            <button
              onClick={() => setStep('impact')}
              disabled={!scrolling}
              className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:bg-[#1a1a1a] disabled:text-gray-600 text-white font-semibold py-4 rounded-xl transition-colors mt-4"
            >
              Продолжить
            </button>
          </div>
        )}

        {/* ── Step: impact ── */}
        {step === 'impact' && timeCalc && (
          <div className="animate-fadeIn">
            <div className="text-[10px] tracking-[0.3em] text-red-600 uppercase mb-6">
              Твоё время
            </div>

            <div className="space-y-4 mb-8">
              <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5">
                <div className="text-gray-500 text-sm mb-1">В год ты тратишь</div>
                <div className="text-5xl font-bold text-white">{timeCalc.hoursPerMonth * 12}
                  <span className="text-xl text-gray-500 ml-2">часов</span>
                </div>
                <div className="text-xs text-gray-600 mt-1">своей жизни на бесполезный скроллинг</div>
              </div>

              <div className="bg-[#111] border border-red-900/30 rounded-2xl p-5">
                <div className="text-gray-500 text-sm mb-1">В масштабе 5 лет</div>
                <div className="text-5xl font-bold text-red-400">{days5y}
                  <span className="text-xl text-gray-500 ml-2">дней</span>
                </div>
                <div className="text-xs text-gray-600 mt-1">твоей жизни уйдёт в ленту</div>
              </div>

              <div className="px-4 py-3 rounded-xl border border-emerald-900/30">
                <p className="text-sm text-emerald-400 leading-relaxed">
                  Даже вернув <span className="text-white font-semibold">30%</span> этого времени — ты получишь{' '}
                  <span className="text-white font-semibold">{Math.round(days5y * 0.3)} дней</span> на то, что реально важно.
                </p>
              </div>
            </div>

            <button
              onClick={() => setStep('energy')}
              className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-semibold py-4 rounded-xl transition-colors"
            >
              Я хочу вернуть контроль →
            </button>
          </div>
        )}

        {/* ── Step: energy ── */}
        {step === 'energy' && (
          <div className="animate-fadeIn">
            <h1 className="text-3xl font-bold text-white mb-2">Состояние сейчас</h1>
            <p className="text-sm text-gray-500 mb-6">Это влияет на стартовый уровень энергии</p>
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
                i === stepIndex ? 'w-5 h-1.5 bg-emerald-500' : 'w-1.5 h-1.5 bg-[#2a2a2a]'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
