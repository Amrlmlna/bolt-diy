import { type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { redirect } from '@remix-run/cloudflare';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    // Handle OAuth error
    return redirect('/auth/signin?error=' + encodeURIComponent(error));
  }

  if (!code) {
    // No code provided, redirect to signin
    return redirect('/auth/signin');
  }

  try {
    // Exchange code for session
    const { supabase } = await import('~/lib/supabaseClient');
    const { data, error: authError } = await supabase.auth.exchangeCodeForSession(code);

    if (authError) {
      console.error('Auth error:', authError);
      return redirect('/auth/signin?error=' + encodeURIComponent(authError.message));
    }

    if (!data.session) {
      return redirect('/auth/signin?error=No session created');
    }

    // Check if user has pending prompt from landing page
    const pendingPrompt = localStorage.getItem('bitstudio_landing_prompt');
    if (pendingPrompt) {
      localStorage.removeItem('bitstudio_landing_prompt');
      // Redirect to chat with pending prompt
      return redirect('/chat?prompt=' + encodeURIComponent(pendingPrompt));
    }

    // Redirect to chat
    return redirect('/chat');
  } catch (error) {
    console.error('Callback error:', error);
    return redirect('/auth/signin?error=Authentication failed');
  }
}
