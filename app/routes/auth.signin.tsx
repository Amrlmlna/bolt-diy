import { json, type MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { Header } from '~/components/header/Header';
import { LottieSpinner } from '~/components/ui/LottieSpinner';
import { useState, useEffect } from 'react';
import { supabase } from '~/lib/supabaseClient';
import { toast } from 'react-toastify';

export const meta: MetaFunction = () => {
  return [{ title: 'BIT Studio - Sign In' }, { name: 'description', content: 'Sign in to BIT Studio' }];
};

export const loader = () => json({});

function SignInContent() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [landingPrompt, setLandingPrompt] = useState('');

  // Check for landing prompt on component mount
  useEffect(() => {
    const prompt = localStorage.getItem('bitstudio_landing_prompt');
    if (prompt) {
      setLandingPrompt(prompt);
    }
  }, []);

  // Handle OAuth redirect completion
  useEffect(() => {
    const handleOAuthRedirect = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token');

      if (accessToken || refreshToken) {
        console.log('OAuth redirect detected, processing...');
        setLoading(true);

        try {
          // Set the session manually if tokens are in URL
          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error('Error setting OAuth session:', error);
              toast.error('Authentication failed. Please try again.');
              return;
            }
          }

          // Wait a moment for session to be established
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Check if session is now available
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session) {
            console.log('OAuth session established successfully');
            // Clear URL parameters and redirect
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, '', cleanUrl);

            // Check onboarding status
            const onboardingComplete = localStorage.getItem('onboarding_complete');
            if (onboardingComplete) {
              window.location.href = '/chat';
            } else {
              window.location.href = '/onboarding';
            }
          } else {
            console.error('OAuth session not established after redirect');
            toast.error('Authentication failed. Please try again.');
          }
        } catch (error) {
          console.error('Error handling OAuth redirect:', error);
          toast.error('Authentication failed. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    };

    handleOAuthRedirect();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Check your email for the login link!');
      // Clear the landing prompt after successful signin
      localStorage.removeItem('bitstudio_landing_prompt');
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + '/chat',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    setLoading(false);
    if (error) toast.error(error.message);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Kiri: Form Signin */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-4 py-4 min-h-screen">
        <div className="max-w-md w-full space-y-6 max-h-[90vh] overflow-auto rounded-2xl bg-card shadow-lg p-6 flex flex-col justify-center">
          <div className="flex flex-col items-center">
            {/* Logo */}
            <div className="w-12 h-12 mb-2 rounded-lg bg-primary-500 flex items-center justify-center">
              <span className="text-white font-bold text-xl">B</span>
            </div>
            <h2 className="mt-2 text-center text-3xl font-extrabold text-white">Sign in to your account</h2>
            <p className="mt-2 text-center text-sm text-gray-400">
              Or{' '}
              <a href="/auth/signup" className="font-medium text-primary-500 hover:underline">
                create a new account
              </a>
            </p>

            {/* Show landing prompt if exists */}
            {landingPrompt && (
              <div className="mt-4 p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg">
                <p className="text-sm text-primary-300">
                  <strong>Your prompt:</strong> {landingPrompt}
                </p>
              </div>
            )}
          </div>

          {/* Sign In Form */}
          <form onSubmit={handleSignIn} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-input border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <LottieSpinner size={20} className="mr-2" />
                  Sending...
                </div>
              ) : (
                'Sign in with Email'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-gray-400">Or continue with</span>
              </div>
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="mt-6 space-y-3">
            <button
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-700 rounded-lg text-gray-300 bg-card hover:bg-gray-800 transition-colors disabled:opacity-50"
              onClick={() => handleOAuth('google')}
              disabled={loading}
            >
              <span className="i-ph:google-logo text-lg mr-3" />
              Sign in with Google
            </button>

            <button
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-700 rounded-lg text-gray-300 bg-card hover:bg-gray-800 transition-colors disabled:opacity-50"
              onClick={() => handleOAuth('github')}
              disabled={loading}
            >
              <span className="i-ph:github-logo text-lg mr-3" />
              Sign in with GitHub
            </button>
          </div>
        </div>
      </div>

      {/* Kanan: Visual Gradient + Chatbox Hero */}
      <div className="hidden md:flex w-1/2 items-center justify-center pt-3 pr-3 pb-3 md:pt-6 md:pr-6 md:pb-6 bg-gradient-to-br from-card via-card to-primary-500 relative rounded-[12px] min-h-screen">
        <div className="absolute inset-0 bg-gradient-to-br from-card via-blue-900/60 to-pink-400/40 rounded-[12px]" />
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
          <div className="max-w-md w-full mx-auto flex flex-col items-center justify-center">
            <div className="bg-white/90 rounded-xl shadow-lg px-10 py-8 flex items-center gap-4 min-h-[64px] w-full">
              <input
                className="flex-1 bg-transparent text-lg text-gray-800 placeholder-gray-400 outline-none border-none"
                placeholder={landingPrompt || 'Ask BIT Studio to build your next project...'}
                disabled
              />
              <button
                className="w-12 h-12 flex items-center justify-center bg-primary-500 rounded-full shadow hover:bg-primary-600 transition"
                disabled
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Animation */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <LottieSpinner size={60} />
        </div>
      )}
    </div>
  );
}

export default function SignIn() {
  return (
    <div className="flex flex-col h-full w-full">
      <ClientOnly>{() => <SignInContent />}</ClientOnly>
    </div>
  );
}
