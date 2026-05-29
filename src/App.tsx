import { useState, useEffect } from 'react';
import { Screen } from './types';
import { getUser } from './utils/storage';
import Onboarding from './screens/Onboarding';
import Dashboard from './screens/Dashboard';
import FocusTimer from './screens/FocusTimer';
import DistractionLog from './screens/DistractionLog';
import RecoveryFlow from './screens/RecoveryFlow';
import DailyMissions from './screens/DailyMissions';
import Analytics from './screens/Analytics';
import AICoach from './screens/AICoach';
import CoachExport from './screens/CoachExport';
import AIChat from './screens/AIChat';

export interface NavProps {
  navigate: (screen: Screen) => void;
  refresh: () => void;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('onboarding');
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (getUser()) setScreen('dashboard');
  }, []);

  const navigate = (s: Screen) => {
    setScreen(s);
    window.scrollTo(0, 0);
  };
  const refresh = () => setKey((k) => k + 1);

  const props: NavProps = { navigate, refresh };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {screen === 'onboarding' && <Onboarding {...props} />}
      {screen === 'dashboard' && <Dashboard key={key} {...props} />}
      {screen === 'focus-timer' && <FocusTimer {...props} />}
      {screen === 'distraction-log' && <DistractionLog {...props} />}
      {screen === 'recovery-flow' && <RecoveryFlow {...props} />}
      {screen === 'daily-missions' && <DailyMissions {...props} />}
      {screen === 'analytics' && <Analytics {...props} />}
      {screen === 'ai-coach' && <AICoach {...props} />}
      {screen === 'coach-export' && <CoachExport {...props} />}
      {screen === 'ai-chat' && <AIChat {...props} />}
    </div>
  );
}
