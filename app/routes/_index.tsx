import { json, type MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { Header } from '~/components/header/Header';
import { LottieSpinner } from '~/components/ui/LottieSpinner';
import { useState, useEffect } from 'react';

export const meta: MetaFunction = () => {
  return [
    { title: 'BIT Studio - AI-Powered Development Platform' },
    {
      name: 'description',
      content: 'Platform AI-powered untuk developer modern. Tanyakan apapun, generate kode, desain, dan solusi instan.',
    },
  ];
};

export const loader = () => json({});

// Typing Effect Component
function TypingEffect() {
  const [placeholder, setPlaceholder] = useState('');
  const [typingIndex, setTypingIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const examplePrompts = [
    'Buatkan landing page React modern',
    'Generate kode API Express untuk login user',
    'Tulis fungsi sorting array di Python',
    'Buatkan desain UI dashboard analytics',
    'Tanya apapun ke AI kami...',
  ];

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const currentPrompt = examplePrompts[typingIndex];

    if (!isDeleting && charIndex < currentPrompt.length) {
      timeout = setTimeout(() => {
        setPlaceholder(currentPrompt.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      }, 60);
    } else if (isDeleting && charIndex > 0) {
      timeout = setTimeout(() => {
        setPlaceholder(currentPrompt.slice(0, charIndex - 1));
        setCharIndex(charIndex - 1);
      }, 30);
    } else {
      timeout = setTimeout(() => {
        if (!isDeleting) {
          setIsDeleting(true);
        } else {
          setIsDeleting(false);
          setTypingIndex((typingIndex + 1) % examplePrompts.length);
        }
      }, 1200);
    }

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, typingIndex]);

  return placeholder;
}

// Landing Page Component
function LandingPageContent() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTry = () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);

    // Simulate loading time like BIT-STUDIO
    setTimeout(() => {
      // Redirect to auth signin first, then to chat
      localStorage.setItem('bitstudio_landing_prompt', prompt);
      window.location.href = '/auth/signin';
    }, 1200); // Same duration as BIT-STUDIO
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTry();
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="flex flex-col items-center space-y-6">
          <LottieSpinner size={96} />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-primary-500 mb-2">Loading BIT Studio</h1>
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
          {/* Logo/Spinner - BIT-STUDIO Style */}
          <LottieSpinner size={72} className="mb-4" />

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-extrabold text-primary-500 drop-shadow text-center mb-2">
            BIT Studio
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-gray-300 text-center max-w-xl mb-2">
            Platform AI-powered untuk developer modern. Tanyakan apapun, generate kode, desain, dan solusi instan.
          </p>
        </div>

        {/* Chatbox Hero */}
        <div className="relative w-full max-w-4xl mx-auto rounded-3xl bg-card shadow-2xl px-8 py-8 flex flex-col gap-4">
          <div className="relative">
            <input
              className="w-full bg-transparent text-lg text-white outline-none border-none"
              placeholder=""
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            {!prompt && (
              <div className="absolute inset-0 pointer-events-none">
                <span className="text-lg text-gray-400">
                  <TypingEffect />
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between mt-2">
            <button className="flex items-center gap-2 px-3 py-1 bg-card border border-gray-700 rounded-full text-gray-300 text-sm">
              <span className="text-lg">+</span> Public
            </button>
            <button
              className="w-10 h-10 flex items-center justify-center bg-primary-500 rounded-full shadow hover:bg-primary-600 transition disabled:opacity-50"
              onClick={handleTry}
              disabled={isLoading}
            >
              <span className="text-white text-lg">↑</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Index() {
  return (
    <div className="flex flex-col h-full w-full">
      <ClientOnly>{() => <LandingPageContent />}</ClientOnly>
    </div>
  );
}
