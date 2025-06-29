import { json, type LoaderFunctionArgs, type MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { Header } from '~/components/header/Header';
import BackgroundRays from '~/components/ui/BackgroundRays';
import { getUserIdFromRequest } from '~/lib/auth/getUserId';
import { prisma } from '~/lib/.server/prisma';

export const meta: MetaFunction = () => {
  return [{ title: 'BIT Studio - Chat' }, { name: 'description', content: 'AI-powered development chat' }];
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    throw new Response('Unauthorized', { status: 401 });
  }

  const { urlId } = params;
  if (!urlId) {
    throw new Response('Chat ID required', { status: 400 });
  }

  try {
    const chat = await prisma.chat.findFirst({
      where: {
        urlId,
        userId,
      },
    });

    if (!chat) {
      throw new Response('Chat not found', { status: 404 });
    }

    return json({ chat });
  } catch (error) {
    console.error('Error loading chat:', error);
    throw new Response('Internal Server Error', { status: 500 });
  }
}

export default function ChatPage() {
  return (
    <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1">
      <BackgroundRays />
      <Header />
      <ClientOnly fallback={<BaseChat />}>{() => <Chat />}</ClientOnly>
    </div>
  );
}
