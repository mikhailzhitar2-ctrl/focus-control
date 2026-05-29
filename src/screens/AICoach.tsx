import { NavProps } from '../App';
import { getUser, getTodayStats, getTodayDistractionEvents, getYesterdayStats } from '../utils/storage';
import { getCoachTips, CoachTip } from '../utils/coachTips';

function TipCard({ tip }: { tip: CoachTip }) {
  const styles: Record<CoachTip['type'], string> = {
    warning: 'border-amber-900/40 bg-amber-950/10',
    success: 'border-emerald-900/40 bg-emerald-950/10',
    info: 'border-[#1a1a1a] bg-[#111]',
  };
  const dot: Record<CoachTip['type'], string> = {
    warning: 'bg-amber-500',
    success: 'bg-emerald-500',
    info: 'bg-gray-600',
  };

  return (
    <div className={`rounded-2xl border p-4 ${styles[tip.type]}`}>
      <div className="flex items-start gap-3">
        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${dot[tip.type]}`} />
        <p className="text-sm text-gray-300 leading-relaxed">{tip.text}</p>
      </div>
    </div>
  );
}

export default function AICoach({ navigate }: NavProps) {
  const user = getUser()!;
  const stats = getTodayStats();
  const todayEvents = getTodayDistractionEvents();
  const yesterdayStats = getYesterdayStats();
  const tips = getCoachTips(user, stats, todayEvents, yesterdayStats);

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
          Коуч на правилах
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Коуч</h1>
        <p className="text-sm text-gray-600 mb-7">
          На основе твоих данных сегодня
        </p>

        {/* Context snapshot */}
        <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-4 mb-5">
          <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-3">Контекст</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-white">{user.energy}</div>
              <div className="text-[10px] text-gray-600">Энергия</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">{stats.distractionCount}</div>
              <div className="text-[10px] text-gray-600">Срывов</div>
            </div>
            <div>
              <div className="text-lg font-bold text-emerald-400">{stats.recoveryCount}</div>
              <div className="text-[10px] text-gray-600">Recovery</div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="space-y-3">
          {tips.map((tip) => (
            <TipCard key={tip.id} tip={tip} />
          ))}
        </div>

        <div className="mt-6">
          <button
            onClick={() => navigate('ai-chat')}
            className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-semibold py-4 rounded-xl transition-colors"
          >
            Поговорить с ИИ Коучем →
          </button>
        </div>
      </div>
    </div>
  );
}
