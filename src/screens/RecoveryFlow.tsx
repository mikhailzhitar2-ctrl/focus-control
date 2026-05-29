import { useState, useEffect, useRef } from 'react';
import { NavProps } from '../App';
import {
  getUser,
  updateUser,
  getTodayStats,
  saveTodayStats,
  addRecoveryEvent,
  getLastDistractionId,
  markDistractionRecovered,
} from '../utils/storage';
import { calcCSI, clampEnergy, uid } from '../utils/calculations';

type Step = 'dot' | 'breathe' | 'action' | 'done';

export default function RecoveryFlow({ navigate, refresh }: NavProps) {
  const [step, setStep] = useState<Step>('dot');
  const [dotSeconds, setDotSeconds] = useState(20);
  const [breatheSeconds, setBreatheSeconds] = useState(30);
  const [nextAction, setNextAction] = useState('');
  const startedAtRef = useRef(new Date().toISOString());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Dot timer
  useEffect(() => {
    if (step !== 'dot') return;
    intervalRef.current = setInterval(() => {
      setDotSeconds((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          setStep('breathe');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [step]);

  // Breathe timer
  useEffect(() => {
    if (step !== 'breathe') return;
    intervalRef.current = setInterval(() => {
      setBreatheSeconds((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          setStep('action');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [step]);

  const handleComplete = () => {
    if (!nextAction.trim()) return;
    const user = getUser()!;
    const stats = getTodayStats();
    const newEnergy = clampEnergy(user.energy + 5);
    const newXP = user.xp + 10;
    const newRecoveryCount = stats.recoveryCount + 1;
    const newCSI = calcCSI(
      stats.focusSessions,
      stats.focusMinutes,
      newRecoveryCount,
      stats.distractionMinutes,
      stats.distractionCount,
    );

    updateUser({ energy: newEnergy, xp: newXP, csi: newCSI });
    saveTodayStats({ ...stats, recoveryCount: newRecoveryCount, energy: newEnergy, csi: newCSI });

    addRecoveryEvent({
      id: uid(),
      startedAt: startedAtRef.current,
      completedAt: new Date().toISOString(),
      nextAction: nextAction.trim(),
    });

    const lastId = getLastDistractionId();
    if (lastId) markDistractionRecovered(lastId);

    refresh();
    setStep('done');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fadeIn">
      <div className="w-full max-w-sm">
        {/* Step: Dot */}
        {step === 'dot' && (
          <div className="text-center animate-fadeIn">
            <div className="text-[10px] tracking-[0.3em] text-violet-500 uppercase mb-6">
              Шаг 1 из 3
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Смотри на точку</h2>
            <p className="text-sm text-gray-600 mb-12">Не отводи взгляд</p>

            <div className="relative flex items-center justify-center h-40 mb-10">
              <div className="w-4 h-4 rounded-full bg-white" />
            </div>

            <div className="text-5xl font-mono font-bold text-white mb-2">{dotSeconds}</div>
            <div className="text-xs text-gray-600">секунд</div>

            <div className="w-full bg-[#1a1a1a] rounded-full h-0.5 mt-8">
              <div
                className="bg-violet-600 h-0.5 rounded-full transition-all duration-1000"
                style={{ width: `${((20 - dotSeconds) / 20) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Step: Breathe */}
        {step === 'breathe' && (
          <div className="text-center animate-fadeIn">
            <div className="text-[10px] tracking-[0.3em] text-violet-500 uppercase mb-6">
              Шаг 2 из 3
            </div>
            <h2 className="text-xl font-bold text-white mb-2">3 медленных вдоха</h2>
            <p className="text-sm text-gray-600 mb-12">Дыши вместе с кругом</p>

            <div className="flex items-center justify-center h-40 mb-10">
              <div className="w-16 h-16 rounded-full bg-violet-600/40 animate-breathe" />
            </div>

            <div className="text-5xl font-mono font-bold text-white mb-2">{breatheSeconds}</div>
            <div className="text-xs text-gray-600">секунд</div>

            <div className="w-full bg-[#1a1a1a] rounded-full h-0.5 mt-8">
              <div
                className="bg-violet-600 h-0.5 rounded-full transition-all duration-1000"
                style={{ width: `${((30 - breatheSeconds) / 30) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Step: Next action */}
        {step === 'action' && (
          <div className="animate-fadeIn">
            <div className="text-[10px] tracking-[0.3em] text-violet-500 uppercase mb-6">
              Шаг 3 из 3
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Следующее действие</h2>
            <p className="text-sm text-gray-500 mb-7">
              Напиши одно действие, которое сделаешь прямо сейчас
            </p>
            <textarea
              autoFocus
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              placeholder="Я сделаю..."
              rows={3}
              className="w-full bg-[#111] border border-[#222] focus:border-violet-700 rounded-xl px-4 py-3.5 text-white placeholder-gray-700 transition-colors resize-none mb-4"
            />
            <button
              onClick={handleComplete}
              disabled={!nextAction.trim()}
              className="w-full bg-violet-800 hover:bg-violet-700 disabled:bg-[#1a1a1a] disabled:text-gray-600 text-white font-semibold py-4 rounded-xl transition-colors"
            >
              Завершить Recovery
            </button>
          </div>
        )}

        {/* Done */}
        {step === 'done' && (
          <div className="text-center animate-fadeIn">
            <div className="text-[10px] tracking-[0.3em] text-emerald-500 uppercase mb-6">
              Recovery завершен
            </div>

            <div className="w-20 h-20 rounded-full border-2 border-emerald-500 flex items-center justify-center mx-auto mb-8">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Контроль восстановлен.</h2>
            <p className="text-gray-500 text-sm mb-8">
              Ты вернулся быстрее, чем мог бы.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="bg-[#111] border border-[#1a1a1a] rounded-xl py-3 px-4">
                <div className="text-emerald-400 text-xl font-bold">+10</div>
                <div className="text-xs text-gray-600">XP</div>
              </div>
              <div className="bg-[#111] border border-[#1a1a1a] rounded-xl py-3 px-4">
                <div className="text-emerald-400 text-xl font-bold">+5</div>
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
