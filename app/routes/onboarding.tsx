import { json, type MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { Header } from '~/components/header/Header';
import { LottieSpinner } from '~/components/ui/LottieSpinner';
import { useState, useEffect } from 'react';
import { useNavigate } from '@remix-run/react';

export const meta: MetaFunction = () => {
  return [{ title: 'BIT Studio - Welcome' }, { name: 'description', content: 'Welcome to BIT Studio' }];
};

export const loader = () => json({});

function OnboardingContent() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState('');

  const handleComplete = async () => {
    setIsLoading(true);

    // Save onboarding completion
    localStorage.setItem('onboarding_complete', 'true');
    if (userName) {
      localStorage.setItem('user_name', userName);
    }

    // Check for pending prompt
    const pendingPrompt = localStorage.getItem('bitstudio_landing_prompt');
    if (pendingPrompt) {
      localStorage.removeItem('bitstudio_landing_prompt');
      navigate('/chat?prompt=' + encodeURIComponent(pendingPrompt));
    } else {
      navigate('/chat');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="flex flex-col items-center space-y-6">
          <LottieSpinner size={96} />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-primary-500 mb-2">Setting up your workspace</h1>
            <p className="text-gray-400">Preparing your development environment...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center pt-32 pb-12">
        <div className="flex flex-col items-center mb-8">
          <LottieSpinner size={72} className="mb-4" />
          <h1 className="text-4xl md:text-5xl font-extrabold text-primary-500 drop-shadow text-center mb-2">
            Welcome to BIT Studio
          </h1>
          <p className="text-lg text-gray-300 text-center max-w-xl mb-8">
            Let's get you started with your AI-powered development journey
          </p>
        </div>

        <div className="w-full max-w-md mx-auto space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              What should we call you? (optional)
            </label>
            <input
              id="name"
              type="text"
              placeholder="Your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-4 py-3 bg-card border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
          </div>

          <button
            onClick={handleComplete}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Get Started
          </button>
        </div>
      </main>
    </div>
  );
}

export default function Onboarding() {
  return (
    <div className="flex flex-col h-full w-full">
      <ClientOnly>{() => <OnboardingContent />}</ClientOnly>
    </div>
  );
}
