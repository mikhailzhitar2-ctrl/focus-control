import { useState, useRef, useEffect } from 'react';
import { NavProps } from '../App';
import { exportAllData } from '../utils/storage';

const KEY_STORAGE = 'fc_anthropic_key';

function getStoredKey(): string {
  return localStorage.getItem(KEY_STORAGE) ?? '';
}
function saveKey(k: string) {
  localStorage.setItem(KEY_STORAGE, k);
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

function buildSystemPrompt(): string {
  const data = exportAllData();
  const u = data.user;
  const s = data.todayStats;
  if (!u) return 'Ты коуч по концентрации и продуктивности.';

  const scrollMap: Record<string, string> = {
    '<1h': '<1 ч/день',
    '1-2h': '1-2 ч/день',
    '2-3h': '2-3 ч/день',
    '3-5h': '3-5 ч/день',
    '5+h': '5+ ч/день',
  };

  const history = data.allDailyStats
    .slice(-7)
    .map((d) => `${d.date}: фокус ${d.focusMinutes}м, срывов ${d.distractionCount}, recovery ${d.recoveryCount}, CSI ${d.csi}`)
    .join('\n');

  return `Ты — персональный коуч по концентрации и когнитивному контролю в приложении Focus Control.

ДАННЫЕ ПОЛЬЗОВАТЕЛЯ:
Имя: ${u.name}
Цель: ${u.goal}
Скроллинг до начала: ${scrollMap[u.scrollingEstimate] || u.scrollingEstimate}
Серия дней: ${u.streak}

СЕГОДНЯ:
Ментальная энергия: ${u.energy}/100
CSI: ${u.csi}/100
XP всего: ${u.xp}
Фокус: ${s.focusMinutes} мин (${s.focusSessions} сессий)
Срывов: ${s.distractionCount} (${s.distractionMinutes} мин)
Recovery: ${s.recoveryCount}

ИСТОРИЯ 7 ДНЕЙ:
${history || 'нет данных'}

ПРАВИЛА ОБЩЕНИЯ:
- Отвечай коротко и конкретно (2-4 предложения)
- Говори как наставник, не как робот
- Опирайся на реальные данные выше
- Давай один конкретный следующий шаг
- Говори на русском`;
}

export default function AIChat({ navigate }: NavProps) {
  const [apiKey, setApiKey] = useState(getStoredKey());
  const [keyInput, setKeyInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Auto-start with greeting
  useEffect(() => {
    if (apiKey && messages.length === 0) {
      sendMessage('Привет! Сделай краткий разбор моего дня и скажи, что стоит сделать прямо сейчас.', true);
    }
  }, [apiKey]);

  const handleSaveKey = () => {
    const k = keyInput.trim();
    if (!k.startsWith('sk-ant-')) {
      setError('Ключ должен начинаться с sk-ant-...');
      return;
    }
    saveKey(k);
    setApiKey(k);
    setError('');
  };

  const sendMessage = async (text: string, silent = false) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', text: text.trim() };
    const newMessages = silent ? messages : [...messages, userMsg];
    if (!silent) {
      setMessages(newMessages);
      setInput('');
    }
    setLoading(true);
    setError('');

    try {
      const history = [
        ...newMessages.map((m) => ({ role: m.role, content: m.text })),
        ...(silent ? [{ role: 'user' as const, content: text }] : []),
      ];

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 400,
          system: buildSystemPrompt(),
          messages: history,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
        throw new Error(res.status === 401 ? 'Неверный API-ключ' : (err?.error?.message ?? `HTTP ${res.status}`));
      }

      const data = await res.json() as { content: { type: string; text: string }[] };
      const assistantText = data.content[0]?.type === 'text' ? data.content[0].text : '...';

      setMessages((prev) => [
        ...(silent ? [] : prev),
        ...(silent ? [userMsg] : []),
        { role: 'assistant', text: assistantText },
      ]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg.includes('Неверный') ? msg : `Ошибка: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const QUICK = [
    'Как мой прогресс за сегодня?',
    'Что сделать прямо сейчас?',
    'Когда мне лучше работать?',
    'Как справляться со срывами?',
  ];

  // Key setup screen
  if (!apiKey) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fadeIn">
        <div className="w-full max-w-sm">
          <button
            onClick={() => navigate('dashboard')}
            className="text-gray-600 hover:text-gray-400 text-sm mb-8 transition-colors"
          >
            ← Назад
          </button>

          <div className="text-[10px] tracking-[0.3em] text-emerald-500 uppercase mb-3">
            ИИ Коуч
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Настройка</h1>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Введи API-ключ Anthropic — коуч будет анализировать твои данные прямо здесь.
          </p>

          <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-4 mb-4">
            <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-3">Где взять ключ</div>
            <div className="space-y-1.5 text-xs text-gray-500">
              <div>1. Открой <span className="text-emerald-600">console.anthropic.com</span></div>
              <div>2. API Keys → Create Key</div>
              <div>3. Скопируй ключ (начинается с sk-ant-)</div>
            </div>
          </div>

          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
            placeholder="sk-ant-api03-..."
            className="w-full bg-[#111] border border-[#222] focus:border-emerald-600 rounded-xl px-4 py-3.5 text-white placeholder-gray-700 transition-colors font-mono text-sm mb-3"
          />

          {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

          <button
            onClick={handleSaveKey}
            disabled={!keyInput.trim()}
            className="w-full bg-emerald-800 hover:bg-emerald-700 disabled:bg-[#1a1a1a] disabled:text-gray-600 text-white font-semibold py-4 rounded-xl transition-colors"
          >
            Подключить коуча
          </button>

          <p className="text-[10px] text-gray-700 text-center mt-4">
            Ключ хранится только в твоём браузере
          </p>
        </div>
      </div>
    );
  }

  // Chat screen
  return (
    <div className="min-h-screen flex flex-col animate-fadeIn">
      {/* Header */}
      <div className="px-6 pt-10 pb-4 border-b border-[#141414] flex-shrink-0">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('dashboard')}
            className="text-gray-600 hover:text-gray-400 text-sm transition-colors"
          >
            ← Назад
          </button>
          <div className="text-[10px] tracking-[0.3em] text-emerald-500 uppercase">
            ИИ Коуч
          </div>
          <button
            onClick={() => { saveKey(''); setApiKey(''); setMessages([]); }}
            className="text-gray-700 hover:text-gray-500 text-xs transition-colors"
          >
            Сменить ключ
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="text-center pt-8">
            <div className="w-12 h-12 rounded-full border border-emerald-800 flex items-center justify-center mx-auto mb-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <p className="text-gray-600 text-sm">Загрузка коуча...</p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-emerald-900/40 text-white'
                  : 'bg-[#111] border border-[#1e1e1e] text-gray-300'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl px-4 py-3">
              <div className="flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse delay-100" />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse delay-200" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-950/20 border border-red-900/30 rounded-xl px-4 py-3 text-xs text-red-400">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      {messages.length <= 2 && !loading && (
        <div className="px-5 pb-2 flex gap-2 overflow-x-auto flex-shrink-0">
          {QUICK.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="flex-shrink-0 bg-[#111] border border-[#1e1e1e] hover:border-emerald-900/50 text-gray-400 text-xs px-3 py-2 rounded-xl transition-colors whitespace-nowrap"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-5 pb-8 pt-2 flex-shrink-0">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Спроси коуча..."
            disabled={loading}
            className="flex-1 bg-[#111] border border-[#222] focus:border-emerald-700 rounded-xl px-4 py-3 text-white placeholder-gray-700 text-sm transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-emerald-800 hover:bg-emerald-700 disabled:bg-[#1a1a1a] disabled:text-gray-700 text-white px-4 py-3 rounded-xl transition-colors text-sm font-medium"
          >
            →
          </button>
        </div>
      </form>
    </div>
  );
}
