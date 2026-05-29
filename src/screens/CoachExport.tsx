import { useState } from 'react';
import { NavProps } from '../App';
import { exportAllData } from '../utils/storage';

function buildPrompt(data: ReturnType<typeof exportAllData>): string {
  const u = data.user;
  const s = data.todayStats;
  if (!u) return '';

  const scrollMap: Record<string, string> = {
    '<1h': 'меньше 1 часа',
    '1-2h': '1–2 часа',
    '2-3h': '2–3 часа',
    '3-5h': '3–5 часов',
    '5+h': '5+ часов',
  };

  return `Привет! Я использую приложение Focus Control для восстановления концентрации. Вот мои данные за сегодня — сделай персональный разбор и дай конкретные советы.

═══ ПРОФИЛЬ ═══
Имя: ${u.name}
Цель: ${u.goal}
Скроллинг до начала: ${scrollMap[u.scrollingEstimate] || u.scrollingEstimate} в день
Дней в приложении: ${data.allDailyStats.length || 1}
Серия дней подряд: ${u.streak}

═══ СОСТОЯНИЕ СЕГОДНЯ ═══
Ментальная энергия: ${u.energy}/100
ИКС (индекс когнитивного контроля): ${u.csi}/100
Опыт всего: ${u.xp}

Фокус-минут: ${s.focusMinutes} мин (${s.focusSessions} сессий)
Срывов: ${s.distractionCount} (${s.distractionMinutes} мин потрачено)
Recovery: ${s.recoveryCount} раз
Сэкономлено времени: ~${s.timeSaved} мин

═══ ИСТОРИЯ (последние ${data.allDailyStats.length} дней) ═══
${data.allDailyStats
  .slice(-7)
  .map(
    (d) =>
      `${d.date}: фокус ${d.focusMinutes}мин, срывов ${d.distractionCount}, recovery ${d.recoveryCount}, ИКС ${d.csi}`,
  )
  .join('\n')}

═══ ВОПРОСЫ ДЛЯ РАЗБОРА ═══
1. Как оценить мой прогресс за этот период?
2. Что говорит соотношение срывов и recovery?
3. В какое время суток мне лучше планировать глубокую работу?
4. Какой конкретный ритуал поможет мне завтра удержать фокус?
5. На что обратить внимание прямо сейчас?`;
}

export default function CoachExport({ navigate }: NavProps) {
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<'prompt' | 'json'>('prompt');

  const data = exportAllData();
  const prompt = buildPrompt(data);
  const json = JSON.stringify(data, null, 2);
  const content = view === 'prompt' ? prompt : json;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      const el = document.createElement('textarea');
      el.value = content;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenClaude = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      // ignore
    }
    window.open('https://claude.ai/new', '_blank');
  };

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
          Разбор с коучем
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Отправить коучу</h1>
        <p className="text-sm text-gray-500 mb-5 leading-relaxed">
          Скопируй промпт и вставь в Claude — получишь персональный разбор за 30 секунд.
        </p>

        {/* How it works */}
        <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-4 mb-4">
          <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-3">Как это работает</div>
          <div className="space-y-2">
            {[
              '1. Нажми «Скопировать промпт»',
              '2. Нажми «Открыть Claude»',
              '3. Вставь текст (Ctrl+V) и отправь',
              '4. Получи персональный разбор',
            ].map((step) => (
              <div key={step} className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-emerald-600 mt-1.5 flex-shrink-0" />
                <span className="text-xs text-gray-400">{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-1 mb-3">
          <button
            onClick={() => setView('prompt')}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
              view === 'prompt'
                ? 'bg-emerald-900/40 text-emerald-400'
                : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            Промпт
          </button>
          <button
            onClick={() => setView('json')}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
              view === 'json'
                ? 'bg-[#1a1a1a] text-gray-300'
                : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            JSON
          </button>
        </div>

        {/* Content preview */}
        <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl p-4 mb-4 relative">
          <pre className="text-xs text-gray-500 overflow-auto max-h-56 leading-relaxed whitespace-pre-wrap break-words font-mono">
            {content}
          </pre>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleOpenClaude}
            className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-semibold py-4 rounded-xl transition-colors"
          >
            Открыть Claude →
          </button>
          <button
            onClick={handleCopy}
            className={`w-full font-medium py-3.5 rounded-xl transition-all border ${
              copied
                ? 'bg-emerald-950/30 border-emerald-800 text-emerald-400'
                : 'bg-[#111] border-[#222] hover:border-[#333] text-gray-300'
            }`}
          >
            {copied ? 'Скопировано' : view === 'prompt' ? 'Скопировать промпт' : 'Скопировать JSON'}
          </button>
        </div>

        <p className="text-[10px] text-gray-700 text-center mt-4 leading-relaxed">
          Также работает с ChatGPT, Gemini и другими ИИ-ассистентами
        </p>
      </div>
    </div>
  );
}
