import { json, type MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { Header } from '~/components/header/Header';
import BackgroundRays from '~/components/ui/BackgroundRays';
import { LottieSpinner } from '~/components/ui/LottieSpinner';
import { useEffect, useState } from 'react';
import { useNavigate } from '@remix-run/react';
import { sessionManager } from '~/lib/auth/sessionManager';

export const meta: MetaFunction = () => {
  return [{ title: 'BIT Studio - Chat' }, { name: 'description', content: 'AI-powered development chat' }];
};

export const loader = () => json({});

function ChatRouteClient() {
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(true);
  const [validationAttempts, setValidationAttempts] = useState(0);

  useEffect(() => {
    const validateAndSetup = async () => {
      try {
        console.log('Validating session for new chat', { attempt: validationAttempts + 1 });

        const validation = await sessionManager.validateSession();

        if (!validation.isValid) {
          console.log('Session validation failed', validation);

          // Handle OAuth redirect retry
          if (validation.isOAuthRedirect && validationAttempts < 3) {
            console.log('OAuth redirect detected, retrying validation...');
            setValidationAttempts((prev) => prev + 1);
            setTimeout(() => validateAndSetup(), 1000);
            return;
          }

          // Clear stale auth state and redirect
          sessionManager.clearAuthState();
          const redirectUrl = sessionManager.getRedirectUrl(validation);
          console.log('Redirecting to', redirectUrl);
          navigate(redirectUrl);
          return;
        }

        console.log('Session and onboarding validated, proceeding with new chat');
        setIsValidating(false);
      } catch (error) {
        console.error('Error validating session:', error);
        if (validationAttempts < 3) {
          setValidationAttempts((prev) => prev + 1);
          setTimeout(() => validateAndSetup(), 1000);
        } else {
          sessionManager.clearAuthState();
          navigate('/auth/signin');
        }
      }
    };

    validateAndSetup();
  }, [navigate, validationAttempts]);

  // Show loading state while validating
  if (isValidating) {
    return (
      <div className="flex flex-col h-full w-full">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Setting up your workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1">
      <BackgroundRays />
      <Header />
      <ClientOnly fallback={<BaseChat />}>{() => <Chat />}</ClientOnly>
    </div>
  );
}

export default function ChatPage() {
  return <ChatRouteClient />;
}
