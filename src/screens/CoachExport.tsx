import { useState } from 'react';
import { NavProps } from '../App';
import { exportAllData } from '../utils/storage';

export default function CoachExport({ navigate }: NavProps) {
  const [copied, setCopied] = useState(false);
  const data = exportAllData();
  const json = JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement('textarea');
      el.value = json;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
          Data Export
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Send to AI Coach</h1>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Отправь эти данные наставнику, чтобы получить персональный разбор.
        </p>

        {/* JSON block */}
        <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl p-4 mb-4 relative">
          <pre className="text-xs text-gray-500 overflow-auto max-h-64 leading-relaxed whitespace-pre-wrap break-all font-mono">
            {json}
          </pre>
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className={`w-full font-semibold py-4 rounded-xl transition-all mb-3 ${
            copied
              ? 'bg-emerald-900/40 border border-emerald-800 text-emerald-400'
              : 'bg-[#111] border border-[#222] hover:border-[#333] text-white'
          }`}
        >
          {copied ? 'Скопировано' : 'Copy JSON'}
        </button>

        <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4">
          <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">
            Что включено
          </div>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>· Профиль и цель пользователя</li>
            <li>· Статистика за сегодня и историю</li>
            <li>· Все срывы и recovery</li>
            <li>· Фокус-сессии</li>
            <li>· XP, CSI, Energy, Streak</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
